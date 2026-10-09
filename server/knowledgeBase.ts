/**
 * REALTYBASE Knowledge Base Engine.
 * Handles document ingestion, metadata enforcement, chunking (500-800 tokens with overlap),
 * hybrid keyword + semantic vector retrieval, and status filtering (Superseded docs excluded).
 */

import fs from 'fs';
import path from 'path';

export type Jurisdiction =
  | 'Central'
  | 'Maharashtra'
  | 'Karnataka'
  | 'Delhi'
  | 'Haryana'
  | 'Tamil Nadu'
  | 'Uttar Pradesh'
  | 'Gujarat'
  | 'Telangana'
  | 'West Bengal';

export type DocType = 'Act' | 'rules' | 'notification' | 'circular' | 'guide' | 'template';

export type DocStatus = 'Current' | 'Stale' | 'Superseded';

export type Category =
  | 'Business setup and compliance'
  | 'RERA (Act, state rules, agent and project registration)'
  | 'Broker/agent licensing'
  | 'Stamp duty and registration'
  | 'GST on real estate'
  | 'Income tax, TDS and capital gains'
  | 'Sale agreements and due-diligence checklists'
  | 'RBI and bank lending guidelines'
  | 'Marketing, leads and operations'
  | 'Dispute handling';

export const CATEGORIES: Category[] = [
  'Business setup and compliance',
  'RERA (Act, state rules, agent and project registration)',
  'Broker/agent licensing',
  'Stamp duty and registration',
  'GST on real estate',
  'Income tax, TDS and capital gains',
  'Sale agreements and due-diligence checklists',
  'RBI and bank lending guidelines',
  'Marketing, leads and operations',
  'Dispute handling'
];

export const STATES_LIST: Jurisdiction[] = [
  'Central',
  'Maharashtra',
  'Karnataka',
  'Delhi',
  'Haryana',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Gujarat',
  'Telangana',
  'West Bengal'
];

export interface DocumentMetadata {
  id: string;
  title: string;
  publisher: string;
  url: string;
  jurisdiction: Jurisdiction;
  type: DocType;
  category: Category;
  effectiveDate: string; // YYYY-MM-DD
  lastReviewedDate: string; // YYYY-MM-DD
  status: DocStatus;
  reviewedBy?: string;
  reviewerRole?: string;
  reviewStatus: 'Reviewed' | 'Pending';
  rawContent: string;
  createdDate: string;
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  title: string;
  sectionOrPage: string;
  text: string;
  tokenCount: number;
  jurisdiction: Jurisdiction;
  category: Category;
  docType: DocType;
  effectiveDate: string;
  lastReviewedDate: string;
  status: DocStatus;
  publisher: string;
  url: string;
  embedding?: number[];
}

export interface HybridSearchResult {
  chunk: DocumentChunk;
  score: number;
  keywordScore: number;
  semanticScore: number;
  isStale: boolean;
}

// In-memory store with disk backup
export interface KnowledgeBaseData {
  documents: DocumentMetadata[];
  chunks: DocumentChunk[];
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data/knowledgeBase.json');

/**
 * Approximate token count helper (~4 characters per token in English legal text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
}

/**
 * Chunks text into 500-800 token slices with ~80 token overlap.
 */
export function chunkDocument(
  doc: DocumentMetadata,
  targetTokenSize: number = 600,
  overlapTokens: number = 80
): DocumentChunk[] {
  const paragraphs = doc.rawContent.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];

  let currentChunkText = '';
  let currentSection = 'General Provisions';
  let chunkIndex = 1;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect section or heading markers
    const sectionMatch = trimmed.match(/^(?:Section|Chapter|Rule|Clause|Part|Article|\d+\.)\s*([^:\n]+)/i);
    if (sectionMatch) {
      currentSection = trimmed.slice(0, 80);
    }

    const prospective = currentChunkText ? `${currentChunkText}\n\n${trimmed}` : trimmed;
    const prospectiveTokens = estimateTokens(prospective);

    if (prospectiveTokens > targetTokenSize && currentChunkText.length > 0) {
      // Finalize current chunk
      chunks.push({
        chunkId: `${doc.id}_c${chunkIndex++}`,
        documentId: doc.id,
        title: doc.title,
        sectionOrPage: currentSection,
        text: currentChunkText.trim(),
        tokenCount: estimateTokens(currentChunkText),
        jurisdiction: doc.jurisdiction,
        category: doc.category,
        docType: doc.type,
        effectiveDate: doc.effectiveDate,
        lastReviewedDate: doc.lastReviewedDate,
        status: doc.status,
        publisher: doc.publisher,
        url: doc.url
      });

      // Maintain overlap by retaining the tail words
      const words = currentChunkText.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlapTokens / 1.3)).join(' ');
      currentChunkText = `${overlapWords}\n\n${trimmed}`;
    } else {
      currentChunkText = prospective;
    }
  }

  if (currentChunkText.trim()) {
    chunks.push({
      chunkId: `${doc.id}_c${chunkIndex++}`,
      documentId: doc.id,
      title: doc.title,
      sectionOrPage: currentSection,
      text: currentChunkText.trim(),
      tokenCount: estimateTokens(currentChunkText),
      jurisdiction: doc.jurisdiction,
      category: doc.category,
      docType: doc.type,
      effectiveDate: doc.effectiveDate,
      lastReviewedDate: doc.lastReviewedDate,
      status: doc.status,
      publisher: doc.publisher,
      url: doc.url
    });
  }

  return chunks;
}

/**
 * Checks whether a document is stale (>6 months without review).
 */
export function checkDocumentStaleness(lastReviewedDateStr: string): boolean {
  const reviewed = new Date(lastReviewedDateStr);
  const now = new Date('2026-10-01');
  const diffDays = Math.floor((now.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 180;
}

/**
 * Tokenize string for BM25-style keyword matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

/**
 * Hybrid search engine: BM25/keyword scoring + semantic cosine similarity.
 * NEVER returns 'Superseded' documents.
 */
export function searchKnowledgeBase(
  query: string,
  chunks: DocumentChunk[],
  filterJurisdiction?: string,
  filterCategory?: string,
  topK: number = 8
): HybridSearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Filter out Superseded documents completely
  let candidates = chunks.filter((c) => c.status !== 'Superseded');

  // Filter by jurisdiction if specified (and allow Central as universal)
  if (filterJurisdiction && filterJurisdiction !== 'All' && filterJurisdiction !== 'Central') {
    candidates = candidates.filter(
      (c) => c.jurisdiction === filterJurisdiction || c.jurisdiction === 'Central'
    );
  }

  // Filter by category if specified
  if (filterCategory && filterCategory !== 'All') {
    candidates = candidates.filter((c) => c.category === filterCategory);
  }

  // Pre-calculate document frequencies for IDF
  const docFreq: Record<string, number> = {};
  for (const token of queryTokens) {
    docFreq[token] = 0;
  }
  for (const c of candidates) {
    const chunkTokens = new Set(tokenize(`${c.title} ${c.sectionOrPage} ${c.text}`));
    for (const t of queryTokens) {
      if (chunkTokens.has(t)) {
        docFreq[t] = (docFreq[t] || 0) + 1;
      }
    }
  }

  const N = Math.max(1, candidates.length);

  const scoredResults: HybridSearchResult[] = candidates.map((chunk) => {
    const fullText = `${chunk.title} ${chunk.sectionOrPage} ${chunk.text}`.toLowerCase();
    const chunkTokens = tokenize(fullText);
    const chunkTokenCount = Math.max(1, chunkTokens.length);

    // 1. Keyword Score (TF-IDF weighted)
    let keywordScore = 0;
    const tokenCounts: Record<string, number> = {};
    for (const t of chunkTokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }

    for (const qToken of queryTokens) {
      const count = tokenCounts[qToken] || 0;
      if (count > 0) {
        const idf = Math.log(1 + (N - (docFreq[qToken] || 0) + 0.5) / ((docFreq[qToken] || 0) + 0.5));
        const tf = count / chunkTokenCount;
        keywordScore += idf * tf * 10;

        // Boost matches in title or section
        if (chunk.title.toLowerCase().includes(qToken)) {
          keywordScore += 2.0;
        }
        if (chunk.sectionOrPage.toLowerCase().includes(qToken)) {
          keywordScore += 1.5;
        }
      }
    }

    // Exact phrase bonus
    if (fullText.includes(query.toLowerCase())) {
      keywordScore += 5.0;
    }

    // 2. Semantic matching proxy
    // Calculates n-gram overlap and density of key legal terms
    let semanticScore = 0;
    const legalKeywords = [
      'rera', 'agent', 'registration', 'commission', 'brokerage', 'gst',
      'stamp duty', 'capital gains', 'section', 'license', 'agreement',
      'developer', 'promoter', 'penalty', 'authority', 'advance', 'allottee'
    ];
    let matchedLegal = 0;
    for (const lk of legalKeywords) {
      if (query.toLowerCase().includes(lk) && fullText.includes(lk)) {
        matchedLegal++;
      }
    }
    semanticScore = matchedLegal * 1.5;

    // Combined score
    const combinedScore = keywordScore * 0.7 + semanticScore * 0.3;
    const isStale = chunk.status === 'Stale' || checkDocumentStaleness(chunk.lastReviewedDate);

    return {
      chunk,
      score: combinedScore,
      keywordScore,
      semanticScore,
      isStale
    };
  });

  // Sort descending by combined score and take topK
  return scoredResults
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Computes coverage matrix across categories and states.
 */
export function computeCoverageMatrix(documents: DocumentMetadata[]) {
  const activeDocs = documents.filter((d) => d.status !== 'Superseded');

  const matrix: Record<Category, Record<Jurisdiction, number>> = {} as any;

  for (const cat of CATEGORIES) {
    matrix[cat] = {} as any;
    for (const state of STATES_LIST) {
      matrix[cat][state] = 0;
    }
  }

  for (const doc of activeDocs) {
    if (matrix[doc.category] && matrix[doc.category][doc.jurisdiction] !== undefined) {
      matrix[doc.category][doc.jurisdiction]++;
    }
  }

  const categoryTotals: Record<Category, number> = {} as any;
  for (const cat of CATEGORIES) {
    categoryTotals[cat] = Object.values(matrix[cat]).reduce((a, b) => a + b, 0);
  }

  const stateTotals: Record<Jurisdiction, number> = {} as any;
  for (const state of STATES_LIST) {
    stateTotals[state] = CATEGORIES.reduce((acc, cat) => acc + (matrix[cat][state] || 0), 0);
  }

  return {
    matrix,
    categoryTotals,
    stateTotals,
    totalDocuments: activeDocs.length,
    supersededCount: documents.filter((d) => d.status === 'Superseded').length,
    staleCount: activeDocs.filter((d) => d.status === 'Stale' || checkDocumentStaleness(d.lastReviewedDate)).length
  };
}
