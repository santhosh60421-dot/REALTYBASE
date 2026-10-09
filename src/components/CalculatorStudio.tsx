import React, { useState } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Home,
  Percent,
  Briefcase,
  Layers,
  Coins
} from 'lucide-react';
import {
  calculateAffordability,
  calculateAmortizationSchedule,
  calculateBrokerageAndGST,
  calculateBuyVsRent,
  calculateCapitalGains,
  calculateEMI,
  calculatePrepayment,
  calculateRentalYield,
  calculateROIScenarios,
  calculateStampDutyAndRegistration,
  calculateStartupCostAndCashflow,
  calculateTenureComparison,
  calculateTotalInterest
} from '../calc/engine.ts';
import { INITIAL_RATES_TABLE } from '../calc/rates.ts';

const CALCULATORS_LIST = [
  { id: 'calc_emi', name: '1. Home Loan EMI', category: 'Lending' },
  { id: 'calc_amortization', name: '2. Monthly Amortization Table', category: 'Lending' },
  { id: 'calc_total_interest', name: '3. Total Interest & Outflow', category: 'Lending' },
  { id: 'calc_affordability', name: '4. Mortgage Affordability (FOIR)', category: 'Lending' },
  { id: 'calc_prepayment', name: '5. Prepayment Acceleration', category: 'Lending' },
  { id: 'calc_tenure_comparison', name: '6. Tenure Trade-Off Comparison', category: 'Lending' },
  { id: 'calc_rental_yield', name: '7. Rental Yield & Payback', category: 'Investment' },
  { id: 'calc_roi_scenarios', name: '8. Multi-Scenario ROI & CAGR', category: 'Investment' },
  { id: 'calc_buy_vs_rent', name: '9. Buy vs Rent Decision Engine', category: 'Investment' },
  { id: 'calc_brokerage_gst', name: '10. Brokerage, 18% GST & TDS', category: 'Brokerage' },
  { id: 'calc_stamp_duty', name: '11. State Stamp Duty & Reg Slabs', category: 'Statutory' },
  { id: 'calc_capital_gains', name: '12. Capital Gains (Budget 2024)', category: 'Taxation' },
  { id: 'calc_startup_cashflow', name: '13. Agency Startup & Cashflow', category: 'Business' }
];

export const CalculatorStudio: React.FC = () => {
  const [selectedCalc, setSelectedCalc] = useState<string>('calc_emi');
  const [showWorking, setShowWorking] = useState(true);

  // Form states
  // EMI & Loan states
  const [principal, setPrincipal] = useState<number>(8000000);
  const [annualRate, setAnnualRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  // Prepayment
  const [lumpSumPrepay, setLumpSumPrepay] = useState<number>(500000);
  const [extraMonthlyPrepay, setExtraMonthlyPrepay] = useState<number>(0);

  // Affordability
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEmis, setExistingEmis] = useState<number>(0);
  const [maxFoirPct, setMaxFoirPct] = useState<number>(40);

  // Rental Yield
  const [propertyCost, setPropertyCost] = useState<number>(10000000);
  const [monthlyRent, setMonthlyRent] = useState<number>(30000);
  const [annualExpenses, setAnnualExpenses] = useState<number>(0);

  // Brokerage & GST
  const [dealValue, setDealValue] = useState<number>(10000000);
  const [brokerageRate, setBrokerageRate] = useState<number>(2.0);
  const [clientType, setClientType] = useState<'individual' | 'corporate_firm'>('corporate_firm');

  // Stamp Duty
  const [stampPropVal, setStampPropVal] = useState<number>(7500000);
  const [stateName, setStateName] = useState<string>('Maharashtra');
  const [buyerGender, setBuyerGender] = useState<'male' | 'female' | 'joint'>('male');

  // Capital Gains
  const [salePrice, setSalePrice] = useState<number>(15000000);
  const [acqCost, setAcqCost] = useState<number>(8000000);
  const [acqYear, setAcqYear] = useState<string>('2015-16');
  const [holdingMonths, setHoldingMonths] = useState<number>(60);
  const [sec54Investment, setSec54Investment] = useState<number>(0);
  const [sec54ECBonds, setSec54ECBonds] = useState<number>(0);

  // Startup Cashflow
  const [officeRent, setOfficeRent] = useState<number>(35000);
  const [fitoutCost, setFitoutCost] = useState<number>(250000);
  const [teamPayroll, setTeamPayroll] = useState<number>(80000);

  // Buy vs Rent
  const [bvrPropCost, setBvrPropCost] = useState<number>(8000000);
  const [bvrRent, setBvrRent] = useState<number>(25000);

  // Run calculation dynamically
  const runActiveCalculator = () => {
    switch (selectedCalc) {
      case 'calc_emi':
        return calculateEMI(principal, annualRate, tenureYears, INITIAL_RATES_TABLE, true);
      case 'calc_amortization':
        return calculateAmortizationSchedule(principal, annualRate, tenureYears, [{ month: 1, lumpSum: lumpSumPrepay }], INITIAL_RATES_TABLE);
      case 'calc_total_interest':
        return calculateTotalInterest(principal, annualRate, tenureYears, INITIAL_RATES_TABLE);
      case 'calc_affordability':
        return calculateAffordability(monthlyIncome, existingEmis, maxFoirPct, annualRate, tenureYears, INITIAL_RATES_TABLE);
      case 'calc_prepayment':
        return calculatePrepayment(principal, annualRate, tenureYears, lumpSumPrepay, 1, extraMonthlyPrepay, INITIAL_RATES_TABLE);
      case 'calc_tenure_comparison':
        return calculateTenureComparison(principal, annualRate, [10, 15, 20, 25, 30], INITIAL_RATES_TABLE);
      case 'calc_rental_yield':
        return calculateRentalYield(propertyCost, monthlyRent, annualExpenses);
      case 'calc_roi_scenarios':
        return calculateROIScenarios(propertyCost, 10, 6.0, monthlyRent, 4.0);
      case 'calc_buy_vs_rent':
        return calculateBuyVsRent(bvrPropCost, 20, 8.5, 20, bvrRent);
      case 'calc_brokerage_gst':
        return calculateBrokerageAndGST(dealValue, brokerageRate, clientType, false, INITIAL_RATES_TABLE);
      case 'calc_stamp_duty':
        return calculateStampDutyAndRegistration(stampPropVal, stateName, buyerGender, 'metro', INITIAL_RATES_TABLE);
      case 'calc_capital_gains':
        return calculateCapitalGains(salePrice, 200000, acqCost, acqYear, 0, holdingMonths, sec54Investment, sec54ECBonds, INITIAL_RATES_TABLE);
      case 'calc_startup_cashflow':
        return calculateStartupCostAndCashflow(officeRent, 6, fitoutCost, 25000, 20000, teamPayroll, 30000, 6, 1.5, 7500000, 2.0);
      default:
        return calculateEMI(principal, annualRate, tenureYears);
    }
  };

  const calcResult = runActiveCalculator();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              PURE TYPESCRIPT • ZERO ESTIMATES
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
              ROUND-HALF-UP TO NEAREST RUPEE
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Real Estate Calculator Studio</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            13 verified financial & compliance calculators. All rates linked to the editable statutory rates registry.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              setSelectedCalc('calc_emi');
              setPrincipal(8000000);
              setAnnualRate(8.5);
              setTenureYears(20);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-medium"
          >
            Ref: ₹80L Loan (EMI ₹69,426)
          </button>
          <button
            onClick={() => {
              setSelectedCalc('calc_rental_yield');
              setPropertyCost(10000000);
              setMonthlyRent(30000);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-medium"
          >
            Ref: ₹1Cr Yield (3.6%)
          </button>
          <button
            onClick={() => {
              setSelectedCalc('calc_brokerage_gst');
              setDealValue(10000000);
              setBrokerageRate(2.0);
            }}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 font-medium"
          >
            Ref: ₹1Cr Brokerage 18% GST
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: 13 Calculators Selector */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
            Select Calculator
          </span>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 shadow-sm max-h-[750px] overflow-y-auto">
            {CALCULATORS_LIST.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCalc(c.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  selectedCalc === c.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                    selectedCalc === c.id
                      ? 'bg-teal-700 text-teal-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {c.category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content: Inputs + Dynamic Output Card + "Show Working" */}
        <div className="lg:col-span-8 space-y-6">
          {/* Inputs Section Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-teal-600" />
                {CALCULATORS_LIST.find((c) => c.id === selectedCalc)?.name}
              </h3>
              <span className="text-xs font-medium text-slate-400">Pure TypeScript Model</span>
            </div>

            {/* Dynamic Inputs according to calculator */}
            {['calc_emi', 'calc_amortization', 'calc_total_interest', 'calc_prepayment', 'calc_tenure_comparison'].includes(selectedCalc) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    ₹{(principal / 100000).toFixed(2)} Lakhs
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    max="40"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Max allowed: 40%</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    max="40"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {tenureYears * 12} Installments
                  </span>
                </div>

                {selectedCalc === 'calc_prepayment' && (
                  <>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Lump Sum Prepayment (₹)
                      </label>
                      <input
                        type="number"
                        value={lumpSumPrepay}
                        onChange={(e) => setLumpSumPrepay(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Extra Monthly Principal (₹)
                      </label>
                      <input
                        type="number"
                        value={extraMonthlyPrepay}
                        onChange={(e) => setExtraMonthlyPrepay(Number(e.target.value))}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Affordability Inputs */}
            {selectedCalc === 'calc_affordability' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Gross Monthly Salary / Income (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Existing Monthly EMIs (₹)
                  </label>
                  <input
                    type="number"
                    value={existingEmis}
                    onChange={(e) => setExistingEmis(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Max FOIR Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={maxFoirPct}
                    onChange={(e) => setMaxFoirPct(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Rental Yield Inputs */}
            {['calc_rental_yield', 'calc_roi_scenarios'].includes(selectedCalc) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Property Purchase Value (₹)
                  </label>
                  <input
                    type="number"
                    value={propertyCost}
                    onChange={(e) => setPropertyCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    ₹{(propertyCost / 10000000).toFixed(2)} Crore
                  </span>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Monthly Rental Income (₹)
                  </label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Annual Maintenance / Taxes (₹)
                  </label>
                  <input
                    type="number"
                    value={annualExpenses}
                    onChange={(e) => setAnnualExpenses(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Brokerage & GST Inputs */}
            {selectedCalc === 'calc_brokerage_gst' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Property Transaction Value (₹)
                  </label>
                  <input
                    type="number"
                    value={dealValue}
                    onChange={(e) => setDealValue(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Agreed Brokerage Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={brokerageRate}
                    onChange={(e) => setBrokerageRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Client Category (TDS 194-H)
                  </label>
                  <select
                    value={clientType}
                    onChange={(e: any) => setClientType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="corporate_firm">Corporate / Firm (5% TDS)</option>
                    <option value="individual">Individual Buyer / Seller (No TDS)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Stamp Duty Inputs */}
            {selectedCalc === 'calc_stamp_duty' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Property Agreement Value (₹)
                  </label>
                  <input
                    type="number"
                    value={stampPropVal}
                    onChange={(e) => setStampPropVal(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    State / Jurisdiction
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Maharashtra">Maharashtra (5% + 1% Metro Cess, ₹30K Cap)</option>
                    <option value="Karnataka">Karnataka (2%, 3%, 5% Slabs + 10% Cess)</option>
                    <option value="Delhi">Delhi (Male 6%, Female 4%, Joint 5%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Buyer Gender
                  </label>
                  <select
                    value={buyerGender}
                    onChange={(e: any) => setBuyerGender(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female (1% Concession where applicable)</option>
                    <option value="joint">Joint (Male + Female)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Capital Gains Inputs */}
            {selectedCalc === 'calc_capital_gains' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Sale Consideration (₹)
                  </label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Acquisition Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={acqCost}
                    onChange={(e) => setAcqCost(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Acquisition Year (CII Table)
                  </label>
                  <select
                    value={acqYear}
                    onChange={(e) => setAcqYear(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="2005-06">2005-06 (CII 117)</option>
                    <option value="2010-11">2010-11 (CII 167)</option>
                    <option value="2015-16">2015-16 (CII 254)</option>
                    <option value="2020-21">2020-21 (CII 301)</option>
                    <option value="2024-25">2024-25 (CII 363)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Calculation Output & Metrics
              </h3>
              <button
                onClick={() => setShowWorking(!showWorking)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                {showWorking ? 'Hide Working Panel' : 'Show Working Panel'}
                {showWorking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {calcResult.status === 'SUCCESS' && calcResult.data && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(calcResult.data)
                  .filter(([k, v]) => typeof v === 'number' || typeof v === 'string')
                  .slice(0, 8)
                  .map(([key, val]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 font-bold block truncate uppercase">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {typeof val === 'number' && key.toLowerCase().includes('pct')
                          ? `${val}%`
                          : typeof val === 'number' && !key.toLowerCase().includes('months') && !key.toLowerCase().includes('years')
                          ? `₹${val.toLocaleString('en-IN')}`
                          : String(val)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Amortization schedule excerpt if active */}
            {selectedCalc === 'calc_amortization' && calcResult.data?.schedule && (
              <div className="mt-3">
                <span className="text-xs font-bold text-slate-500 uppercase block mb-1.5">
                  First 12 Months Amortization Schedule
                </span>
                <div className="overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 uppercase sticky top-0">
                      <tr>
                        <th className="p-2">Month</th>
                        <th className="p-2">Opening</th>
                        <th className="p-2">EMI</th>
                        <th className="p-2">Principal</th>
                        <th className="p-2">Interest</th>
                        <th className="p-2">Closing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {calcResult.data.schedule.slice(0, 12).map((row: any) => (
                        <tr key={row.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-2 font-bold">{row.month}</td>
                          <td className="p-2">₹{row.openingBalance.toLocaleString('en-IN')}</td>
                          <td className="p-2">₹{row.emi.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-emerald-600">₹{row.principalPaid.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-red-500">₹{row.interestPaid.toLocaleString('en-IN')}</td>
                          <td className="p-2 font-bold">₹{row.closingBalance.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mandatory "Show Working" Panel */}
            {showWorking && calcResult.working && (
              <div className="mt-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5 text-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                  <span>Mathematical Working & Statutory Assumptions</span>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                    Formula in Words:
                  </span>
                  <p className="font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {calcResult.working.formulaInWords}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Step-by-Step Intermediate Calculations:
                  </span>
                  <div className="space-y-1.5">
                    {calcResult.working.intermediateSteps?.map((step: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{step.step}: </span>
                          <span className="text-slate-500 text-[11px]">{step.description}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{step.result}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 text-[11px] text-teal-900 dark:text-teal-200 flex items-center justify-between">
                  <span>
                    <strong>Rate Reference:</strong> {calcResult.working.rateSourceAndDate?.rateName} ({calcResult.working.rateSourceAndDate?.source})
                  </span>
                  <span className="font-mono">Updated: {calcResult.working.rateSourceAndDate?.lastUpdatedDate}</span>
                </div>

                {calcResult.working.whatIsNotIncluded?.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-200">
                    <span className="font-bold block mb-1">Explicitly Excluded from this Calculation:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {calcResult.working.whatIsNotIncluded.map((ex: string, i: number) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
