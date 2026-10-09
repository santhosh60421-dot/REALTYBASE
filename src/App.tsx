import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { AssistantView } from './components/AssistantView.tsx';
import { CalculatorStudio } from './components/CalculatorStudio.tsx';
import { AdminKnowledgeBase } from './components/AdminKnowledgeBase.tsx';
import { AdminCoverageDashboard } from './components/AdminCoverageDashboard.tsx';
import { AdminRatesTable } from './components/AdminRatesTable.tsx';
import { AdminCalculatorTests } from './components/AdminCalculatorTests.tsx';
import { AdminAnswerTests } from './components/AdminAnswerTests.tsx';
import { AdminSignOffAndAudit } from './components/AdminSignOffAndAudit.tsx';
import { AdminPipelineViewer } from './components/AdminPipelineViewer.tsx';
import { SourcesModal, SourceModalData } from './components/SourcesModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import {
  Layers,
  Database,
  Coins,
  CheckSquare,
  FileCheck,
  UserCheck,
  Code
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'assistant' | 'calculators' | 'admin'>('assistant');
  const [adminSubTab, setAdminSubTab] = useState<string>('coverage');
  const [selectedState, setSelectedState] = useState<string>('Central');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  // Modal states
  const [activeSource, setActiveSource] = useState<SourceModalData | null>(null);
  const [reportData, setReportData] = useState<{ question: string; answer: string } | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        adminSubTab={adminSubTab}
        setAdminSubTab={setAdminSubTab}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        role={role}
        setRole={setRole}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        allTestsPassed={true}
      />

      {/* Main Container */}
      <main className="flex-1 py-4 sm:py-6">
        {/* 1. Assistant Tab */}
        {currentTab === 'assistant' && (
          <AssistantView
            selectedState={selectedState}
            onOpenSourceModal={(src) => setActiveSource(src)}
            onOpenReportModal={(q, a) => setReportData({ question: q, answer: a })}
            onSwitchToCalculator={() => setCurrentTab('calculators')}
          />
        )}

        {/* 2. Calculator Studio Tab */}
        {currentTab === 'calculators' && <CalculatorStudio />}

        {/* 3. Admin Control Center Tab */}
        {currentTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            {/* Admin Sub Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setAdminSubTab('coverage')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'coverage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                Coverage Dashboard
              </button>

              <button
                onClick={() => setAdminSubTab('knowledge')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'knowledge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                Knowledge Base (Chunking)
              </button>

              <button
                onClick={() => setAdminSubTab('rates')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'rates'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Coins className="w-4 h-4" />
                Rates & Slabs Table
              </button>

              <button
                onClick={() => setAdminSubTab('calc-tests')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'calc-tests'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                Calculator Tests
              </button>

              <button
                onClick={() => setAdminSubTab('answer-tests')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'answer-tests'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                Answer Test Suite (22)
              </button>

              <button
                onClick={() => setAdminSubTab('signoffs')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'signoffs'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Sign-Off & Audit
              </button>

              <button
                onClick={() => setAdminSubTab('pipeline')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  adminSubTab === 'pipeline'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Code className="w-4 h-4" />
                Pipeline Code & Prompt
              </button>
            </div>

            {/* SubTab Views */}
            {adminSubTab === 'coverage' && (
              <AdminCoverageDashboard onNavigateToUpload={() => setAdminSubTab('knowledge')} />
            )}
            {adminSubTab === 'knowledge' && <AdminKnowledgeBase />}
            {adminSubTab === 'rates' && <AdminRatesTable />}
            {adminSubTab === 'calc-tests' && <AdminCalculatorTests />}
            {adminSubTab === 'answer-tests' && <AdminAnswerTests />}
            {adminSubTab === 'signoffs' && <AdminSignOffAndAudit />}
            {adminSubTab === 'pipeline' && <AdminPipelineViewer />}
          </div>
        )}
      </main>

      {/* Citations Passage Modal */}
      <SourcesModal source={activeSource} onClose={() => setActiveSource(null)} />

      {/* Discrepancy Reporting Modal */}
      <ReportModal
        question={reportData?.question || ''}
        answer={reportData?.answer || ''}
        isOpen={Boolean(reportData)}
        onClose={() => setReportData(null)}
        onSuccess={() => setReportData(null)}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">REALTYBASE India</span>
            <span>•</span>
            <span>RERA & Statutory Real Estate Compliance Engine</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Jurisdiction: {selectedState}</span>
            <span>•</span>
            <span>Swappable LLM Server-Side Wrapper</span>
            <span>•</span>
            <button
              onClick={() => {
                setRole('admin');
                setCurrentTab('admin');
                setAdminSubTab('pipeline');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              System Prompt & Architecture
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
