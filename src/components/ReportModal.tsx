import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportModalProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  question,
  answer,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [comment, setComment] = useState('');
  const [reportType, setReportType] = useState<'statutory_error' | 'hallucination' | 'calculator_discrepancy' | 'stale_rate' | 'other'>('statutory_error');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/feedback/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          feedbackType: 'report_wrong',
          comment: `[Type: ${reportType}] ${comment}`
        })
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setComment('');
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error reporting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Report Discrepancy to Compliance Review Queue
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Discrepancy Logged</h4>
            <p className="text-xs text-slate-500">
              Your report has been queued for review by our legal and chartered accountant auditors.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discrepancy Category
              </label>
              <select
                value={reportType}
                onChange={(e: any) => setReportType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="statutory_error">Incorrect RERA Section / Legal Clause</option>
                <option value="calculator_discrepancy">Mathematical or Calculator Rounding Error</option>
                <option value="stale_rate">Outdated Stamp Duty or GST Rate</option>
                <option value="hallucination">Claim unsupported by cited source</option>
                <option value="other">Other compliance issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specific Comments & Evidence
              </label>
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Explain what is inaccurate and provide official gazette or circular reference if known..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-400">
              Question: <span className="font-medium text-slate-800 dark:text-slate-200">"{question}"</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
