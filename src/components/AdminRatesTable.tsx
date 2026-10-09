import React, { useState, useEffect } from 'react';
import {
  Coins,
  Edit,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { RateItem } from '../calc/types.ts';

export const AdminRatesTable: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<any | null>(null);
  const [valInput, setValInput] = useState<number>(0);
  const [sourceInput, setSourceInput] = useState<string>('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      setRates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleConfirmFreshness = async (key: string) => {
    try {
      await fetch(`/api/rates/${key}/confirm`, { method: 'POST' });
      await fetchRates();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRate) return;

    try {
      await fetch(`/api/rates/${editingRate.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: valInput,
          source: sourceInput,
          lastUpdatedDate: new Date().toISOString().slice(0, 10),
          isConfirmed: true
        })
      });
      setEditingRate(null);
      await fetchRates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Editable Statutory Rates & Slabs Registry ({rates.length} Rates)
          </h3>
          <p className="text-xs text-slate-500">
            No rate or slab is hardcoded in the codebase. All 13 calculators reference this table. Rates older than 6 months trigger confirmation guardrails.
          </p>
        </div>

        <button
          onClick={fetchRates}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Refresh Rates
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Rate Name & Statutory Key</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Value / Slabs</th>
                <th className="p-3">Source & Circular</th>
                <th className="p-3">Last Updated</th>
                <th className="p-3">Freshness Guardrail</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rates.map((rate) => {
                const isStale = !rate.freshness?.isFresh;
                return (
                  <tr key={rate.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 max-w-xs">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {rate.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {rate.key}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {rate.jurisdiction}
                      </span>
                    </td>
                    <td className="p-3">
                      {rate.type === 'percentage' && (
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {rate.value}%
                        </span>
                      )}
                      {rate.type === 'slabs' && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold">
                          {rate.slabs?.length || 2} Slabs Schedule
                        </span>
                      )}
                    </td>
                    <td className="p-3 max-w-sm truncate text-slate-600 dark:text-slate-400" title={rate.source}>
                      {rate.source}
                    </td>
                    <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                      {rate.lastUpdatedDate}
                    </td>
                    <td className="p-3">
                      {isStale ? (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Stale ({rate.freshness?.monthsOld || 6}m)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Active (&lt;6m)</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isStale && (
                          <button
                            onClick={() => handleConfirmFreshness(rate.key)}
                            className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold"
                            title="Confirm this rate is currently valid as of today"
                          >
                            Confirm Freshness
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingRate(rate);
                            setValInput(rate.value || 0);
                            setSourceInput(rate.source || '');
                          }}
                          className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rate Modal */}
      {editingRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Edit Statutory Rate: {editingRate.name}
              </h3>
              <button onClick={() => setEditingRate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {editingRate.type === 'percentage' && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Percentage Value (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={valInput}
                    onChange={(e) => setValInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Official Statutory Source & Circular Reference
                </label>
                <textarea
                  rows={3}
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRate(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Update & Confirm Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
