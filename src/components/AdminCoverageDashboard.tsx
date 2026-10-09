import React, { useEffect, useState } from 'react';
import { Database, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Plus } from 'lucide-react';

interface CoverageData {
  matrix: Record<string, Record<string, number>>;
  categoryTotals: Record<string, number>;
  stateTotals: Record<string, number>;
  totalDocuments: number;
  supersededCount: number;
  staleCount: number;
}

interface AdminCoverageDashboardProps {
  onNavigateToUpload: () => void;
}

export const AdminCoverageDashboard: React.FC<AdminCoverageDashboardProps> = ({ onNavigateToUpload }) => {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCoverage = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents/coverage');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch coverage matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Loading Regulatory Coverage Matrix...
      </div>
    );
  }

  const categories = Object.keys(data.matrix);
  const states = Object.keys(data.stateTotals);

  // Identify empty gaps
  const emptyGaps: Array<{ category: string; state: string }> = [];
  for (const cat of categories) {
    for (const st of states) {
      if ((data.matrix[cat]?.[st] || 0) === 0) {
        emptyGaps.push({ category: cat, state: st });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">ACTIVE DOCUMENTS</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {data.totalDocuments}
          </span>
          <span className="text-[11px] text-emerald-600 block mt-0.5">Across 10 Categories</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">STALE DOCUMENTS</span>
          <span className="text-2xl font-extrabold text-amber-600">
            {data.staleCount}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">&gt;6 months without review</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">SUPERSEDED EXCLUDED</span>
          <span className="text-2xl font-extrabold text-slate-500">
            {data.supersededCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">Never retrieved in search</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">VISIBLE GAPS</span>
          <span className="text-2xl font-extrabold text-indigo-600">
            {emptyGaps.length}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Category-State cells to backfill</span>
        </div>
      </div>

      {/* Coverage Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Category × State Regulatory Coverage Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Numbers indicate verified documents. Green indicates active coverage, gray highlights empty statutory gaps.
            </p>
          </div>
          <button
            onClick={onNavigateToUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Upload Document
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 font-bold sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 w-64">
                  Regulatory Category
                </th>
                {states.map((st) => (
                  <th key={st} className="p-3 text-center min-w-[70px]">
                    {st === 'Central' ? 'Central' : st.slice(0, 4)}
                  </th>
                ))}
                <th className="p-3 text-center font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <tr key={cat} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    {cat}
                  </td>
                  {states.map((st) => {
                    const count = data.matrix[cat]?.[st] || 0;
                    return (
                      <td key={st} className="p-3 text-center">
                        {count > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            {count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-300 dark:text-slate-700 font-medium text-xs">
                            0
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                    {data.categoryTotals[cat] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-800 text-xs">
              <tr>
                <td className="p-3 sticky left-0 bg-slate-50 dark:bg-slate-800">Total by Jurisdiction</td>
                {states.map((st) => (
                  <td key={st} className="p-3 text-center">
                    {data.stateTotals[st] || 0}
                  </td>
                ))}
                <td className="p-3 text-center text-emerald-600">{data.totalDocuments}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
