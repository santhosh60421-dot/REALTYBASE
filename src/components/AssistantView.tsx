import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Send,
  Building,
  FileText,
  BadgeAlert,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { StandingDisclaimer } from './StandingDisclaimer.tsx';
import { SourceModalData } from './SourcesModal.tsx';

interface AssistantViewProps {
  selectedState: string;
  onOpenSourceModal: (source: SourceModalData) => void;
  onOpenReportModal: (question: string, answer: string) => void;
  onSwitchToCalculator?: (calcId: string) => void;
}

const TOPIC_SHORTCUTS = [
  {
    category: 'Setup & Licensing',
    icon: '🏢',
    questions: [
      'How do I register as a real estate agent under RERA in Maharashtra and what is the fee?',
      'What is the mandatory training exam for MahaRERA agents under Order 41/2023?',
      'What is the fee to register as an individual agent in Karnataka under K-RERA Form G?',
      'What entity choices and registrations are needed to start a real estate agency firm in India?'
    ]
  },
  {
    category: 'RERA Compliance',
    icon: '⚖️',
    questions: [
      'Can an unregistered real estate agent facilitate property sales in India?',
      'What penalty applies if an agent markets an unregistered RERA project under Section 9 or 10?',
      'How can an allottee or agent file a complaint under Section 31 of RERA?',
      'Can an agent receive customer advances before entering an agreement for sale?'
    ]
  },
  {
    category: 'Taxes & TDS',
    icon: '🧾',
    questions: [
      'What is the GST rate on real estate brokerage commission in India and what is the SAC code?',
      'Does a corporate client have to deduct TDS on brokerage commission under Section 194-H?',
      'Can a real estate agent claim Input Tax Credit (ITC) on office rent and advertising?',
      'When must a property buyer deduct 1% TDS under Section 194-IA?'
    ]
  },
  {
    category: 'Capital Gains',
    icon: '📈',
    questions: [
      'What is the holding period for immovable property to qualify as a Long-Term Capital Asset?',
      'What is the capital gains tax rate under Budget 2024 for property sales after July 23, 2024?',
      'How can an individual claim tax exemption on capital gains under Section 54?',
      'What is the maximum investment limit in capital gains bonds under Section 54EC?'
    ]
  },
  {
    category: 'Loans & Money',
    icon: '💰',
    questions: [
      'Calculate EMI on ₹80 Lakh home loan at 8.5% for 20 years',
      'What is the maximum loan eligibility for ₹1,00,000 monthly income under 40% FOIR?',
      'What is the maximum Loan-to-Value (LTV) ratio allowed by RBI for loans above ₹75 Lakhs?',
      'How much interest does a ₹5,00,000 lump sum prepayment save on an ₹80 Lakh loan?'
    ]
  },
  {
    category: 'Stamp Duty & Deals',
    icon: '📑',
    questions: [
      'What is the base stamp duty rate and Metro cess in Mumbai Municipal Corporation limits?',
      'What is the statutory cap on registration fee in Maharashtra for properties above ₹30 Lakhs?',
      'What are the stamp duty slabs in Karnataka for affordable vs standard properties?',
      'What is the recommended title search period and key documents needed for due diligence?'
    ]
  }
];

export const AssistantView: React.FC<AssistantViewProps> = ({
  selectedState,
  onOpenSourceModal,
  onOpenReportModal,
  onSwitchToCalculator
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTabCategory, setActiveTabCategory] = useState<string>('Setup & Licensing');
  const [response, setResponse] = useState<any | null>(null);
  const [showWorking, setShowWorking] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const handleSend = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    setLoading(true);
    setResponse(null);
    setShowWorking(false);
    setFeedbackGiven(null);

    try {
      const res = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          selectedState
        })
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Error querying answer pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type: 'thumb_up' | 'thumb_down') => {
    if (!response) return;
    setFeedbackGiven(type === 'thumb_up' ? 'up' : 'down');
    try {
      await fetch('/api/feedback/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: response.question,
          answer: response.answer,
          feedbackType: type
        })
      });
    } catch (e) {
      console.error('Feedback submission failed:', e);
    }
  };

  // Helper to render text with clickable citation links [1], [2]
  const renderFormattedAnswer = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);

    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const citationNum = parseInt(match[1], 10);
        const sourceItem = response?.sources?.find(
          (s: any) => s.citationIndex === citationNum
        );

        return (
          <button
            key={index}
            onClick={() => {
              if (sourceItem) {
                onOpenSourceModal(sourceItem);
              }
            }}
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
            title={sourceItem ? `${sourceItem.documentTitle} (${sourceItem.sectionOrPage})` : `Citation [${citationNum}]`}
          >
            [{citationNum}]
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Source-Grounded
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                Jurisdiction: {selectedState}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              India Real Estate Compliance & Business Engine
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Verified legal provisions from RERA Acts, CBIC circulars, Stamp Duty schedules, and Income Tax rules. The model answers strictly from verified sources with tested code calculations.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur p-3.5 rounded-xl border border-white/10 shrink-0 text-xs">
            <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white">Zero Guesswork</div>
              <div className="text-slate-300 text-[11px]">Citations on every claim</div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Search Input Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <div className="pl-3 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything: RERA agent registration, 18% GST rules, stamp duty, capital gains, or loan EMI..."
            className="flex-1 py-3 px-2 text-sm sm:text-base bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching Sources...</span>
              </>
            ) : (
              <>
                <span>Ask REALTYBASE</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Topic Shortcuts Bar */}
      {!response && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Browse Common Beginner Questions
            </span>
            <span className="text-xs text-slate-400">Click any card to execute</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {TOPIC_SHORTCUTS.map((t) => (
              <button
                key={t.category}
                onClick={() => setActiveTabCategory(t.category)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTabCategory === t.category
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.category}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {TOPIC_SHORTCUTS.find((t) => t.category === activeTabCategory)?.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputQuery(q);
                  handleSend(q);
                }}
                className="p-3 text-left rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group flex items-start justify-between gap-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
              >
                <span className="font-medium">{q}</span>
                <ArrowRight className="w-4 h-4 shrink-0 text-slate-300 group-hover:text-emerald-600 transition-colors mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto animate-pulse">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Executing Source-Grounded Pipeline
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            1. Classifying question → 2. Hybrid vector search → 3. Relevance threshold check → 4. Code calculator execution → 5. Two-step verification.
          </p>
        </div>
      )}

      {/* Answer Response Container */}
      {response && !loading && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in duration-200">
          {/* Header Strip with Badges */}
          <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                  response.cannotFindInSources
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : response.confidence === 'High'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {response.cannotFindInSources ? '⚠️ Out of Scope' : `Confidence: ${response.confidence}`}
              </span>

              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {response.classification.topic}
              </span>

              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {response.classification.state}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{response.sources.length} Verified Sources</span>
              {response.calculatorUsed && (
                <span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-semibold">
                  🧮 {response.calculatorUsed}
                </span>
              )}
            </div>
          </div>

          {/* User Question Echo */}
          <div className="p-4 sm:px-6 bg-slate-100/50 dark:bg-slate-800/20 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
            Query: "{response.question}"
          </div>

          {/* Warning Banners & Standing Disclaimer */}
          <div className="px-4 sm:px-6 pt-3">
            <StandingDisclaimer
              hasStaleWarning={response.hasStaleSources}
              isHighRiskTopic={response.isHighRiskTopic}
              legalAdvisoryNote={response.legalAdvisoryNote}
            />
          </div>

          {/* Calculator Visual Result Card if Calculator Ran */}
          {response.calculationResult && (
            <div className="p-4 sm:p-6 bg-emerald-50/40 dark:bg-emerald-950/20 border-y border-emerald-200 dark:border-emerald-900/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Tested Calculation Output ({response.calculatorUsed})
                  </h4>
                </div>
                <button
                  onClick={() => setShowWorking(!showWorking)}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {showWorking ? 'Hide Working' : 'Show Working'}
                  {showWorking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Key Calculator Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {Object.entries(response.calculationResult)
                  .filter(([k, v]) => typeof v === 'number' || typeof v === 'string')
                  .slice(0, 4)
                  .map(([key, val]) => (
                    <div key={key} className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold truncate">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {typeof val === 'number' && key.toLowerCase().includes('pct')
                          ? `${val}%`
                          : typeof val === 'number' && !key.toLowerCase().includes('months') && !key.toLowerCase().includes('years')
                          ? `₹${val.toLocaleString('en-IN')}`
                          : String(val)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Expandable "Show Working" Panel */}
              {showWorking && response.calculationWorking && (
                <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 text-xs animate-in fade-in">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Formula in Words:
                    </span>
                    <p className="font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2 rounded">
                      {response.calculationWorking.formulaInWords}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Intermediate Steps:
                    </span>
                    <div className="space-y-1.5">
                      {response.calculationWorking.intermediateSteps?.map((step: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">{step.step}:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{step.result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 pt-1">
                    <span className="font-bold text-slate-600 dark:text-slate-400">Rate Source & Freshness: </span>
                    {response.calculationWorking.rateSourceAndDate?.rateName} ({response.calculationWorking.rateSourceAndDate?.source}, updated {response.calculationWorking.rateSourceAndDate?.lastUpdatedDate}).
                  </div>

                  {response.calculationWorking.whatIsNotIncluded?.length > 0 && (
                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200">
                      <span className="font-bold">What is NOT included:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {response.calculationWorking.whatIsNotIncluded.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Grounded Answer Body */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
              {renderFormattedAnswer(response.answer)}
            </div>

            {/* Out-of-scope recommendations */}
            {response.cannotFindInSources && response.suggestedAuthorities && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Who to ask for official verified advice:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                  {response.suggestedAuthorities.map((auth: string, idx: number) => (
                    <li key={idx} className="font-medium text-slate-800 dark:text-slate-200">
                      {auth}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Info Gap Disclosure */}
            {response.missingInfo && !response.cannotFindInSources && (
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Information Gap Disclosure: </span>
                {response.missingInfo}
              </div>
            )}

            {/* Clarifying Questions */}
            {response.clarifyingQuestions?.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Follow-up Clarifying Questions:
                </span>
                <div className="flex flex-wrap gap-2">
                  {response.clarifyingQuestions.map((cq: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputQuery(cq);
                        handleSend(cq);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-left transition-colors flex items-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{cq}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sources Panel */}
          {response.sources.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50/60 dark:bg-slate-800/30">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Verified Citations & Sources Panel ({response.sources.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {response.sources.map((src: any) => (
                  <div
                    key={src.citationIndex}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          [{src.citationIndex}] {src.documentTitle}
                        </span>
                        {src.isStale ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                            Stale (&gt;6m)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {src.sectionOrPage} • Published by {src.publisher}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400">Reviewed: {src.lastReviewedDate}</span>
                      <button
                        onClick={() => onOpenSourceModal(src)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        View Passage &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback & Reporting Footer */}
          <div className="p-4 sm:px-6 flex items-center justify-between text-xs text-slate-500 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span>Was this source-grounded response helpful?</span>
              <button
                onClick={() => handleFeedback('thumb_up')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackGiven === 'up'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                title="Thumbs up"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleFeedback('thumb_down')}
                className={`p-1.5 rounded-lg border transition-colors ${
                  feedbackGiven === 'down'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
                title="Thumbs down"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => onOpenReportModal(response.question, response.answer)}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:underline font-semibold"
            >
              <Flag className="w-3.5 h-3.5" />
              Report Discrepancy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
