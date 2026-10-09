import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  History,
  AlertCircle,
  CheckCircle,
  FileText,
  UserCheck,
  RotateCcw,
  Check,
  X
} from 'lucide-react';

export const AdminSignOffAndAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'signoffs' | 'audit' | 'reports'>('signoffs');
  const [signOffs, setSignOffs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [soRes, alRes, repRes] = await Promise.all([
        fetch('/api/admin/sign-offs'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/reports')
      ]);
      setSignOffs(await soRes.json());
      setAuditLogs(await alRes.json());
      setReports(await repRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportJSON = async () => {
    try {
      const res = await fetch('/api/admin/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `realtybase_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        const resData = await res.json();
        setImportStatus(`Successfully restored ${resData.documentsCount} documents and ${resData.ratesCount} rates!`);
        await fetchData();
      } catch (err: any) {
        setImportStatus(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateReportStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export/Import Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight">Expert Sign-Off, Governance & Audit Log</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Sign-off status tracking per calculator and per document. Complete audit trail of pipeline calls.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white"
          >
            <Download className="w-4 h-4" />
            Export Full JSON State
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
          <span>{importStatus}</span>
          <button onClick={() => setImportStatus(null)} className="text-indigo-400 hover:text-indigo-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('signoffs')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'signoffs'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Expert Sign-Off Status ({signOffs.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Live Audit Logs ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          User Review Reports Queue ({reports.length})
        </button>
      </div>

      {/* 1. Sign-Offs Table */}
      {activeTab === 'signoffs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Per-Calculator & Per-Document Review Tracking
            </h4>
            <p className="text-xs text-slate-400">
              Any item marked "Pending" or without sign-off displays a warning: "Not yet reviewed, verify before relying on it".
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Item Type</th>
                  <th className="p-3">Target Name</th>
                  <th className="p-3">Reviewed By</th>
                  <th className="p-3">Professional Role</th>
                  <th className="p-3">Review Date</th>
                  <th className="p-3">Sign-off Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {signOffs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 uppercase text-[10px] font-bold text-slate-400">
                      {item.targetType}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white max-w-sm">
                      {item.targetName}
                    </td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {item.reviewedBy || 'Unassigned'}
                    </td>
                    <td className="p-3 text-slate-500">
                      {item.reviewerRole || 'Expert Auditor'}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {item.reviewDate || '—'}
                    </td>
                    <td className="p-3">
                      {item.reviewStatus === 'Reviewed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" /> Reviewed & Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertCircle className="w-3 h-3 text-amber-600" /> Not yet reviewed, verify before relying
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Audit Logs Table */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Pipeline Execution & Grounding Audit Trail
            </h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User Question</th>
                  <th className="p-3">Jurisdiction</th>
                  <th className="p-3">Chunks Retrieved</th>
                  <th className="p-3">Calculator Run</th>
                  <th className="p-3">Answer Excerpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {log.question}
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {log.state}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {log.retrievedChunkIds?.length || 0} chunks
                    </td>
                    <td className="p-3">
                      {log.calculatorUsed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          {log.calculatorUsed}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">None</span>
                      )}
                    </td>
                    <td className="p-3 max-w-sm truncate text-slate-600 dark:text-slate-300">
                      {log.answerSnippet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Review Reports Queue */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              User Discrepancy & Wrong Answer Reports
            </h4>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No reports currently in review queue.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      Question: "{rep.question}"
                    </span>
                    <select
                      value={rep.status}
                      onChange={(e) => handleUpdateReportStatus(rep.id, e.target.value)}
                      className={`text-[11px] font-bold p-1 rounded border ${
                        rep.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Pending">Pending Review</option>
                      <option value="Investigated">Investigated</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <strong>Report Comment:</strong> {rep.comment || 'Thumbs down feedback provided.'}
                  </p>

                  <div className="text-[10px] text-slate-400">
                    Reported on {new Date(rep.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
