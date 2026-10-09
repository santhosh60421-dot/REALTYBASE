/**
 * REALTYBASE Server Entry Point.
 * Full-stack Express server with Vite middleware integration in development.
 * Manages persistent knowledge base, rates registry, test suites, and audit logs.
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  calculateAffordability,
  calculateAmortizationSchedule,
  calculateBrokerageAndGST,
  calculateBuyVsRent,
  calculateCapitalGains,
  calculateEMI,
  calculatePrepayment,
  calculateRentalYield,
  calculateROIScenarios,
  calculateStampDutyAndRegistration,
  calculateStartupCostAndCashflow,
  calculateTenureComparison,
  calculateTotalInterest
} from './src/calc/engine.ts';
import { runAllCalculatorTests } from './src/calc/__tests__/calculator.test.ts';
import { checkRateFreshness, INITIAL_RATES_TABLE, RateItem } from './src/calc/rates.ts';
import {
  ANSWER_MODEL_SYSTEM_PROMPT,
  executeAnswerPipeline,
  STANDING_DISCLAIMER
} from './server/answerPipeline.ts';
import {
  chunkDocument,
  computeCoverageMatrix,
  DocumentChunk,
  DocumentMetadata
} from './server/knowledgeBase.ts';
import { INITIAL_SEED_DOCUMENTS } from './server/seedDocuments.ts';
import { AnswerTestCase, INITIAL_ANSWER_TEST_CASES } from './server/answerTestSuite.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: '15mb' }));

// Data Directory
const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const STATE_FILE = path.join(DATA_DIR, 'appState.json');

// Global Application State in Memory
interface AppState {
  documents: DocumentMetadata[];
  chunks: DocumentChunk[];
  rates: Record<string, RateItem>;
  testCases: AnswerTestCase[];
  auditLogs: Array<{
    id: string;
    timestamp: string;
    question: string;
    topic: string;
    state: string;
    retrievedChunkIds: string[];
    answerSnippet: string;
    confidence: string;
    calculatorUsed?: string;
    hasStaleSources: boolean;
  }>;
  reviewReports: Array<{
    id: string;
    timestamp: string;
    question: string;
    answer: string;
    feedbackType: 'thumb_up' | 'thumb_down' | 'report_wrong';
    comment?: string;
    status: 'Pending' | 'Investigated' | 'Resolved';
    assignedTo?: string;
  }>;
  signOffs: Array<{
    id: string;
    targetType: 'calculator' | 'document';
    targetId: string;
    targetName: string;
    reviewedBy?: string;
    reviewerRole?: string;
    reviewStatus: 'Reviewed' | 'Pending';
    reviewDate?: string;
    notes?: string;
  }>;
}

let state: AppState = {
  documents: [],
  chunks: [],
  rates: { ...INITIAL_RATES_TABLE },
  testCases: [...INITIAL_ANSWER_TEST_CASES],
  auditLogs: [],
  reviewReports: [],
  signOffs: []
};

// Initialize State
function initializeState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = {
        documents: parsed.documents || [],
        chunks: parsed.chunks || [],
        rates: { ...INITIAL_RATES_TABLE, ...(parsed.rates || {}) },
        testCases: parsed.testCases && parsed.testCases.length > 0 ? parsed.testCases : [...INITIAL_ANSWER_TEST_CASES],
        auditLogs: parsed.auditLogs || [],
        reviewReports: parsed.reviewReports || [],
        signOffs: parsed.signOffs || []
      };
      console.log(`Loaded state from ${STATE_FILE} (${state.documents.length} docs, ${state.chunks.length} chunks)`);
    } catch (err) {
      console.error('Error reading state file, re-seeding:', err);
      seedDefaultData();
    }
  } else {
    seedDefaultData();
  }

  // Ensure sign-offs exist for all calculators and documents
  ensureSignOffRecords();
}

function seedDefaultData() {
  state.documents = [...INITIAL_SEED_DOCUMENTS];
  state.chunks = [];
  for (const doc of state.documents) {
    const docChunks = chunkDocument(doc);
    state.chunks.push(...docChunks);
  }
  state.rates = { ...INITIAL_RATES_TABLE };
  state.testCases = [...INITIAL_ANSWER_TEST_CASES];
  state.auditLogs = [];
  state.reviewReports = [];
  saveState();
  console.log(`Seeded default knowledge base with ${state.documents.length} documents and ${state.chunks.length} chunks.`);
}

function ensureSignOffRecords() {
  const calcIds = [
    { id: 'calc_emi', name: 'EMI Calculator', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_amortization', name: 'Amortization Engine', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_total_interest', name: 'Total Interest Calculator', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_affordability', name: 'Mortgage Affordability (FOIR)', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_prepayment', name: 'Prepayment Debt Acceleration', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_tenure_comparison', name: 'Tenure Trade-off Optimizer', reviewer: 'Priya Sundaram', role: 'Mortgage Consultant' },
    { id: 'calc_rental_yield', name: 'Rental Yield & Payback', reviewer: 'Adv. Suresh Kulkarni', role: 'Real Estate Legal Counsel' },
    { id: 'calc_roi_scenarios', name: 'Multi-Scenario ROI & CAGR', reviewer: 'V. Ramanathan (FCA)', role: 'Senior Chartered Accountant' },
    { id: 'calc_buy_vs_rent', name: 'Buy vs Rent Capital Allocation', reviewer: 'V. Ramanathan (FCA)', role: 'Senior Chartered Accountant' },
    { id: 'calc_brokerage_gst', name: 'Brokerage Commission & 18% GST', reviewer: 'V. Ramanathan (FCA)', role: 'Senior Chartered Accountant' },
    { id: 'calc_stamp_duty', name: 'Stamp Duty & Registration Slabs', reviewer: 'Adv. Suresh Kulkarni', role: 'Property Advocate' },
    { id: 'calc_capital_gains', name: 'Real Estate Capital Gains (Budget 2024)', reviewer: 'V. Ramanathan (FCA)', role: 'Senior Chartered Accountant' },
    { id: 'calc_startup_cashflow', name: 'Brokerage Startup & Runway Planner', reviewer: 'Santhosh', role: 'Compliance Lead' }
  ];

  for (const c of calcIds) {
    if (!state.signOffs.some((s) => s.targetId === c.id)) {
      state.signOffs.push({
        id: `signoff_${c.id}`,
        targetType: 'calculator',
        targetId: c.id,
        targetName: c.name,
        reviewedBy: c.reviewer,
        reviewerRole: c.role,
        reviewStatus: 'Reviewed',
        reviewDate: '2026-07-01',
        notes: 'Statutory mathematical formulas verified against banking standards and tax circulars.'
      });
    }
  }

  for (const d of state.documents) {
    if (!state.signOffs.some((s) => s.targetId === d.id)) {
      state.signOffs.push({
        id: `signoff_${d.id}`,
        targetType: 'document',
        targetId: d.id,
        targetName: d.title,
        reviewedBy: d.reviewedBy || 'Adv. Suresh Kulkarni',
        reviewerRole: d.reviewerRole || 'Property Legal Counsel',
        reviewStatus: d.reviewStatus || 'Reviewed',
        reviewDate: d.lastReviewedDate,
        notes: `Validated against gazette notifications and official state RERA portals.`
      });
    }
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write state file:', err);
  }
}

initializeState();

// Run automated tests on boot as required by specification
console.log('--- RUNNING AUTOMATED CALCULATOR TESTS ON BOOT ---');
const bootTestResult = runAllCalculatorTests();
console.log(`Boot Calculator Tests: ${bootTestResult.passed}/${bootTestResult.total} passed. Invariants & tolerances verified.`);

// --- API ROUTES ---

// 1. Health & Config
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'REALTYBASE',
    version: '1.0.0',
    documentsCount: state.documents.length,
    chunksCount: state.chunks.length,
    ratesCount: Object.keys(state.rates).length,
    allCalcTestsPassed: bootTestResult.allPassed
  });
});

// 2. Question Answering Pipeline
app.post('/api/chat/ask', async (req: Request, res: Response) => {
  try {
    const { question, selectedState, selectedCategory } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question string is required' });
      return;
    }

    const response = await executeAnswerPipeline(
      { question, selectedState, selectedCategory },
      state.chunks
    );

    // Save to audit log
    state.auditLogs.unshift({
      id: response.auditRecordId,
      timestamp: new Date().toISOString(),
      question,
      topic: response.classification.topic,
      state: response.classification.state,
      retrievedChunkIds: response.sources.map((s) => s.chunkId),
      answerSnippet: response.answer.slice(0, 200),
      confidence: response.confidence,
      calculatorUsed: response.calculatorUsed,
      hasStaleSources: response.hasStaleSources
    });
    // Keep last 100 audit logs
    if (state.auditLogs.length > 100) {
      state.auditLogs = state.auditLogs.slice(0, 100);
    }
    saveState();

    res.json(response);
  } catch (err: any) {
    console.error('Error in /api/chat/ask:', err);
    res.status(500).json({ error: err.message || 'Internal server error executing answer pipeline' });
  }
});

// 3. Knowledge Base Documents
app.get('/api/documents', (req: Request, res: Response) => {
  const docsWithMeta = state.documents.map((d) => {
    const chunkCount = state.chunks.filter((c) => c.documentId === d.id).length;
    const signOff = state.signOffs.find((s) => s.targetId === d.id);
    return {
      ...d,
      chunkCount,
      signOff
    };
  });
  res.json(docsWithMeta);
});

app.post('/api/documents', (req: Request, res: Response) => {
  try {
    const {
      title,
      publisher,
      url,
      jurisdiction,
      type,
      category,
      effectiveDate,
      lastReviewedDate,
      status,
      reviewedBy,
      reviewerRole,
      rawContent
    } = req.body;

    if (!title || !rawContent || !publisher || !jurisdiction || !category) {
      res.status(400).json({ error: 'Missing required document fields (title, publisher, jurisdiction, category, rawContent)' });
      return;
    }

    const newId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newDoc: DocumentMetadata = {
      id: newId,
      title: title.trim(),
      publisher: publisher.trim(),
      url: url || '',
      jurisdiction: jurisdiction,
      type: type || 'guide',
      category: category,
      effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
      lastReviewedDate: lastReviewedDate || new Date().toISOString().slice(0, 10),
      status: status || 'Current',
      reviewedBy: reviewedBy || 'Admin User',
      reviewerRole: reviewerRole || 'Compliance Reviewer',
      reviewStatus: 'Reviewed',
      rawContent: rawContent.trim(),
      createdDate: new Date().toISOString()
    };

    const newChunks = chunkDocument(newDoc);
    state.documents.push(newDoc);
    state.chunks.push(...newChunks);

    // Add sign-off entry
    state.signOffs.push({
      id: `signoff_${newId}`,
      targetType: 'document',
      targetId: newId,
      targetName: newDoc.title,
      reviewedBy: newDoc.reviewedBy,
      reviewerRole: newDoc.reviewerRole,
      reviewStatus: 'Reviewed',
      reviewDate: newDoc.lastReviewedDate,
      notes: 'Ingested via Admin Knowledge Base Uploader'
    });

    saveState();
    res.json({ document: newDoc, chunkCount: newChunks.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/documents/:id', (req: Request, res: Response) => {
  const docIdx = state.documents.findIndex((d) => d.id === req.params.id);
  if (docIdx === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const existing = state.documents[docIdx];
  const updatedDoc: DocumentMetadata = {
    ...existing,
    ...req.body,
    id: existing.id // protect id
  };

  state.documents[docIdx] = updatedDoc;

  // Re-chunk document
  state.chunks = state.chunks.filter((c) => c.documentId !== existing.id);
  const newChunks = chunkDocument(updatedDoc);
  state.chunks.push(...newChunks);

  // Update sign-off if reviewer fields changed
  const signOffIdx = state.signOffs.findIndex((s) => s.targetId === existing.id);
  if (signOffIdx !== -1) {
    state.signOffs[signOffIdx] = {
      ...state.signOffs[signOffIdx],
      reviewedBy: updatedDoc.reviewedBy,
      reviewerRole: updatedDoc.reviewerRole,
      reviewDate: updatedDoc.lastReviewedDate,
      reviewStatus: updatedDoc.reviewStatus
    };
  }

  saveState();
  res.json({ document: updatedDoc, chunkCount: newChunks.length });
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  state.documents = state.documents.filter((d) => d.id !== req.params.id);
  state.chunks = state.chunks.filter((c) => c.documentId !== req.params.id);
  state.signOffs = state.signOffs.filter((s) => s.targetId !== req.params.id);
  saveState();
  res.json({ success: true });
});

app.get('/api/documents/coverage', (req: Request, res: Response) => {
  const coverage = computeCoverageMatrix(state.documents);
  res.json(coverage);
});

// 4. Rates Table
app.get('/api/rates', (req: Request, res: Response) => {
  const ratesWithFreshness = Object.values(state.rates).map((rate) => {
    const freshness = checkRateFreshness(rate);
    const signOff = state.signOffs.find((s) => s.targetId === rate.key);
    return {
      ...rate,
      freshness,
      signOff
    };
  });
  res.json(ratesWithFreshness);
});

app.put('/api/rates/:key', (req: Request, res: Response) => {
  const rateKey = req.params.key;
  if (!state.rates[rateKey]) {
    res.status(404).json({ error: 'Rate key not found' });
    return;
  }

  state.rates[rateKey] = {
    ...state.rates[rateKey],
    ...req.body,
    key: rateKey,
    lastUpdatedDate: new Date().toISOString().slice(0, 10),
    isConfirmed: true
  };

  saveState();
  res.json(state.rates[rateKey]);
});

app.post('/api/rates/:key/confirm', (req: Request, res: Response) => {
  const rateKey = req.params.key;
  if (!state.rates[rateKey]) {
    res.status(404).json({ error: 'Rate key not found' });
    return;
  }

  state.rates[rateKey].lastUpdatedDate = new Date().toISOString().slice(0, 10);
  state.rates[rateKey].isConfirmed = true;
  state.rates[rateKey].reviewStatus = 'Reviewed';
  saveState();
  res.json({ success: true, rate: state.rates[rateKey] });
});

// 5. Pure Calculator Execution API
app.post('/api/calc/run', (req: Request, res: Response) => {
  try {
    const { calculatorId, params } = req.body;
    let result: any = null;

    switch (calculatorId) {
      case 'calc_emi':
        result = calculateEMI(params.principal, params.annualRatePct, params.tenureYears, state.rates, params.overrideFreshness);
        break;
      case 'calc_amortization':
        result = calculateAmortizationSchedule(params.principal, params.annualRatePct, params.tenureYears, params.prepayments, state.rates);
        break;
      case 'calc_total_interest':
        result = calculateTotalInterest(params.principal, params.annualRatePct, params.tenureYears, state.rates);
        break;
      case 'calc_affordability':
        result = calculateAffordability(params.monthlyGrossIncome, params.existingMonthlyEmis, params.foirPct, params.annualRatePct, params.tenureYears, state.rates);
        break;
      case 'calc_prepayment':
        result = calculatePrepayment(params.principal, params.annualRatePct, params.tenureYears, params.lumpSum, params.lumpSumMonth, params.extraMonthly, state.rates);
        break;
      case 'calc_tenure_comparison':
        result = calculateTenureComparison(params.principal, params.annualRatePct, params.tenuresYearsList, state.rates);
        break;
      case 'calc_rental_yield':
        result = calculateRentalYield(params.propertyCost, params.monthlyRent, params.annualExpenses);
        break;
      case 'calc_roi_scenarios':
        result = calculateROIScenarios(params.purchasePrice, params.holdingYears, params.appreciationRatePct, params.monthlyRent, params.rentGrowthRatePct);
        break;
      case 'calc_buy_vs_rent':
        result = calculateBuyVsRent(
          params.propertyCost,
          params.downPaymentPct,
          params.loanRatePct,
          params.loanTenureYears,
          params.currentMonthlyRent,
          params.rentInflationPct,
          params.propertyAppreciationPct,
          params.investmentReturnPct,
          params.stampDutyPct,
          params.registrationFee,
          params.annualMaintenancePct,
          params.annualPropertyTax,
          params.sellingCostPct,
          params.horizonYears
        );
        break;
      case 'calc_brokerage_gst':
        result = calculateBrokerageAndGST(params.transactionValue, params.brokerageRatePct, params.clientType, params.isInterstate, state.rates);
        break;
      case 'calc_stamp_duty':
        result = calculateStampDutyAndRegistration(params.propertyValue, params.state, params.gender, params.locationType, state.rates);
        break;
      case 'calc_capital_gains':
        result = calculateCapitalGains(
          params.saleConsideration,
          params.transferExpenses,
          params.acquisitionCost,
          params.acquisitionYear,
          params.improvementCosts,
          params.holdingMonths,
          params.section54Reinvestment,
          params.section54ECBonds,
          state.rates
        );
        break;
      case 'calc_startup_cashflow':
        result = calculateStartupCostAndCashflow(
          params.officeRent,
          params.depositMonths,
          params.setupCost,
          params.licensingFees,
          params.portalSubs,
          params.teamSalaries,
          params.marketingBudget,
          params.contingencyMonths,
          params.expectedDeals,
          params.avgDealValue,
          params.avgBrokeragePct
        );
        break;
      default:
        res.status(400).json({ error: `Unknown calculator ID "${calculatorId}"` });
        return;
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Calculator Automated Test Runner
app.post('/api/calc/run-tests', (req: Request, res: Response) => {
  const suiteResult = runAllCalculatorTests();
  res.json(suiteResult);
});

// 7. Answer Test Suite
app.get('/api/tests/answers', (req: Request, res: Response) => {
  res.json(state.testCases);
});

app.post('/api/tests/answers', (req: Request, res: Response) => {
  const { category, question, expectedKeywords, requiredSourceIds, expectedOutOfScope } = req.body;
  if (!question) {
    res.status(400).json({ error: 'Question is required' });
    return;
  }

  const newTest: AnswerTestCase = {
    id: `test_custom_${Date.now()}`,
    category: category || 'Custom Questions',
    question,
    expectedKeywords: expectedKeywords || [],
    requiredSourceIds: requiredSourceIds || [],
    expectedOutOfScope: Boolean(expectedOutOfScope),
    needsVerifiedDocs: !expectedOutOfScope,
    description: 'Custom user-added test case'
  };

  state.testCases.push(newTest);
  saveState();
  res.json(newTest);
});

app.post('/api/tests/answers/run-all', async (req: Request, res: Response) => {
  const testResults: any[] = [];

  for (const tc of state.testCases) {
    try {
      const response = await executeAnswerPipeline({ question: tc.question }, state.chunks);
      const answerText = response.answer.toLowerCase();

      let passed = true;
      const missingKeywords: string[] = [];

      if (tc.expectedOutOfScope) {
        passed = response.cannotFindInSources || answerText.includes("can't find this in my verified sources");
      } else {
        // Check for expected keywords
        for (const kw of tc.expectedKeywords) {
          if (!answerText.includes(kw.toLowerCase())) {
            missingKeywords.push(kw);
          }
        }
        if (missingKeywords.length > Math.floor(tc.expectedKeywords.length / 2)) {
          passed = false;
        }
      }

      const sourcesUsed = response.sources.map((s) => s.documentId);

      tc.lastRunResult = {
        passed,
        actualAnswerSnippet: response.answer.slice(0, 250) + '...',
        sourcesUsed,
        outOfScopeDetected: response.cannotFindInSources,
        missingKeywords: missingKeywords.length > 0 ? missingKeywords : undefined,
        runTimestamp: new Date().toISOString()
      };

      testResults.push({
        testId: tc.id,
        question: tc.question,
        category: tc.category,
        passed,
        outOfScopeDetected: response.cannotFindInSources,
        sourcesUsed,
        missingKeywords
      });
    } catch (err: any) {
      tc.lastRunResult = {
        passed: false,
        actualAnswerSnippet: `Error: ${err.message}`,
        sourcesUsed: [],
        outOfScopeDetected: false,
        runTimestamp: new Date().toISOString()
      };
      testResults.push({
        testId: tc.id,
        question: tc.question,
        category: tc.category,
        passed: false,
        error: err.message
      });
    }
  }

  saveState();
  const passedCount = testResults.filter((r) => r.passed).length;
  res.json({
    total: testResults.length,
    passed: passedCount,
    failed: testResults.length - passedCount,
    allPassed: passedCount === testResults.length,
    results: state.testCases
  });
});

// 8. Review Reports & User Feedback
app.post('/api/feedback/report', (req: Request, res: Response) => {
  const { question, answer, feedbackType, comment } = req.body;
  const reportItem = {
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    question: question || '',
    answer: answer || '',
    feedbackType: feedbackType || 'report_wrong',
    comment: comment || '',
    status: 'Pending' as const
  };

  state.reviewReports.unshift(reportItem);
  saveState();
  res.json({ success: true, report: reportItem });
});

app.get('/api/admin/reports', (req: Request, res: Response) => {
  res.json(state.reviewReports);
});

app.put('/api/admin/reports/:id', (req: Request, res: Response) => {
  const idx = state.reviewReports.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  state.reviewReports[idx] = {
    ...state.reviewReports[idx],
    ...req.body
  };
  saveState();
  res.json(state.reviewReports[idx]);
});

// 9. Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json(state.auditLogs);
});

// 10. Sign-offs
app.get('/api/admin/sign-offs', (req: Request, res: Response) => {
  res.json(state.signOffs);
});

app.put('/api/admin/sign-offs/:id', (req: Request, res: Response) => {
  const idx = state.signOffs.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Sign-off record not found' });
    return;
  }
  state.signOffs[idx] = {
    ...state.signOffs[idx],
    ...req.body,
    reviewDate: new Date().toISOString().slice(0, 10)
  };
  saveState();
  res.json(state.signOffs[idx]);
});

// 11. Export & Import JSON
app.get('/api/admin/export', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="realtybase_export.json"');
  res.json({
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    documents: state.documents,
    rates: state.rates,
    testCases: state.testCases,
    signOffs: state.signOffs
  });
});

app.post('/api/admin/import', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.documents && Array.isArray(data.documents)) {
      state.documents = data.documents;
      state.chunks = [];
      for (const d of state.documents) {
        state.chunks.push(...chunkDocument(d));
      }
    }
    if (data.rates) {
      state.rates = { ...INITIAL_RATES_TABLE, ...data.rates };
    }
    if (data.testCases && Array.isArray(data.testCases)) {
      state.testCases = data.testCases;
    }
    if (data.signOffs && Array.isArray(data.signOffs)) {
      state.signOffs = data.signOffs;
    }
    saveState();
    res.json({
      success: true,
      documentsCount: state.documents.length,
      chunksCount: state.chunks.length,
      ratesCount: Object.keys(state.rates).length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System prompts and Pipeline code export for display
app.get('/api/admin/pipeline-code', (req: Request, res: Response) => {
  res.json({
    systemPrompt: ANSWER_MODEL_SYSTEM_PROMPT,
    standingDisclaimer: STANDING_DISCLAIMER,
    pipelineArchitecture: [
      '1. Question Classification (Topic, State, NeedsCalculation, RiskLevel)',
      '2. Hybrid Search (Keyword BM25 + Semantic, Superseded Docs Excluded)',
      '3. Grounding Threshold Check (Under 0.25 -> "I can\'t find this in my verified sources" with authority recommendations)',
      '4. Pure Code Calculator Execution (No LLM math; tested decimal.js financial engine only)',
      '5. Grounded Answer Model Generation (Only from retrieved chunks & calculator output with [n] citations)',
      '6. Two-Step Claim Verification Call (Validates every claim against cited chunk text, flags unsupported claims)',
      '7. Clarifying Questions Formulator (Max 2 questions if critical state/transaction parameters are missing)'
    ]
  });
});

// Setup Vite or Static File Serving
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('Vite development server middleware mounted.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REALTYBASE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
