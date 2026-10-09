import React from 'react';
import {
  Building2,
  Calculator,
  ShieldCheck,
  Moon,
  Sun,
  MapPin,
  SlidersHorizontal,
  FileCheck2,
  CheckCircle2,
  Database
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'assistant' | 'calculators' | 'admin';
  setCurrentTab: (tab: 'assistant' | 'calculators' | 'admin') => void;
  adminSubTab: string;
  setAdminSubTab: (subTab: string) => void;
  selectedState: string;
  setSelectedState: (state: string) => void;
  role: 'user' | 'admin';
  setRole: (role: 'user' | 'admin') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  allTestsPassed?: boolean;
}

const STATES = [
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

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  selectedState,
  setSelectedState,
  role,
  setRole,
  darkMode,
  setDarkMode,
  allTestsPassed = true
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('assistant')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                    REALTY<span className="text-emerald-600 dark:text-emerald-400">BASE</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    INDIA RERA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">
                  Source-Grounded Assistant & Precision Calculator
                </p>
              </div>
            </button>
          </div>

          {/* Center Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCurrentTab('assistant')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'assistant'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Assistant
            </button>

            <button
              onClick={() => setCurrentTab('calculators')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'calculators'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 text-teal-600" />
              Calculator Studio (13)
            </button>

            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'admin'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              Admin Center
            </button>
          </nav>

          {/* Right Controls: State selector, Role toggle, Theme */}
          <div className="flex items-center gap-2.5">
            {/* State Selector */}
            <div className="relative flex items-center">
              <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                aria-label="Jurisdiction Selector"
              >
                <option value="Central">All India / Central</option>
                {STATES.filter((s) => s !== 'Central').map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setRole('user')}
                className={`px-2 py-1 rounded-md font-medium text-[11px] transition-all ${
                  role === 'user'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                User
              </button>
              <button
                onClick={() => {
                  setRole('admin');
                  setCurrentTab('admin');
                }}
                className={`px-2 py-1 rounded-md font-medium text-[11px] transition-all ${
                  role === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>

            {/* Test Status Indicator */}
            {allTestsPassed ? (
              <div
                className="hidden xl:flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800"
                title="All 13 pure calculation tests passed on boot within ±₹1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calcs Verified</span>
              </div>
            ) : null}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setCurrentTab('assistant')}
            className={`px-3 py-1 font-semibold rounded ${
              currentTab === 'assistant' ? 'text-emerald-600 font-bold' : 'text-slate-500'
            }`}
          >
            Assistant
          </button>
          <button
            onClick={() => setCurrentTab('calculators')}
            className={`px-3 py-1 font-semibold rounded ${
              currentTab === 'calculators' ? 'text-teal-600 font-bold' : 'text-slate-500'
            }`}
          >
            Calculators
          </button>
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-3 py-1 font-semibold rounded ${
              currentTab === 'admin' ? 'text-indigo-600 font-bold' : 'text-slate-500'
            }`}
          >
            Admin Panel
          </button>
        </div>
      </div>
    </header>
  );
};
