import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Plus,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  X
} from 'lucide-react';
import { AnswerTestCase } from '../types/shared.ts';

export const AdminAnswerTests: React.FC = () => {
  const [testCases, setTestCases] = useState<AnswerTestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Form state
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Custom Verification');
  const [expectedKw, setExpectedKw] = useState('');
  const [isOutOfScope, setIsOutOfScope] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tests/answers');
      const data = await res.json();
      setTestCases(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleRunAll = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/tests/answers/run-all', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
        setTestCases(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    try {
      const keywords = expectedKw
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      await fetch('/api/tests/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          question,
          expectedKeywords: keywords,
          expectedOutOfScope: isOutOfScope
        })
      });

      setShowAddModal(false);
      setQuestion('');
      setExpectedKw('');
      await fetchTests();
    } catch (e) {
      console.error(e);
    }
  };

  const categories = ['All', ...new Set(testCases.map((t) => t.category))];
  const filteredTests = testCases.filter((t) => activeCategory === 'All' || t.category === activeCategory);

  const passedTests = testCases.filter((t) => t.lastRunResult?.passed).length;
  const ranTests = testCases.filter((t) => t.lastRunResult !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              GROUNDED ANSWER TEST SUITE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
              20 BEGINNER QUESTIONS + 2 OUT-OF-SCOPE GUARDRAILS
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">Answer Pipeline Verification Suite</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Executes questions through the 7-step pipeline. Checks pass/fail, verified sources utilized, and ensures out-of-scope queries trigger "I can't find this in my verified sources".
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Test Case
          </button>
          <button
            onClick={handleRunAll}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white shadow-md cursor-pointer"
          >
            {running ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{running ? 'Running Pipeline...' : 'Run All 22 Tests'}</span>
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">TOTAL TEST QUESTIONS</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {testCases.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">20 Beginner + 2 Guardrails</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">TESTS EXECUTED</span>
          <span className="text-2xl font-extrabold text-indigo-600">
            {ranTests}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Through live pipeline</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">PASSED VERIFICATIONS</span>
          <span className="text-2xl font-extrabold text-emerald-600">
            {passedTests}
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Evidence corroborated</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">OUT-OF-SCOPE GUARD</span>
          <span className="text-2xl font-extrabold text-teal-600">
            {testCases.filter((t) => t.expectedOutOfScope).length} Tests
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">"I can't find this" guarantee</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Questions List */}
      <div className="space-y-3">
        {filteredTests.map((tc, idx) => {
          const run = tc.lastRunResult;
          return (
            <div
              key={tc.id}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                run && !run.passed
                  ? 'border-red-400 dark:border-red-700 bg-red-50/20'
                  : run && run.passed
                  ? 'border-emerald-300 dark:border-emerald-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {tc.category}
                    </span>
                    {tc.needsVerifiedDocs ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Needs my verified documents
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Out-of-Scope Guardrail
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {tc.question}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {tc.description}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {run ? (
                    run.passed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> PASSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3.5 h-3.5 text-red-600" /> FAILED
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">Not yet run</span>
                  )}
                </div>
              </div>

              {/* Run Results Excerpt if available */}
              {run && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Actual Pipeline Snippet: </span>
                    <span className="italic">{run.actualAnswerSnippet}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>
                      <strong>Sources Used: </strong>
                      {run.sourcesUsed.length > 0 ? run.sourcesUsed.join(', ') : 'None (Correctly skipped for out-of-scope)'}
                    </span>
                    {run.outOfScopeDetected && (
                      <span className="text-emerald-600 font-semibold">
                        ✓ Correctly triggered "I can't find this in my verified sources"
                      </span>
                    )}
                    {run.missingKeywords && (
                      <span className="text-red-500 font-medium">
                        Missing key terms: {run.missingKeywords.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Verification Test Case
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Test Question *
                </label>
                <input
                  required
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What is the stamp duty in Karnataka for property worth 30 Lakhs?"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Expected Mandatory Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={expectedKw}
                  onChange={(e) => setExpectedKw(e.target.value)}
                  placeholder="e.g. 3%, ₹20 Lakhs, Karnataka Stamp Act"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="outOfScopeCheck"
                  checked={isOutOfScope}
                  onChange={(e) => setIsOutOfScope(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="outOfScopeCheck" className="font-medium text-slate-700 dark:text-slate-300">
                  This is an out-of-scope question (expects "I can't find this in my verified sources")
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save Test Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
