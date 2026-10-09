/**
 * Types and interfaces for REALTYBASE Calculation Engine.
 * Pure TypeScript definitions. No UI or network dependencies.
 */

export interface RateItem {
  id: string;
  name: string;
  key: string;
  jurisdiction: string; // 'Central' | 'Maharashtra' | 'Karnataka' | 'Delhi' | 'Haryana' etc.
  type: 'percentage' | 'fixed' | 'slabs' | 'table';
  value?: number; // For single percentage or fixed rate
  slabs?: RateSlab[];
  unit?: string; // '%', 'INR', 'months', etc.
  source: string;
  sourceDocId?: string;
  effectiveDate: string; // ISO YYYY-MM-DD
  lastUpdatedDate: string; // ISO YYYY-MM-DD
  updatedBy: string;
  reviewer?: string;
  reviewerRole?: string;
  reviewStatus: 'Reviewed' | 'Pending';
  reviewDate?: string;
  notes?: string;
  isConfirmed?: boolean;
}

export interface RateSlab {
  min: number; // Inclusive
  max: number | null; // Null means infinity
  inclusiveMax: boolean; // whether boundary is inclusive (<=) or exclusive (<)
  ratePct: number;
  fixedFee?: number;
  surchargePct?: number;
  cessPct?: number;
  description: string;
}

export interface CalculationWorking {
  formulaInWords: string;
  inputsAndAssumptions: Record<string, string | number | boolean>;
  intermediateSteps: Array<{
    step: string;
    description: string;
    formula?: string;
    result: string;
  }>;
  rateSourceAndDate: {
    rateName: string;
    rateValue: string;
    jurisdiction: string;
    source: string;
    effectiveDate: string;
    lastUpdatedDate: string;
    confirmedByUser?: boolean;
  };
  finalAnswer: string;
  whatIsNotIncluded: string[];
}

export type CalcStatus = 'SUCCESS' | 'NEEDS_RATE_CONFIRMATION' | 'INVALID_INPUT';

export interface CalculationResult<T = any> {
  status: CalcStatus;
  calculatorId: string;
  calculatorName: string;
  data?: T;
  working?: CalculationWorking;
  error?: string;
  needsConfirmation?: {
    rateKey: string;
    rateName: string;
    reason: string;
    lastUpdatedDate: string;
    staleMonths: number;
  };
}

export interface AmortizationRow {
  month: number;
  year: number;
  openingBalance: number;
  emi: number;
  principalPaid: number;
  interestPaid: number;
  prepayment: number;
  closingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationSummary {
  loanAmount: number;
  annualRatePct: number;
  tenureYears: number;
  tenureMonths: number;
  monthlyEMI: number;
  totalInterestPaid: number;
  totalPayment: number;
  year1Interest: number;
  balanceAfter12Months: number;
  balanceAfter60Months: number;
  yearlyBreakdown: Array<{
    year: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }>;
  schedule?: AmortizationRow[];
}

export interface AffordabilityResult {
  monthlyGrossIncome: number;
  existingMonthlyEmis: number;
  foirPct: number;
  maxAllowableEmi: number;
  annualRatePct: number;
  tenureYears: number;
  maxEligibleLoan: number;
  affordabilityStatus: 'Comfortable' | 'Moderate' | 'Stretched' | 'High Risk';
}

export interface PrepaymentResult {
  originalLoan: number;
  originalEMI: number;
  originalTotalInterest: number;
  originalTenureMonths: number;
  revisedTotalInterest: number;
  interestSaved: number;
  revisedTenureMonths: number;
  monthsSaved: number;
  effectiveReductionYears: number;
}

export interface RentalYieldResult {
  propertyCost: number;
  monthlyRent: number;
  annualGrossRent: number;
  annualExpenses: number;
  netAnnualRent: number;
  grossRentalYieldPct: number;
  netRentalYieldPct: number;
  paybackYears: number;
}

export interface ROIScenario {
  scenarioName: 'Conservative' | 'Base' | 'Optimistic';
  appreciationRatePct: number;
  futurePropertyValue: number;
  capitalAppreciationGain: number;
  totalRentCollected: number;
  totalNetReturn: number;
  roiPct: number;
  cagrPct: number;
}

export interface BuyVsRentResult {
  horizonYears: number;
  buyTotalOutflow: number;
  buyEstimatedPropertyValue: number;
  buyNetWealth: number;
  rentTotalOutflow: number;
  rentInvestmentPortfolioValue: number;
  rentNetWealth: number;
  recommendation: 'BUYING_FAVORABLE' | 'RENTING_FAVORABLE' | 'NEUTRAL';
  wealthDifference: number;
  breakEvenYear: number | null;
  cashflowYearly: Array<{
    year: number;
    buyOutflow: number;
    rentOutflow: number;
    propertyValue: number;
    rentPortfolio: number;
  }>;
}

export interface BrokerageGSTResult {
  transactionValue: number;
  brokerageRatePct: number;
  grossBrokerage: number;
  gstRatePct: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
  invoiceTotalWithGST: number;
  tdsApplicable: boolean;
  tdsSection: string;
  tdsRatePct: number;
  tdsDeducted: number;
  netPayableToAgent: number;
}

export interface StampDutyResult {
  propertyValue: number;
  state: string;
  gender: 'male' | 'female' | 'joint';
  locationType: 'urban' | 'rural' | 'metro';
  stampDutyPct: number;
  stampDutyAmount: number;
  cessSurchargePct: number;
  cessSurchargeAmount: number;
  registrationFeePct: number;
  registrationFeeAmount: number;
  registrationCap?: number;
  totalGovernmentCharges: number;
  effectivePercentage: number;
  appliedSlabs: string[];
}

export interface CapitalGainsResult {
  saleConsideration: number;
  transferExpenses: number;
  netSaleConsideration: number;
  acquisitionCost: number;
  acquisitionYear: string;
  indexedCostOfAcquisition: number;
  improvementCostTotal: number;
  isLTCG: boolean;
  holdingMonths: number;
  grossCapitalGain: number;
  section54Deduction: number;
  section54ECDeduction: number;
  taxableCapitalGain: number;
  taxRatePct: number;
  cessPct: number;
  estimatedTaxPayable: number;
  regimeApplied: 'Budget2024_12_5_WithoutIndexation' | 'Grandfathered_20_WithIndexation' | 'STCG_Slab';
}

export interface StartupCashflowResult {
  upfrontCapitalRequired: number;
  monthlyOperatingExpenses: number;
  recommendedReserveMonths: number;
  recommendedTotalSeedCapital: number;
  monthlyDealsToBreakeven: number;
  expectedMonthlyRevenue: number;
  netMonthlyCashflow: number;
  runwayMonths: number;
  projected12MonthCashflow: Array<{
    month: number;
    revenue: number;
    expenses: number;
    net: number;
    bankBalance: number;
  }>;
}
