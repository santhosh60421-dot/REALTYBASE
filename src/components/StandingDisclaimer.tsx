import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface StandingDisclaimerProps {
  hasStaleWarning?: boolean;
  isHighRiskTopic?: boolean;
  legalAdvisoryNote?: string;
}

export const StandingDisclaimer: React.FC<StandingDisclaimerProps> = ({
  hasStaleWarning,
  isHighRiskTopic,
  legalAdvisoryNote
}) => {
  return (
    <div className="space-y-2 my-3">
      {hasStaleWarning && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold">Stale Source Warning:</span> One or more verified documents or statutory rates used in this response have not been re-reviewed within the last 6 months. Statutory regulations may have evolved. Please verify with the current state authority before relying on this information.
          </div>
        </div>
      )}

      {isHighRiskTopic && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/60 text-red-900 dark:text-red-200 text-xs sm:text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div>
            <span className="font-semibold">High-Risk Matter:</span> {legalAdvisoryNote || 'This subject involves legal disputes, statutory penalties, or tax filings. You MUST verify with a qualified Property Advocate or Chartered Accountant.'}
          </div>
        </div>
      )}

      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs flex items-center justify-between">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          ⚖️ Standing Disclaimer: General information and statutory estimates only. Not legal, tax, or financial advice.
        </span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Indian Property Law & RERA Compliance Standard
        </span>
      </div>
    </div>
  );
};
