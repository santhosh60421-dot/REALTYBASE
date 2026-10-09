import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  Layers,
  ExternalLink,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';

interface DocumentItem {
  id: string;
  title: string;
  publisher: string;
  url: string;
  jurisdiction: string;
  type: string;
  category: string;
  effectiveDate: string;
  lastReviewedDate: string;
  status: 'Current' | 'Stale' | 'Superseded';
  reviewedBy?: string;
  reviewerRole?: string;
  chunkCount: number;
  rawContent: string;
  signOff?: any;
}

const CATEGORIES = [
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

const JURISDICTIONS = [
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

const DOC_TYPES = ['Act', 'rules', 'notification', 'circular', 'guide', 'template'];

export const AdminKnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [url, setUrl] = useState('');
  const [jurisdiction, setJurisdiction] = useState('Central');
  const [type, setType] = useState('circular');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [effectiveDate, setEffectiveDate] = useState('2024-01-01');
  const [lastReviewedDate, setLastReviewedDate] = useState('2026-08-01');
  const [status, setStatus] = useState<'Current' | 'Stale' | 'Superseded'>('Current');
  const [reviewedBy, setReviewedBy] = useState('Santhosh (Compliance Lead)');
  const [reviewerRole, setReviewerRole] = useState('Compliance Specialist');
  const [rawContent, setRawContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rawContent || !publisher) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        })
      });

      if (res.ok) {
        setShowUploadModal(false);
        // Reset form
        setTitle('');
        setPublisher('');
        setUrl('');
        setRawContent('');
        await fetchDocs();
      }
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (doc: DocumentItem, newStatus: 'Current' | 'Stale' | 'Superseded') => {
    try {
      await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document from the verified knowledge base?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      await fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Knowledge Base Ingestion & Vector Index ({documents.length} Documents)
          </h3>
          <p className="text-xs text-slate-500">
            All documents are automatically sliced into 500-800 token overlapping chunks. Superseded documents are strictly excluded from retrieval.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          Ingest / Paste New Document
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Title & Publisher</th>
                <th className="p-3">Jurisdiction</th>
                <th className="p-3">Category</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-center">Chunks</th>
                <th className="p-3">Dates</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="p-3 max-w-sm">
                    <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {doc.publisher}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {doc.jurisdiction}
                    </span>
                  </td>
                  <td className="p-3 max-w-[180px] truncate text-slate-600 dark:text-slate-400">
                    {doc.category}
                  </td>
                  <td className="p-3 uppercase text-[10px] font-semibold text-slate-500">
                    {doc.type}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {doc.chunkCount} chunks
                    </span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                    <div>Eff: {doc.effectiveDate}</div>
                    <div>Rev: {doc.lastReviewedDate}</div>
                  </td>
                  <td className="p-3">
                    <select
                      value={doc.status}
                      onChange={(e: any) => handleToggleStatus(doc, e.target.value)}
                      className={`text-[11px] font-bold p-1 rounded border ${
                        doc.status === 'Current'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : doc.status === 'Stale'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-200 text-slate-700 border-slate-400'
                      }`}
                    >
                      <option value="Current">Current</option>
                      <option value="Stale">Stale (&gt;6m)</option>
                      <option value="Superseded">Superseded (No Search)</option>
                    </select>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectDoc(doc)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Inspect full text & chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-slate-800"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload / Ingestion Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Upload / Ingest Regulatory Document
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Title *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Haryana RERA Real Estate Agent Regulations 2024"
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Publisher / Authority *
                  </label>
                  <input
                    required
                    type="text"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. HRERA / Revenue Dept / CBIC"
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Official Gazette / Notification URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Jurisdiction *
                  </label>
                  <select
                    value={jurisdiction}
                    onChange={(e) => setJurisdiction(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {JURISDICTIONS.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Doc Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Current">Current</option>
                    <option value="Stale">Stale</option>
                    <option value="Superseded">Superseded (No Search)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Last Reviewed Date
                  </label>
                  <input
                    type="date"
                    value={lastReviewedDate}
                    onChange={(e) => setLastReviewedDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Raw Text / Legal Sections *
                </label>
                <textarea
                  required
                  rows={8}
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  placeholder="Paste verbatim Act sections, circular clauses, or statutory rules text here..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Text will be chunked into 500-800 token slices with ~80 token overlap.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {submitting ? 'Chunking & Indexing...' : 'Save & Index Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Document Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-y-auto max-h-[85vh] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {inspectDoc.title}
                </h3>
                <span className="text-xs text-slate-500">
                  {inspectDoc.publisher} • {inspectDoc.jurisdiction} • {inspectDoc.chunkCount} Chunks Generated
                </span>
              </div>
              <button onClick={() => setInspectDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1">
              <div><strong>Category:</strong> {inspectDoc.category}</div>
              <div><strong>Effective Date:</strong> {inspectDoc.effectiveDate} | <strong>Last Reviewed:</strong> {inspectDoc.lastReviewedDate}</div>
              <div><strong>Reviewed By:</strong> {inspectDoc.reviewedBy} ({inspectDoc.reviewerRole})</div>
            </div>

            <div>
              <span className="font-bold text-xs text-slate-500 uppercase block mb-1">
                Raw Ingested Content:
              </span>
              <pre className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800">
                {inspectDoc.rawContent}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
