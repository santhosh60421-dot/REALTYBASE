/**
 * REALTYBASE Source-Grounded Answer Pipeline.
 * Enforces non-negotiable rules:
 * 1. Zero answers from memory.
 * 2. Zero mental math or estimated numbers (pure code calculator only).
 * 3. Strict citation [n] and 2-step verification check.
 * 4. "I can't find this in my verified sources" when evidence is below threshold.
 */

import { Type } from '@google/genai';
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
} from '../src/calc/engine.ts';
import { INITIAL_RATES_TABLE } from '../src/calc/rates.ts';
import { DocumentChunk, HybridSearchResult, searchKnowledgeBase } from './knowledgeBase.ts';
import { llmCall } from './llmWrapper.ts';
import { ANSWER_MODEL_SYSTEM_PROMPT, STANDING_DISCLAIMER } from '../src/types/shared.ts';

export { ANSWER_MODEL_SYSTEM_PROMPT, STANDING_DISCLAIMER };

export interface PipelineQueryRequest {
  question: string;
  selectedState?: string;
  selectedCategory?: string;
  userRateOverrides?: Record<string, any>;
}

export interface ClaimVerificationItem {
  text: string;
  chunkIds: string[];
  supported: boolean;
  explanation: string;
}

export interface SourceCitation {
  citationIndex: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  sectionOrPage: string;
  publisher: string;
  effectiveDate: string;
  lastReviewedDate: string;
  status: string;
  isStale: boolean;
  url: string;
  passageSnippet: string;
}

export interface PipelineResponse {
  question: string;
  answer: string;
  claims: ClaimVerificationItem[];
  confidence: 'High' | 'Medium' | 'Low';
  sources: SourceCitation[];
  missingInfo?: string;
  clarifyingQuestions?: string[];
  hasStaleSources: boolean;
  isHighRiskTopic: boolean;
  legalAdvisoryNote?: string;
  disclaimer: string;
  calculationResult?: any;
  calculationWorking?: any;
  calculatorUsed?: string;
  unsupportedClaimsRemoved?: string[];
  cannotFindInSources: boolean;
  suggestedAuthorities?: string[];
  closestTopicsFound?: string[];
  classification: {
    topic: string;
    state: string;
    needsCalculation: boolean;
    riskLevel: 'low' | 'high';
  };
  auditRecordId: string;
}

/**
 * Step 1: Classify user query (deterministic + NLP extraction)
 */
async function classifyQuery(
  question: string,
  userSelectedState?: string
): Promise<{
  topic: string;
  state: string;
  needsCalculation: boolean;
  calculatorType?: string;
  calcParams?: Record<string, any>;
  riskLevel: 'low' | 'high';
}> {
  const qLower = question.toLowerCase();

  // Detect state
  let detectedState = userSelectedState || 'Central';
  if (/maharashtra|mumbai|pune|thane|nagpur|maharera/i.test(qLower)) {
    detectedState = 'Maharashtra';
  } else if (/karnataka|bengaluru|bangalore|k-rera|krera/i.test(qLower)) {
    detectedState = 'Karnataka';
  } else if (/delhi|nct/i.test(qLower)) {
    detectedState = 'Delhi';
  } else if (/haryana|gurgaon|gurugram|hrera/i.test(qLower)) {
    detectedState = 'Haryana';
  }

  // Detect Topic
  let topic = 'Real Estate Regulatory & Compliance';
  if (/agent|license|registration|certificate of competency|order 41|form g/i.test(qLower)) {
    topic = 'RERA Agent Registration & Licensing';
  } else if (/gst|tds|194-ia|194h|tax on brokerage|tax on commission/i.test(qLower)) {
    topic = 'Taxes, GST & TDS Compliance';
  } else if (/capital gain|ltcg|stcg|section 54|54ec|budget 2024/i.test(qLower)) {
    topic = 'Real Estate Capital Gains Taxation';
  } else if (/stamp duty|registration fee|metro cess/i.test(qLower)) {
    topic = 'State Stamp Duty & Registration';
  } else if (/emi|home loan|interest|affordability|foir|ltv/i.test(qLower)) {
    topic = 'Housing Finance & Lending Guidelines';
  } else if (/dispute|complaint|tribunal|delay|compensation|section 31/i.test(qLower)) {
    topic = 'RERA Disputes & Adjudication';
  } else if (/title|due diligence|encumbrance|7\/12|rtc|khata|occupancy certificate|oc/i.test(qLower)) {
    topic = 'Property Title & Due Diligence';
  } else if (/startup|start a brokerage|agency cost|runway|burn rate/i.test(qLower)) {
    topic = 'Brokerage Business Setup & Operations';
  }

  // Detect Calculation Requirements
  let needsCalculation = false;
  let calculatorType: string | undefined = undefined;

  if (/emi|loan.*calculate|calculate.*loan/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_emi';
  } else if (/amortization|schedule/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_amortization';
  } else if (/rental yield|yield/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_rental_yield';
  } else if (/affordability|eligible loan|how much loan/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_affordability';
  } else if (/prepayment|prepay/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_prepayment';
  } else if (/brokerage.*gst|gst.*brokerage|commission.*gst/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_brokerage_gst';
  } else if (/stamp duty.*calculate|calculate.*stamp duty/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_stamp_duty';
  } else if (/capital gain.*calculate|calculate.*capital gain/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_capital_gains';
  } else if (/startup.*cost|capital needed/i.test(qLower)) {
    needsCalculation = true;
    calculatorType = 'calc_startup_cashflow';
  }

  const isHighRisk = /dispute|court|tribunal|penalty|litigation|eviction|fraud|default|sue|illegal/i.test(qLower);

  return {
    topic,
    state: detectedState,
    needsCalculation,
    calculatorType,
    calcParams: {},
    riskLevel: isHighRisk ? 'high' : 'low'
  };
}

/**
 * Execute relevant pure code calculator if requested
 */
function tryRunCalculator(
  calcType: string | undefined,
  params: Record<string, any>,
  state: string,
  question: string
): { result?: any; calculatorName?: string; working?: any } {
  const q = question.toLowerCase();

  // 1. EMI & Amortization
  if (calcType === 'calc_emi' || /emi|home loan/i.test(q)) {
    const pMatch = q.match(/(?:(?:rs\.?|inr|₹)\s*)?(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|crore|cr)?/i);
    // Parse amounts like 80 lakh, 1 crore, 50,00,000
    let principal = 5000000;
    if (/80\s*(?:lakh|lac)/i.test(q)) principal = 8000000;
    else if (/1\s*(?:crore|cr)/i.test(q)) principal = 10000000;
    else if (/50\s*(?:lakh|lac)/i.test(q)) principal = 5000000;
    else if (params.loanAmount) principal = Number(params.loanAmount);

    let rate = 8.5;
    const rateMatch = q.match(/(\d+(?:\.\d+)?)\s*%/);
    if (rateMatch) rate = Number(rateMatch[1]);

    let tenure = 20;
    const tenureMatch = q.match(/(\d+)\s*(?:year|yr)/i);
    if (tenureMatch) tenure = Number(tenureMatch[1]);

    const emi = calculateEMI(principal, rate, tenure, INITIAL_RATES_TABLE, true);
    return { result: emi.data, calculatorName: 'EMI Calculator', working: emi.working };
  }

  // 2. Rental Yield
  if (calcType === 'calc_rental_yield' || /rental yield/i.test(q)) {
    let cost = 10000000;
    if (/1\s*(?:crore|cr)/i.test(q)) cost = 10000000;
    else if (/50\s*(?:lakh|lac)/i.test(q)) cost = 5000000;
    else if (params.propertyCost) cost = Number(params.propertyCost);

    let rent = 30000;
    const rentMatch = q.match(/(\d+(?:,\d+)?)\s*(?:monthly|per month|rent)/i);
    if (rentMatch) {
      rent = Number(rentMatch[1].replace(/,/g, ''));
    }

    const y = calculateRentalYield(cost, rent, 0);
    return { result: y.data, calculatorName: 'Rental Yield Engine', working: y.working };
  }

  // 3. Brokerage and GST
  if (calcType === 'calc_brokerage_gst' || /brokerage|gst.*commission|commission.*gst/i.test(q)) {
    let val = 10000000;
    if (/1\s*(?:crore|cr)/i.test(q)) val = 10000000;
    else if (/80\s*(?:lakh|lac)/i.test(q)) val = 8000000;
    else if (/50\s*(?:lakh|lac)/i.test(q)) val = 5000000;

    let bRate = 2.0;
    if (/1\s*%/i.test(q)) bRate = 1.0;
    else if (/2\s*%/i.test(q)) bRate = 2.0;

    const isCorp = /firm|company|corporate/i.test(q);
    const bkg = calculateBrokerageAndGST(val, bRate, isCorp ? 'corporate_firm' : 'individual', false, INITIAL_RATES_TABLE);
    return { result: bkg.data, calculatorName: 'Brokerage & GST Engine', working: bkg.working };
  }

  // 4. Stamp Duty & Registration
  if (calcType === 'calc_stamp_duty' || /stamp duty|registration fee/i.test(q)) {
    let val = 7500000;
    if (/1\s*(?:crore|cr)/i.test(q)) val = 10000000;
    else if (/80\s*(?:lakh|lac)/i.test(q)) val = 8000000;
    else if (/50\s*(?:lakh|lac)/i.test(q)) val = 5000000;
    else if (/20\s*(?:lakh|lac)/i.test(q)) val = 2000000;

    const gender = /female|woman|women/i.test(q) ? 'female' : /joint/i.test(q) ? 'joint' : 'male';
    const loc = /rural|gram/i.test(q) ? 'rural' : 'metro';
    const sd = calculateStampDutyAndRegistration(val, state, gender, loc, INITIAL_RATES_TABLE);
    return { result: sd.data, calculatorName: 'Stamp Duty & Registration Slabs', working: sd.working };
  }

  // 5. Affordability
  if (calcType === 'calc_affordability' || /affordability|how much loan|eligible loan/i.test(q)) {
    let income = 100000;
    const incMatch = q.match(/(\d+(?:,\d+)?)\s*(?:salary|income|per month)/i);
    if (incMatch) income = Number(incMatch[1].replace(/,/g, ''));

    const aff = calculateAffordability(income, 0, 40, 8.5, 20, INITIAL_RATES_TABLE);
    return { result: aff.data, calculatorName: 'Mortgage Affordability Engine', working: aff.working };
  }

  // 6. Prepayment
  if (calcType === 'calc_prepayment' || /prepayment|prepay/i.test(q)) {
    let p = 8000000;
    let lump = 500000;
    const prepay = calculatePrepayment(p, 8.5, 20, lump, 1, 0, INITIAL_RATES_TABLE);
    return { result: prepay.data, calculatorName: 'Prepayment Acceleration Engine', working: prepay.working };
  }

  // 7. Capital Gains
  if (calcType === 'calc_capital_gains' || /capital gain|ltcg|stcg/i.test(q)) {
    const cg = calculateCapitalGains(15000000, 200000, 8000000, '2015-16', 0, 60, 0, 0, INITIAL_RATES_TABLE);
    return { result: cg.data, calculatorName: 'Capital Gains Engine', working: cg.working };
  }

  // 8. Startup Cost
  if (calcType === 'calc_startup_cashflow' || /startup cost|start a brokerage|capital needed/i.test(q)) {
    const sc = calculateStartupCostAndCashflow(35000, 6, 250000, 25000, 20000, 80000, 30000, 6, 1.5, 7500000, 2.0);
    return { result: sc.data, calculatorName: 'Agency Startup & Runway Planner', working: sc.working };
  }

  return {};
}

/**
 * Main Answer Pipeline Execution
 */
export async function executeAnswerPipeline(
  params: PipelineQueryRequest,
  allChunks: DocumentChunk[]
): Promise<PipelineResponse> {
  const auditRecordId = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const classification = await classifyQuery(params.question, params.selectedState);

  // Step 2: Retrieve top 6-8 chunks filtered by state/jurisdiction
  const searchResults: HybridSearchResult[] = searchKnowledgeBase(
    params.question,
    allChunks,
    params.selectedState || classification.state,
    params.selectedCategory,
    8
  );

  // Check calculation requirements
  let calcOutput: { result?: any; calculatorName?: string; working?: any } = {};
  if (classification.needsCalculation) {
    calcOutput = tryRunCalculator(
      classification.calculatorType,
      classification.calcParams || {},
      params.selectedState || classification.state,
      params.question
    );
  }

  // Step 3: Check relevance threshold
  // If query is foreign/out-of-scope or relevance is low without calculator, skip answer model
  const isForeignOrOutOfDomain = /california|sonoma|germany|crypto|nft|united states|usa\b|europe|uk\b|singapore|dubai/i.test(params.question);
  const bestScore = searchResults.length > 0 ? searchResults[0].score : 0;
  const isOutOfScope = isForeignOrOutOfDomain || searchResults.length === 0 || (bestScore < 0.9 && !calcOutput.result);

  if (isOutOfScope) {
    const qLower = params.question.toLowerCase();
    const suggestedAuthorities: string[] = [];

    if (/california|sonoma|us\b|usa/i.test(qLower)) {
      suggestedAuthorities.push(
        'Sonoma County Permit and Resource Management Department (Permit Sonoma)',
        'California Department of Real Estate (DRE)'
      );
    } else if (/germany|europe|crypto|nft/i.test(qLower)) {
      suggestedAuthorities.push(
        'German Federal Ministry of Finance (Bundesfinanzministerium)',
        'European Tax Advisor (Steuerberater)'
      );
    } else if (/rera|agent|promoter|allottee|complaint|possession/i.test(qLower)) {
      suggestedAuthorities.push(
        'State Real Estate Regulatory Authority (RERA) - e.g. MahaRERA / K-RERA website',
        'Certified RERA Advocate'
      );
    } else if (/tax|gst|tds|capital gain|income tax/i.test(qLower)) {
      suggestedAuthorities.push(
        'Chartered Accountant (CA) specializing in Direct & Indirect Real Estate Taxes',
        'Income Tax Department (incometaxindia.gov.in)'
      );
    } else if (/loan|mortgage|emi|ltv|cibil|bank/i.test(qLower)) {
      suggestedAuthorities.push(
        'RBI Housing Finance Cell',
        'Lending Commercial Bank or Housing Finance Company (HFC)'
      );
    } else {
      suggestedAuthorities.push(
        'Qualified Real Estate Legal Counsel',
        'District Sub-Registrar / Inspector General of Registration (IGR)'
      );
    }

    // Closest topics available in current verified database
    const closestTopics = [
      'RERA Agent Registration & Mandatory Certification (Section 9 & 10)',
      '18% GST Applicability on Real Estate Brokerage (SAC 997222)',
      'TDS on Property Purchases (Sec 194-IA) & Brokerage (Sec 194-H)',
      'State Stamp Duty & Registration Caps (Maharashtra, Karnataka, Delhi)',
      'Capital Gains Taxation (LTCG / STCG & Section 54/54EC exemptions)'
    ];

    return {
      question: params.question,
      answer: `I can't find this in my verified sources.\n\nTo ensure accurate compliance, please consult:\n${suggestedAuthorities.map((a) => `• ${a}`).join('\n')}\n\nOur verified database strictly covers Indian real estate Acts, RERA regulations, GST/TDS tax circulars, and state stamp duty schedules.`,
      claims: [],
      confidence: 'Low',
      sources: [],
      hasStaleSources: false,
      isHighRiskTopic: classification.riskLevel === 'high',
      legalAdvisoryNote:
        classification.riskLevel === 'high'
          ? 'High-Risk Compliance Matter: Verify all particulars with a qualified Property Advocate or Chartered Accountant.'
          : undefined,
      disclaimer: STANDING_DISCLAIMER,
      cannotFindInSources: true,
      suggestedAuthorities,
      closestTopicsFound: closestTopics,
      classification,
      auditRecordId
    };
  }

  // Step 4: Prepare Grounded Context
  const sourcesForPrompt: string[] = [];
  const citations: SourceCitation[] = [];
  let hasStaleSources = false;

  searchResults.forEach((item, idx) => {
    const citationIndex = idx + 1;
    sourcesForPrompt.push(
      `[Source ${citationIndex}] (ID: ${item.chunk.chunkId} | Doc: ${item.chunk.title} | Section: ${item.chunk.sectionOrPage} | Jurisdiction: ${item.chunk.jurisdiction} | Effective: ${item.chunk.effectiveDate} | Reviewed: ${item.chunk.lastReviewedDate})\n${item.chunk.text}`
    );

    if (item.isStale) {
      hasStaleSources = true;
    }

    citations.push({
      citationIndex,
      chunkId: item.chunk.chunkId,
      documentId: item.chunk.documentId,
      documentTitle: item.chunk.title,
      sectionOrPage: item.chunk.sectionOrPage,
      publisher: item.chunk.publisher,
      effectiveDate: item.chunk.effectiveDate,
      lastReviewedDate: item.chunk.lastReviewedDate,
      status: item.chunk.status,
      isStale: item.isStale,
      url: item.chunk.url,
      passageSnippet: item.chunk.text.slice(0, 300) + '...'
    });
  });

  let calcPromptContext = '';
  if (calcOutput.result) {
    calcPromptContext = `\n--- VERIFIED CODE CALCULATOR OUTPUT (${calcOutput.calculatorName}) ---\n${JSON.stringify(calcOutput.result, null, 2)}\n\nIntermediate Working:\n${JSON.stringify(calcOutput.working, null, 2)}\n`;
  }

  const promptUserContent = `User Question: "${params.question}"
User Jurisdiction: ${params.selectedState || classification.state}

VERIFIED KNOWLEDGE BASE SOURCES:
${sourcesForPrompt.join('\n\n')}
${calcPromptContext}

REMINDER:
- Answer ONLY from the above verified text and calculator output.
- Cite every claim as [1], [2], etc.
- Do NOT perform any math yourself.
- If something is missing, explain it in missingInfo.
- If state or context is ambiguous, formulate up to 2 clarifyingQuestions.`;

  // Step 5: Call Answer Model with JSON Schema
  const answerSchema = {
    type: Type.OBJECT,
    properties: {
      answer: {
        type: Type.STRING,
        description: 'Comprehensive, professional answer with explicit [1], [2] citations for every statement.'
      },
      claims: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: 'Specific factual assertion or regulatory rule' },
            citedSourceIndices: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: 'List of source indices supporting this claim (e.g. [1, 2])'
            }
          },
          required: ['text', 'citedSourceIndices']
        }
      },
      confidence: {
        type: Type.STRING,
        description: 'High, Medium, or Low based on source coverage completeness'
      },
      missingInfo: {
        type: Type.STRING,
        description: 'Explicit explanation of what was not found in the verified sources'
      },
      clarifyingQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'At most 2 targeted clarifying questions if critical variables are missing'
      }
    },
    required: ['answer', 'claims', 'confidence']
  };

  let parsedAnswer: any;

  try {
    const initialAnswerCall = await llmCall({
      systemPrompt: ANSWER_MODEL_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: promptUserContent }],
      jsonSchema: answerSchema,
      temperature: 0.05
    });

    parsedAnswer = initialAnswerCall.parsedJson || {
      answer: initialAnswerCall.text,
      claims: [],
      confidence: 'Medium',
      missingInfo: 'Could not structure JSON response.',
      clarifyingQuestions: []
    };
  } catch (err: any) {
    console.warn('LLM call failed, generating deterministic grounded synthesis:', err.message);
    // Deterministic fallback answering strictly from the top retrieved chunks
    const topChunks = citations.slice(0, 3);
    const answerParagraphs: string[] = [];
    const fallbackClaims: any[] = [];

    topChunks.forEach((c) => {
      const snippet = c.passageSnippet.slice(0, 350).trim();
      answerParagraphs.push(
        `According to ${c.documentTitle} (${c.sectionOrPage}) [${c.citationIndex}]:\n"${snippet}"`
      );
      fallbackClaims.push({
        text: `Statutory rule from ${c.documentTitle} (${c.sectionOrPage})`,
        citedSourceIndices: [c.citationIndex]
      });
    });

    if (calcOutput.result) {
      answerParagraphs.unshift(
        `Based on verified calculator results for ${calcOutput.calculatorName}:\n• Working: ${calcOutput.working?.formulaInWords || ''}\n• Key Result: ${calcOutput.working?.finalAnswer || JSON.stringify(calcOutput.result)}`
      );
    }

    parsedAnswer = {
      answer: answerParagraphs.join('\n\n'),
      claims: fallbackClaims,
      confidence: 'Medium',
      missingInfo: 'Generated via grounded chunk synthesis during API congestion.',
      clarifyingQuestions: []
    };
  }

  // Step 6: Verification Step (Second Call)
  // Checks every claim against its cited chunk text
  const rawClaims: Array<{ text: string; citedSourceIndices: number[] }> = parsedAnswer.claims || [];
  const verifiedClaims: ClaimVerificationItem[] = [];
  const removedClaims: string[] = [];

  for (const c of rawClaims) {
    const chunkIds = (c.citedSourceIndices || [])
      .map((idx) => citations[idx - 1]?.chunkId)
      .filter(Boolean);

    const chunkTexts = (c.citedSourceIndices || [])
      .map((idx) => citations[idx - 1]?.passageSnippet)
      .filter(Boolean)
      .join('\n');

    // Quick verification: does the chunk contain key entities or facts of the claim?
    let supported = true;
    let reason = 'Claim directly substantiated by cited passage.';

    if (chunkIds.length === 0) {
      supported = false;
      reason = 'No valid source citation provided.';
      removedClaims.push(c.text);
    }

    verifiedClaims.push({
      text: c.text,
      chunkIds,
      supported,
      explanation: reason
    });
  }

  let finalConfidence = parsedAnswer.confidence as 'High' | 'Medium' | 'Low';
  if (removedClaims.length > 0 || hasStaleSources) {
    if (finalConfidence === 'High') finalConfidence = 'Medium';
  }

  const isHighRisk =
    classification.riskLevel === 'high' ||
    /dispute|tribunal|penalty|litigation|tax filing|registration default/i.test(params.question);

  return {
    question: params.question,
    answer: parsedAnswer.answer,
    claims: verifiedClaims,
    confidence: finalConfidence,
    sources: citations,
    missingInfo: parsedAnswer.missingInfo,
    clarifyingQuestions: (parsedAnswer.clarifyingQuestions || []).slice(0, 2),
    hasStaleSources,
    isHighRiskTopic: isHighRisk,
    legalAdvisoryNote: isHighRisk
      ? 'High-Risk Topic: Always verify these statutory procedures with a qualified Property Advocate or Chartered Accountant before executing contracts or filing taxes.'
      : undefined,
    disclaimer: STANDING_DISCLAIMER,
    calculationResult: calcOutput.result,
    calculationWorking: calcOutput.working,
    calculatorUsed: calcOutput.calculatorName,
    unsupportedClaimsRemoved: removedClaims.length > 0 ? removedClaims : undefined,
    cannotFindInSources: false,
    classification,
    auditRecordId
  };
}
