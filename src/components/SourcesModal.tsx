import React from 'react';
import { X, ExternalLink, Calendar, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface SourceModalData {
  citationIndex: number;
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

interface SourcesModalProps {
  source: SourceModalData | null;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-sm border border-emerald-300 dark:border-emerald-800">
              [{source.citationIndex}]
            </span>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                {source.documentTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Section: <span className="font-semibold text-slate-700 dark:text-slate-300">{source.sectionOrPage}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-100/70 dark:bg-slate-800/30 text-xs border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px]">PUBLISHER</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
              {source.publisher}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">EFFECTIVE DATE</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              {source.effectiveDate}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">LAST REVIEWED</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {source.lastReviewedDate}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">STATUS</span>
            <span
              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                source.isStale
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {source.isStale ? 'Stale (>6 mos)' : 'Current & Verified'}
            </span>
          </div>
        </div>

        {/* Warning if Stale */}
        {source.isStale && (
          <div className="p-3 mx-4 mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              This document was last reviewed on {source.lastReviewedDate}. Always confirm statutory updates with state authorities.
            </span>
          </div>
        )}

        {/* Passage Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950/40 rounded-lg m-4 border border-slate-200 dark:border-slate-800">
          {source.passageSnippet}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Indexed in REALTYBASE Hybrid Vector Index
          </div>

          <div className="flex items-center gap-2">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-indigo-200 dark:border-indigo-800"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Original Gazette / Act
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white dark:bg-slate-700 hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
