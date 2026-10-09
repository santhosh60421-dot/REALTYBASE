import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Percent,
  Timer,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { TestSuiteSummary } from '../calc/__tests__/calculator.test.ts';

export const AdminCalculatorTests: React.FC = () => {
  const [suiteResult, setSuiteResult] = useState<TestSuiteSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const executeTests = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/calc/run-tests', { method: 'POST' });
      const data: TestSuiteSummary = await res.json();
      setSuiteResult(data);
    } catch (err) {
      console.error('Error executing calculator test suite:', err);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    executeTests();
  }, []);

  const filteredTests = suiteResult?.results.filter(
    (t) => categoryFilter === 'All' || t.category === categoryFilter
  ) || [];

  return (
    <div className="space-y-6">
      {/* Test Runner Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MANDATORY PASS GUARANTEE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
              TOLERANCE ±₹1 MAXIMUM
            </span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Automated Financial Engine Test Suite
          </h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Validates exact mathematical reference cases, closed-form vs simulation invariants, slab boundary limits, and edge-case validation rejections.
          </p>
        </div>

        <button
          onClick={executeTests}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 shadow-md shrink-0 cursor-pointer"
        >
          {running ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{running ? 'Running Tests...' : 'Run Calculator Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      {suiteResult && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">TOTAL TESTS</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {suiteResult.total}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">Automated test runners</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">PASSED</span>
            <span className="text-2xl font-extrabold text-emerald-600">
              {suiteResult.passed}
            </span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">100% Invariant match</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">FAILED</span>
            <span className={`text-2xl font-extrabold ${suiteResult.failed > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {suiteResult.failed}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Tolerance violations</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">STATUS</span>
            <div className="flex items-center gap-1.5 mt-1">
              {suiteResult.allPassed ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-emerald-600 text-sm">ALL PASSED</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-extrabold text-red-600 text-sm">FAILURES DETECTED</span>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Run: {new Date(suiteResult.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['All', 'Reference Value', 'Property Invariant', 'Slab Boundary', 'Edge Case', 'Cross Check'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Results Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Status</th>
                <th className="p-3">Category</th>
                <th className="p-3">Test Case Specification</th>
                <th className="p-3">Target Expected Value</th>
                <th className="p-3">Actual Evaluated Value</th>
                <th className="p-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    {test.passed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                        <XCircle className="w-3 h-3 text-red-600" /> FAIL
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {test.category}
                    </span>
                  </td>
                  <td className="p-3 max-w-sm">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {test.name}
                    </span>
                    {test.details && (
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {test.details}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {test.expected}
                  </td>
                  <td className="p-3 font-mono text-[11px] font-semibold text-slate-900 dark:text-white">
                    {test.actual}
                  </td>
                  <td className="p-3 text-right font-mono text-[10px] text-slate-400">
                    {test.durationMs}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
