import React from 'react';
import { Code, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { ANSWER_MODEL_SYSTEM_PROMPT, STANDING_DISCLAIMER } from '../types/shared.ts';

export const AdminPipelineViewer: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            SYSTEM ARCHITECTURE & PROMPTS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
            SWAPPABLE LLM WRAPPER
          </span>
        </div>
        <h3 className="text-xl font-extrabold tracking-tight">Answer Pipeline & Guardrail Specifications</h3>
        <p className="text-xs sm:text-sm text-slate-300">
          Inspection view for system prompts, swappable wrapper interface, and 7-step verification workflow.
        </p>
      </div>

      {/* 7-Step Pipeline Sequence Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          7-Step Deterministic Pipeline Workflow
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">1. Query Classification (JSON)</span>
            <p className="text-slate-600 dark:text-slate-400">
              Extracts topic, state, risk level ('low'|'high'), and detects if financial calculations are requested.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">2. Hybrid Vector Search</span>
            <p className="text-slate-600 dark:text-slate-400">
              Retrieves top 6-8 chunks filtered by jurisdiction. Superseded documents are strictly excluded.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">3. Relevance Threshold Guardrail</span>
            <p className="text-slate-600 dark:text-slate-400">
              If relevance &lt; 0.25 and no calculator matches, skips LLM and returns "I can't find this in my verified sources" with authority recommendations.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">4. Pure Code Calculator Execution</span>
            <p className="text-slate-600 dark:text-slate-400">
              All numbers computed via tested decimal.js financial functions. Zero LLM mental math.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">5. Grounded Answer Model</span>
            <p className="text-slate-600 dark:text-slate-400">
              Provided ONLY retrieved chunks and calculator output. Strict requirement for numbered [n] citations on every claim.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-indigo-600 block mb-1">6. Two-Step Claim Verification</span>
            <p className="text-slate-600 dark:text-slate-400">
              Checks every claim against its cited chunk text. Removes or flags unsupported claims and adjusts confidence.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 md:col-span-2">
            <span className="font-bold text-indigo-600 block mb-1">7. Clarifying Questions Formulator</span>
            <p className="text-slate-600 dark:text-slate-400">
              Formulates at most 2 clarifying questions if critical variables (e.g. buyer gender, completion status, state) are missing and alter statutory outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Answer Model System Prompt */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          Answer Model System Prompt (server/answerPipeline.ts)
        </h4>

        <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
          {ANSWER_MODEL_SYSTEM_PROMPT}
        </pre>
      </div>

      {/* Swappable Wrapper Signature */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-600" />
          Single Swappable LLM Wrapper Interface (server/llmWrapper.ts)
        </h4>

        <pre className="p-4 rounded-xl bg-slate-900 text-indigo-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
{`export interface LLMCallParams {
  systemPrompt?: string;
  messages: Array<{ role: 'user' | 'model' | 'system'; content: string }>;
  tools?: any[];
  jsonSchema?: any;
  modelName?: string;
  temperature?: number;
}

export async function llmCall(params: LLMCallParams): Promise<LLMCallResult> {
  // Uses @google/genai SDK exclusively on server
  // API key never exposed to client
  // Fully swappable with alternate model endpoints
}`}
        </pre>
      </div>
    </div>
  );
};
