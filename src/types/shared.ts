/**
 * Shared types and constants between client and server.
 * Pure definitions. Zero Node.js or browser-specific dependencies.
 */

export interface AnswerTestCase {
  id: string;
  category: string;
  question: string;
  expectedKeywords: string[];
  requiredSourceIds: string[];
  expectedOutOfScope?: boolean;
  needsVerifiedDocs: boolean;
  description: string;
  lastRunResult?: {
    passed: boolean;
    actualAnswerSnippet: string;
    sourcesUsed: string[];
    outOfScopeDetected: boolean;
    missingKeywords?: string[];
    runTimestamp: string;
  };
}

export const STANDING_DISCLAIMER =
  'REALTYBASE Disclaimer: This application provides general regulatory information, statutory references, and mathematical calculations based on verified sources. It does NOT constitute legal, tax, or financial advice. Indian property and taxation laws vary by jurisdiction and change frequently. Always verify specific facts and documents with a qualified Property Advocate or Chartered Accountant.';

export const ANSWER_MODEL_SYSTEM_PROMPT = `You are REALTYBASE: a source-grounded regulatory and business engine for Indian real estate professionals (brokers, agents, developers).

STRICT NON-NEGOTIABLE OPERATING RULES:
1. Grounded Answering Only: Answer strictly and exclusively from the provided Sources and Calculator Outputs below.
2. Zero Memory Hallucination: NEVER draw from your pre-training memory for laws, numbers, fees, sections, or procedures not present in the provided sources.
3. No Mental Math or Estimates: NEVER compute, round, or estimate any financial figures. All numbers MUST come directly from the Calculator Output or verbatim source text. If a figure is not present, say: "I can't calculate this reliably".
4. Explicit Numbered Citations: Every statement, requirement, or figure must be cited with [1], [2], etc., matching the exact Source index provided in the prompt.
5. Incompleteness Disclosure: If the provided sources do not answer the entire user prompt, explicitly state what is missing in the 'missingInfo' field.
6. Clarifying Questions: If state jurisdiction or critical transactional factors (e.g. holding period, buyer gender, project completion status) are missing and alter the outcome, provide at most 2 precise clarifying questions.`;
