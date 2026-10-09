/**
 * REALTYBASE Calculation Engine.
 * Pure TypeScript. Zero UI / zero network / zero AI dependencies.
 * Uses decimal.js for arbitrary-precision financial calculations.
 * Enforces round-half-up at the final step to the nearest integer rupee.
 */

import Decimal from 'decimal.js';
import {
  AffordabilityResult,
  AmortizationRow,
  AmortizationSummary,
  BrokerageGSTResult,
  BuyVsRentResult,
  CalculationResult,
  CalculationWorking,
  CapitalGainsResult,
  PrepaymentResult,
  RateItem,
  RentalYieldResult,
  ROIScenario,
  StampDutyResult,
  StartupCashflowResult
} from './types.ts';
import {
  CII_TABLE,
  checkRateFreshness,
  INITIAL_RATES_TABLE,
  SYSTEM_REFERENCE_DATE
} from './rates.ts';

// Global Decimal configuration: 40 decimal places precision, round half-up
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export class CalcValidationError extends Error {
  constructor(public field: string, message: string) {
    super(`Validation Error on [${field}]: ${message}`);
    this.name = 'CalcValidationError';
  }
}

/**
 * Standard input validator.
 * Rejects negative, NaN, zero (where invalid), rate > 40%, tenure > 40 years.
 */
export function validateFinancialInput(
  name: string,
  value: any,
  options: {
    allowZero?: boolean;
    max?: number;
    min?: number;
    isRate?: boolean;
    isTenureYears?: boolean;
  } = {}
): Decimal {
  if (value === null || value === undefined || value === '') {
    throw new CalcValidationError(name, `Value is required and cannot be empty.`);
  }

  const num = Number(value);
  if (isNaN(num)) {
    throw new CalcValidationError(name, `Value must be a valid number, received "${value}".`);
  }

  const dec = new Decimal(num);

  if (!options.allowZero && dec.isZero()) {
    throw new CalcValidationError(name, `Value cannot be zero.`);
  }

  if (options.min !== undefined && dec.lt(options.min)) {
    throw new CalcValidationError(name, `Value cannot be less than ${options.min}.`);
  } else if (!options.allowZero && dec.isNegative()) {
    throw new CalcValidationError(name, `Value cannot be negative.`);
  } else if (options.allowZero && dec.isNegative()) {
    throw new CalcValidationError(name, `Value cannot be negative.`);
  }

  if (options.isRate) {
    if (dec.gt(40)) {
      throw new CalcValidationError(name, `Annual interest/percentage rate cannot exceed 40%, received ${value}%.`);
    }
  }

  if (options.isTenureYears) {
    if (dec.gt(40)) {
      throw new CalcValidationError(name, `Loan/holding tenure cannot exceed 40 years, received ${value} years.`);
    }
    if (dec.lte(0)) {
      throw new CalcValidationError(name, `Tenure must be strictly greater than 0.`);
    }
  }

  if (options.max !== undefined && dec.gt(options.max)) {
    throw new CalcValidationError(name, `Value cannot exceed ${options.max}.`);
  }

  return dec;
}

/**
 * Format currency according to Indian Numbering System (Lakhs, Crores)
 */
export function formatINR(val: number | Decimal): string {
  const dec = typeof val === 'number' ? new Decimal(val) : val;
  const rounded = dec.round().toNumber();
  return '₹' + rounded.toLocaleString('en-IN');
}

/**
 * 1. EMI Calculator (Equated Monthly Installment)
 * Formula: EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateEMI(
  principalAmount: number,
  annualRatePct: number,
  tenureYears: number,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE,
  overrideFreshness: boolean = false
): CalculationResult<{ monthlyEMI: number; totalPayment: number; totalInterest: number }> {
  try {
    const P = validateFinancialInput('Principal', principalAmount, { min: 1000 });
    const R = validateFinancialInput('Annual Rate %', annualRatePct, { isRate: true, min: 0.1 });
    const N_years = validateFinancialInput('Tenure Years', tenureYears, { isTenureYears: true });

    // Rate freshness check from rates table
    const rateItem = ratesTable['benchmark_home_loan_rate'];
    if (!overrideFreshness && rateItem) {
      const freshCheck = checkRateFreshness(rateItem);
      if (!freshCheck.isFresh && !rateItem.isConfirmed) {
        return {
          status: 'NEEDS_RATE_CONFIRMATION',
          calculatorId: 'calc_emi',
          calculatorName: 'EMI Calculator',
          needsConfirmation: {
            rateKey: rateItem.key,
            rateName: rateItem.name,
            reason: freshCheck.reason || 'Rate requires confirmation',
            lastUpdatedDate: rateItem.lastUpdatedDate,
            staleMonths: freshCheck.monthsOld || 6
          }
        };
      }
    }

    const nMonths = N_years.mul(12);
    const rMonthly = R.div(100).div(12);

    // (1 + r)^n
    const onePlusR = rMonthly.plus(1);
    const compoundFactor = onePlusR.pow(nMonths.toNumber());

    // Numerator: P * r * (1+r)^n
    const numerator = P.mul(rMonthly).mul(compoundFactor);
    // Denominator: (1+r)^n - 1
    const denominator = compoundFactor.minus(1);

    const emiExact = numerator.div(denominator);
    const emiRounded = emiExact.round();
    const totalPayment = emiRounded.mul(nMonths);
    const totalInterest = totalPayment.minus(P);

    const working: CalculationWorking = {
      formulaInWords: 'EMI = [Principal × Monthly Interest Rate × (1 + Monthly Interest Rate)^TenureMonths] ÷ [(1 + Monthly Interest Rate)^TenureMonths - 1]',
      inputsAndAssumptions: {
        'Principal (P)': formatINR(P),
        'Annual Interest Rate (R)': `${R.toString()}%`,
        'Monthly Interest Rate (r)': `${rMonthly.mul(100).toFixed(6)}% (R / 1200)`,
        'Tenure': `${N_years.toString()} years (${nMonths.toString()} months)`,
        'Rounding Policy': 'Round-half-up to nearest whole Rupee at final step'
      },
      intermediateSteps: [
        {
          step: '1. Monthly Interest Rate',
          description: 'Convert annual percentage to monthly fractional rate',
          formula: `${R.toString()}% ÷ 12 = ${rMonthly.toString()}`,
          result: `${rMonthly.toFixed(8)} per month`
        },
        {
          step: '2. Compounding Factor (1+r)^n',
          description: `Compound monthly rate over ${nMonths.toString()} installments`,
          formula: `(1 + ${rMonthly.toFixed(6)})^${nMonths.toString()}`,
          result: compoundFactor.toFixed(6)
        },
        {
          step: '3. Exact Monthly EMI Before Rounding',
          description: 'Evaluate standard amortization annuity formula',
          formula: `[${P.toString()} × ${rMonthly.toFixed(6)} × ${compoundFactor.toFixed(4)}] ÷ [${compoundFactor.toFixed(4)} - 1]`,
          result: `₹${emiExact.toFixed(2)}`
        },
        {
          step: '4. Total Lifetime Outflow',
          description: `Multiply monthly EMI by ${nMonths.toString()} months`,
          formula: `${emiRounded.toString()} × ${nMonths.toString()}`,
          result: formatINR(totalPayment)
        }
      ],
      rateSourceAndDate: {
        rateName: rateItem?.name || 'Home Loan Rate',
        rateValue: `${annualRatePct}%`,
        jurisdiction: rateItem?.jurisdiction || 'Central',
        source: rateItem?.source || 'Bank Lending Benchmark',
        effectiveDate: rateItem?.effectiveDate || '2025-01-01',
        lastUpdatedDate: rateItem?.lastUpdatedDate || SYSTEM_REFERENCE_DATE,
        confirmedByUser: overrideFreshness
      },
      finalAnswer: `Monthly EMI is ${formatINR(emiRounded)}. Total interest paid over ${N_years.toString()} years is ${formatINR(totalInterest)}.`,
      whatIsNotIncluded: [
        'Processing fees & loan application administrative charges (typically 0.25% - 0.50% + GST)',
        'Property insurance and mandatory mortgage credit shield premiums',
        'Stamp duty on loan agreement / equitable mortgage Memorandum of Deposit of Title Deeds (MODTD)',
        'Prepayment or foreclosure penalty (zero for individual floating rate home loans under RBI directives)'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_emi',
      calculatorName: 'EMI Calculator',
      data: {
        monthlyEMI: emiRounded.toNumber(),
        totalPayment: totalPayment.toNumber(),
        totalInterest: totalInterest.toNumber()
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_emi',
      calculatorName: 'EMI Calculator',
      error: err.message
    };
  }
}

/**
 * 2. Month-by-month Amortization Schedule
 * Also calculates Year 1 interest, balance after 12 months, balance after 60 months.
 */
export function calculateAmortizationSchedule(
  principalAmount: number,
  annualRatePct: number,
  tenureYears: number,
  prepayments: Array<{ month: number; lumpSum: number }> = [],
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<AmortizationSummary> {
  try {
    const P = validateFinancialInput('Principal', principalAmount, { min: 1000 });
    const R = validateFinancialInput('Annual Rate %', annualRatePct, { isRate: true, min: 0.1 });
    const N_years = validateFinancialInput('Tenure Years', tenureYears, { isTenureYears: true });

    const totalMonths = N_years.mul(12).toNumber();
    const rMonthly = R.div(100).div(12);

    // Initial EMI calculation
    const onePlusR = rMonthly.plus(1);
    const compoundFactor = onePlusR.pow(totalMonths);
    const baseEmi = P.mul(rMonthly).mul(compoundFactor).div(compoundFactor.minus(1)).round();

    let currentBalance = P;
    let totalInterestPaid = new Decimal(0);
    let year1Interest = new Decimal(0);
    let balanceAfter12Months = new Decimal(0);
    let balanceAfter60Months = new Decimal(0);

    const schedule: AmortizationRow[] = [];
    const yearlyMap: Record<number, { principal: Decimal; interest: Decimal; balance: Decimal }> = {};

    const prepaymentMap = new Map<number, Decimal>();
    for (const prepay of prepayments) {
      if (prepay.month > 0 && prepay.lumpSum > 0) {
        prepaymentMap.set(prepay.month, new Decimal(prepay.lumpSum));
      }
    }

    let actualMonths = 0;

    for (let m = 1; m <= totalMonths && currentBalance.gt(0); m++) {
      actualMonths = m;
      const year = Math.ceil(m / 12);
      const openingBalance = currentBalance;

      // Exact monthly interest = opening balance * monthly rate
      const interestForMonth = openingBalance.mul(rMonthly);
      totalInterestPaid = totalInterestPaid.plus(interestForMonth);

      if (m <= 12) {
        year1Interest = year1Interest.plus(interestForMonth);
      }

      let emiForMonth = baseEmi;
      let principalForMonth = emiForMonth.minus(interestForMonth);

      // If balance is less than standard principal portion, adjust final installment
      if (currentBalance.lte(principalForMonth)) {
        principalForMonth = currentBalance;
        emiForMonth = principalForMonth.plus(interestForMonth);
      }

      let prepayAmt = prepaymentMap.get(m) || new Decimal(0);
      if (prepayAmt.gt(currentBalance.minus(principalForMonth))) {
        prepayAmt = Decimal.max(0, currentBalance.minus(principalForMonth));
      }

      const closingBalance = Decimal.max(0, openingBalance.minus(principalForMonth).minus(prepayAmt));
      currentBalance = closingBalance;

      if (m === 12) {
        balanceAfter12Months = closingBalance.round();
      }
      if (m === 60) {
        balanceAfter60Months = closingBalance.round();
      }

      // Record year aggregates
      if (!yearlyMap[year]) {
        yearlyMap[year] = { principal: new Decimal(0), interest: new Decimal(0), balance: new Decimal(0) };
      }
      yearlyMap[year].principal = yearlyMap[year].principal.plus(principalForMonth).plus(prepayAmt);
      yearlyMap[year].interest = yearlyMap[year].interest.plus(interestForMonth);
      yearlyMap[year].balance = closingBalance.round();

      // Ensure exact integer principal match across total tenure
      let roundedPrincipalPaid = principalForMonth.round().toNumber();
      if (closingBalance.isZero()) {
        const previousPrincipalSum = schedule.reduce((sum, r) => sum + r.principalPaid, 0);
        roundedPrincipalPaid = P.toNumber() - previousPrincipalSum;
      }

      schedule.push({
        month: m,
        year,
        openingBalance: openingBalance.round().toNumber(),
        emi: emiForMonth.round().toNumber(),
        principalPaid: roundedPrincipalPaid,
        interestPaid: interestForMonth.round().toNumber(),
        prepayment: prepayAmt.round().toNumber(),
        closingBalance: closingBalance.round().toNumber(),
        cumulativeInterest: totalInterestPaid.round().toNumber(),
        cumulativePrincipal: P.minus(closingBalance).round().toNumber()
      });
    }

    const yearlyBreakdown = Object.entries(yearlyMap).map(([yr, vals]) => ({
      year: Number(yr),
      principalPaid: vals.principal.round().toNumber(),
      interestPaid: vals.interest.round().toNumber(),
      endingBalance: vals.balance.toNumber()
    }));

    const summary: AmortizationSummary = {
      loanAmount: P.toNumber(),
      annualRatePct: R.toNumber(),
      tenureYears: N_years.toNumber(),
      tenureMonths: totalMonths,
      monthlyEMI: baseEmi.toNumber(),
      totalInterestPaid: totalInterestPaid.round().toNumber(),
      totalPayment: P.plus(totalInterestPaid).round().toNumber(),
      year1Interest: year1Interest.round().toNumber(),
      balanceAfter12Months: balanceAfter12Months.toNumber(),
      balanceAfter60Months: balanceAfter60Months.toNumber(),
      yearlyBreakdown,
      schedule
    };

    const working: CalculationWorking = {
      formulaInWords: 'Monthly Interest = Opening Balance × (R / 1200); Monthly Principal = EMI - Monthly Interest; Closing Balance = Opening Balance - Monthly Principal - Prepayments',
      inputsAndAssumptions: {
        'Initial Loan': formatINR(P),
        'Interest Rate': `${R.toString()}% p.a.`,
        'Total Scheduled Months': totalMonths,
        'Base Monthly EMI': formatINR(baseEmi)
      },
      intermediateSteps: [
        {
          step: 'Year 1 Interest Total',
          description: 'Sum of interest components for months 1 to 12',
          result: formatINR(year1Interest.round())
        },
        {
          step: 'Balance after 12 months',
          description: 'Outstanding principal balance after paying 12 regular installments',
          result: formatINR(balanceAfter12Months)
        },
        {
          step: 'Balance after 5 years (60 months)',
          description: 'Outstanding principal balance at the end of Year 5',
          result: formatINR(balanceAfter60Months)
        },
        {
          step: 'Final Month Balance',
          description: `Outstanding balance at month ${actualMonths}`,
          result: '₹0'
        }
      ],
      rateSourceAndDate: {
        rateName: 'Home Loan Rate Benchmark',
        rateValue: `${annualRatePct}%`,
        jurisdiction: 'Central',
        source: 'RBI Master Directions / Benchmark Rate',
        effectiveDate: '2025-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Full schedule generated over ${actualMonths} months. Total interest: ${formatINR(totalInterestPaid.round())}. Year 1 interest: ${formatINR(year1Interest.round())}.`,
      whatIsNotIncluded: [
        'Annual reset of external benchmark repo rates during tenure',
        'Bank penal interest on late payments (typically 18% - 24% p.a. on overdue amount)',
        'Statutory GST on processing fees or statement retrieval charges'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_amortization',
      calculatorName: 'Loan Amortization Engine',
      data: summary,
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_amortization',
      calculatorName: 'Loan Amortization Engine',
      error: err.message
    };
  }
}

/**
 * 3. Total Interest Calculator
 */
export function calculateTotalInterest(
  principalAmount: number,
  annualRatePct: number,
  tenureYears: number,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<{ totalInterest: number; totalPayment: number; interestToPrincipalRatio: number }> {
  const emiRes = calculateEMI(principalAmount, annualRatePct, tenureYears, ratesTable);
  if (emiRes.status !== 'SUCCESS' || !emiRes.data) {
    return emiRes as any;
  }

  const P = new Decimal(principalAmount);
  const totalInterest = new Decimal(emiRes.data.totalInterest);
  const ratio = totalInterest.div(P).mul(100).toDecimalPlaces(2).toNumber();

  return {
    status: 'SUCCESS',
    calculatorId: 'calc_total_interest',
    calculatorName: 'Total Interest Calculator',
    data: {
      totalInterest: emiRes.data.totalInterest,
      totalPayment: emiRes.data.totalPayment,
      interestToPrincipalRatio: ratio
    },
    working: emiRes.working
  };
}

/**
 * 4. Affordability Calculator (EMI to Income limit editable)
 * Formula: Max EMI = Monthly Net Income * FOIR - Existing EMIs
 * Max Loan = Present Value of Max EMI at given rate and tenure
 */
export function calculateAffordability(
  monthlyGrossIncome: number,
  existingMonthlyEmis: number,
  maxFoirPct: number = 40.0,
  annualRatePct: number = 8.50,
  tenureYears: number = 20,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<AffordabilityResult> {
  try {
    const income = validateFinancialInput('Monthly Gross Income', monthlyGrossIncome, { min: 10000 });
    const existing = validateFinancialInput('Existing Monthly EMIs', existingMonthlyEmis, { allowZero: true });
    const foir = validateFinancialInput('Max FOIR %', maxFoirPct, { isRate: true, min: 10, max: 70 });
    const rate = validateFinancialInput('Annual Rate %', annualRatePct, { isRate: true, min: 1 });
    const tenure = validateFinancialInput('Tenure Years', tenureYears, { isTenureYears: true });

    const totalAllowedDebtPayment = income.mul(foir).div(100);
    const maxAvailableEmi = Decimal.max(0, totalAllowedDebtPayment.minus(existing)).round();

    if (maxAvailableEmi.lte(0)) {
      throw new CalcValidationError(
        'Existing EMIs',
        `Existing EMIs (${formatINR(existing)}) exceed the maximum allowable debt capacity (${formatINR(totalAllowedDebtPayment)}) under a ${foir.toString()}% FOIR threshold.`
      );
    }

    const nMonths = tenure.mul(12);
    const rMonthly = rate.div(100).div(12);
    const onePlusR = rMonthly.plus(1);
    const compoundFactor = onePlusR.pow(nMonths.toNumber());

    // Invert EMI formula: P = EMI * [(1+r)^n - 1] / [r * (1+r)^n]
    const maxLoan = maxAvailableEmi.mul(compoundFactor.minus(1)).div(rMonthly.mul(compoundFactor)).round();

    let statusCategory: 'Comfortable' | 'Moderate' | 'Stretched' | 'High Risk' = 'Comfortable';
    if (foir.gt(55)) statusCategory = 'High Risk';
    else if (foir.gt(45)) statusCategory = 'Stretched';
    else if (foir.gt(35)) statusCategory = 'Moderate';

    const working: CalculationWorking = {
      formulaInWords: 'Max Allowed EMI = (Monthly Gross Income × FOIR%) - Existing Monthly EMIs; Max Loan = Max EMI × [(1+r)^n - 1] ÷ [r × (1+r)^n]',
      inputsAndAssumptions: {
        'Monthly Gross Income': formatINR(income),
        'Existing Active EMIs': formatINR(existing),
        'FOIR Limit': `${foir.toString()}%`,
        'Home Loan Interest Rate': `${rate.toString()}% p.a.`,
        'Repayment Tenure': `${tenure.toString()} years (${nMonths.toString()} months)`
      },
      intermediateSteps: [
        {
          step: '1. Total Debt Capacity Cap',
          description: `Allowable monthly EMI obligations at ${foir.toString()}% of income`,
          formula: `${income.toString()} × ${foir.toString()}%`,
          result: formatINR(totalAllowedDebtPayment)
        },
        {
          step: '2. Net Disposable EMI for New Mortgage',
          description: 'Deduct existing ongoing debt servicing',
          formula: `${totalAllowedDebtPayment.toString()} - ${existing.toString()}`,
          result: formatINR(maxAvailableEmi)
        },
        {
          step: '3. Loan Eligibility Capitalization',
          description: 'Present value of annuity over loan tenure',
          result: formatINR(maxLoan)
        }
      ],
      rateSourceAndDate: {
        rateName: 'FOIR Benchmark Standard',
        rateValue: `${foir.toString()}%`,
        jurisdiction: 'Central',
        source: 'Prudent Banking Underwriting Standards / NHB Housing Guidelines',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `With ${formatINR(income)} monthly income and ${foir.toString()}% FOIR, maximum monthly EMI capacity is ${formatINR(maxAvailableEmi)}, giving an eligible loan of ${formatINR(maxLoan)}.`,
      whatIsNotIncluded: [
        'Discretionary bonus, rental, or variable incentive haircuts (banks usually discount variable pay by 50%)',
        'Co-applicant income addition eligibility',
        'Loan-to-Value (LTV) regulatory caps: 90% for loans <= 30L; 80% for 30L-75L; 75% for > 75L'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_affordability',
      calculatorName: 'Mortgage Affordability & FOIR Engine',
      data: {
        monthlyGrossIncome: income.toNumber(),
        existingMonthlyEmis: existing.toNumber(),
        foirPct: foir.toNumber(),
        maxAllowableEmi: maxAvailableEmi.toNumber(),
        annualRatePct: rate.toNumber(),
        tenureYears: tenure.toNumber(),
        maxEligibleLoan: maxLoan.toNumber(),
        affordabilityStatus: statusCategory
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_affordability',
      calculatorName: 'Mortgage Affordability & FOIR Engine',
      error: err.message
    };
  }
}

/**
 * 5. Prepayment Calculator (Lump Sum and Extra Monthly)
 */
export function calculatePrepayment(
  principalAmount: number,
  annualRatePct: number,
  tenureYears: number,
  lumpSumAmount: number = 0,
  lumpSumMonth: number = 1,
  extraMonthlyAmount: number = 0,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<PrepaymentResult> {
  try {
    const P = validateFinancialInput('Principal', principalAmount, { min: 1000 });
    const R = validateFinancialInput('Annual Rate %', annualRatePct, { isRate: true, min: 0.1 });
    const N_years = validateFinancialInput('Tenure Years', tenureYears, { isTenureYears: true });
    const lump = validateFinancialInput('Lump Sum Prepayment', lumpSumAmount, { allowZero: true });
    const extraMonth = validateFinancialInput('Extra Monthly Payment', extraMonthlyAmount, { allowZero: true });

    // Baseline run
    const baseSummary = calculateAmortizationSchedule(principalAmount, annualRatePct, tenureYears, [], ratesTable);
    if (baseSummary.status !== 'SUCCESS' || !baseSummary.data) {
      throw new Error(baseSummary.error || 'Failed to simulate baseline amortization.');
    }

    const prepayList: Array<{ month: number; lumpSum: number }> = [];
    if (lump.gt(0)) {
      prepayList.push({ month: lumpSumMonth, lumpSum: lump.toNumber() });
    }

    // Custom month simulation with extra monthly payment
    const totalMonths = N_years.mul(12).toNumber();
    const rMonthly = R.div(100).div(12);
    const baseEmi = new Decimal(baseSummary.data.monthlyEMI);

    let balance = P;
    let revisedInterest = new Decimal(0);
    let revisedMonths = 0;

    for (let m = 1; m <= totalMonths && balance.gt(0); m++) {
      revisedMonths = m;
      const interestForMonth = balance.mul(rMonthly);
      revisedInterest = revisedInterest.plus(interestForMonth);

      let emi = baseEmi;
      let principalPortion = emi.minus(interestForMonth);

      if (balance.lte(principalPortion)) {
        principalPortion = balance;
      }

      let extraThisMonth = extraMonth;
      if (m === lumpSumMonth) {
        extraThisMonth = extraThisMonth.plus(lump);
      }

      if (extraThisMonth.gt(balance.minus(principalPortion))) {
        extraThisMonth = Decimal.max(0, balance.minus(principalPortion));
      }

      balance = Decimal.max(0, balance.minus(principalPortion).minus(extraThisMonth));
    }

    const originalInterest = new Decimal(baseSummary.data.totalInterestPaid);
    const interestSaved = Decimal.max(0, originalInterest.minus(revisedInterest.round()));
    const monthsSaved = Math.max(0, totalMonths - revisedMonths);
    const yearsSaved = Number((monthsSaved / 12).toFixed(1));

    const working: CalculationWorking = {
      formulaInWords: 'Prepayments accelerate principal amortization: Interest Saved = Original Scheduled Interest - Accelerated Interest; Months Saved = Original Scheduled Months - Actual Months to Zero Balance',
      inputsAndAssumptions: {
        'Initial Loan': formatINR(P),
        'Interest Rate': `${R.toString()}% p.a.`,
        'Tenure': `${N_years.toString()} years (${totalMonths} months)`,
        'Lump Sum Prepayment': lump.gt(0) ? `${formatINR(lump)} at month ${lumpSumMonth}` : 'None',
        'Extra Monthly Payment': extraMonth.gt(0) ? `${formatINR(extraMonth)} / month` : 'None'
      },
      intermediateSteps: [
        {
          step: '1. Original Total Interest',
          description: 'Interest accrued without any prepayments',
          result: formatINR(originalInterest)
        },
        {
          step: '2. Revised Total Interest',
          description: 'Interest accrued after applying prepayment injections',
          result: formatINR(revisedInterest.round())
        },
        {
          step: '3. Net Interest Saved',
          description: 'Direct interest savings retained in borrower pocket',
          result: formatINR(interestSaved)
        },
        {
          step: '4. Tenure Reduction',
          description: 'Loan cleared early by',
          result: `${monthsSaved} months (~${yearsSaved} years ahead of schedule)`
        }
      ],
      rateSourceAndDate: {
        rateName: 'Prepayment Assessment Rate',
        rateValue: `${annualRatePct}%`,
        jurisdiction: 'Central',
        source: 'RBI Prepayment Guidelines (No foreclosure penalty for floating loans)',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Prepayment saves ${formatINR(interestSaved)} in interest and clears the loan ${monthsSaved} months (${yearsSaved} years) early.`,
      whatIsNotIncluded: [
        'Opportunity cost of capital (what return the lump sum could have earned if invested in index funds or debt instruments)',
        'Loss of Section 24(b) home loan interest deduction tax shield on reduced interest payments'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_prepayment',
      calculatorName: 'Prepayment & Debt Acceleration Engine',
      data: {
        originalLoan: P.toNumber(),
        originalEMI: baseEmi.toNumber(),
        originalTotalInterest: originalInterest.toNumber(),
        originalTenureMonths: totalMonths,
        revisedTotalInterest: revisedInterest.round().toNumber(),
        interestSaved: interestSaved.toNumber(),
        revisedTenureMonths: revisedMonths,
        monthsSaved,
        effectiveReductionYears: yearsSaved
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_prepayment',
      calculatorName: 'Prepayment & Debt Acceleration Engine',
      error: err.message
    };
  }
}

/**
 * 6. Tenure Comparison Calculator
 */
export function calculateTenureComparison(
  principalAmount: number,
  annualRatePct: number,
  tenuresYearsList: number[] = [10, 15, 20, 25, 30],
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<Array<{ tenureYears: number; monthlyEMI: number; totalInterest: number; totalPayment: number }>> {
  try {
    const P = validateFinancialInput('Principal', principalAmount, { min: 1000 });
    const R = validateFinancialInput('Annual Rate %', annualRatePct, { isRate: true, min: 0.1 });

    const rows = tenuresYearsList.map((tenureYr) => {
      const emiRes = calculateEMI(P.toNumber(), R.toNumber(), tenureYr, ratesTable);
      return {
        tenureYears: tenureYr,
        monthlyEMI: emiRes.data?.monthlyEMI || 0,
        totalInterest: emiRes.data?.totalInterest || 0,
        totalPayment: emiRes.data?.totalPayment || 0
      };
    });

    const working: CalculationWorking = {
      formulaInWords: 'Longer tenure reduces monthly EMI obligation but exponentially increases cumulative compound interest.',
      inputsAndAssumptions: {
        'Principal': formatINR(P),
        'Interest Rate': `${R.toString()}%`,
        'Tenures Analyzed': tenuresYearsList.join(', ') + ' years'
      },
      intermediateSteps: rows.map((r) => ({
        step: `${r.tenureYears} Years Tenure`,
        description: `EMI: ${formatINR(r.monthlyEMI)} | Total Interest: ${formatINR(r.totalInterest)}`,
        result: `Total Outflow: ${formatINR(r.totalPayment)}`
      })),
      rateSourceAndDate: {
        rateName: 'Benchmark Rate',
        rateValue: `${annualRatePct}%`,
        jurisdiction: 'Central',
        source: 'Mortgage Amortization Comparison Model',
        effectiveDate: '2025-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Comparison completed across ${tenuresYearsList.length} tenure scenarios.`,
      whatIsNotIncluded: ['Pre-EMI payments during construction phase', 'Processing fees']
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_tenure_comparison',
      calculatorName: 'Tenure Optimization & Trade-off Engine',
      data: rows,
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_tenure_comparison',
      calculatorName: 'Tenure Optimization & Trade-off Engine',
      error: err.message
    };
  }
}

/**
 * 7. Rental Yield Calculator
 * Gross Yield = (Annual Gross Rent / Total Cost) * 100
 * Net Yield = ((Annual Gross Rent - Annual Maintenance/Tax/Brokerage) / Total Cost) * 100
 */
export function calculateRentalYield(
  propertyCost: number,
  monthlyRent: number,
  annualExpenses: number = 0
): CalculationResult<RentalYieldResult> {
  try {
    const cost = validateFinancialInput('Property Cost', propertyCost, { min: 10000 });
    const rent = validateFinancialInput('Monthly Rent', monthlyRent, { min: 100 });
    const expenses = validateFinancialInput('Annual Expenses', annualExpenses, { allowZero: true });

    const annualGrossRent = rent.mul(12);
    const netAnnualRent = annualGrossRent.minus(expenses);

    // Yield % rounded to 2 decimal places
    const grossYield = annualGrossRent.div(cost).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const netYield = netAnnualRent.div(cost).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const paybackYears = netAnnualRent.gt(0)
      ? cost.div(netAnnualRent).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber()
      : 0;

    const working: CalculationWorking = {
      formulaInWords: 'Gross Yield = (Annual Rent ÷ Total Property Cost) × 100; Net Yield = [(Annual Rent - Annual Recurring Expenses) ÷ Total Property Cost] × 100',
      inputsAndAssumptions: {
        'All-inclusive Property Cost': formatINR(cost),
        'Monthly Rent': formatINR(rent),
        'Annual Maintenance / Property Tax / Vacancy Loss': formatINR(expenses)
      },
      intermediateSteps: [
        {
          step: '1. Annual Gross Rental Inflow',
          description: 'Monthly rent multiplied by 12 months',
          formula: `${rent.toString()} × 12`,
          result: formatINR(annualGrossRent)
        },
        {
          step: '2. Gross Rental Yield',
          description: 'Gross annual income divided by property cost',
          formula: `(${annualGrossRent.toString()} ÷ ${cost.toString()}) × 100`,
          result: `${grossYield.toString()}%`
        },
        {
          step: '3. Net Annual Operating Inflow',
          description: 'Gross rent minus operational outgoings',
          formula: `${annualGrossRent.toString()} - ${expenses.toString()}`,
          result: formatINR(netAnnualRent)
        },
        {
          step: '4. Net Rental Yield',
          description: 'Net return on invested capital',
          formula: `(${netAnnualRent.toString()} ÷ ${cost.toString()}) × 100`,
          result: `${netYield.toString()}%`
        }
      ],
      rateSourceAndDate: {
        rateName: 'Rental Yield Industry Benchmark',
        rateValue: '2.5% - 4.5% residential Indian metros',
        jurisdiction: 'Pan-India',
        source: 'PropTech Metros Rental Index',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Gross Rental Yield is ${grossYield.toString()}%. Net Rental Yield is ${netYield.toString()}%.`,
      whatIsNotIncluded: [
        'Income tax under "Income from House Property" (30% standard deduction under Sec 24(a) applies)',
        'Tenant vacancy intervals (typically 1 month every 2-3 years)',
        'Brokerage cost on leasing (usually 1 month rent per 11-month lease)'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_rental_yield',
      calculatorName: 'Rental Yield & Capital Payback Engine',
      data: {
        propertyCost: cost.toNumber(),
        monthlyRent: rent.toNumber(),
        annualGrossRent: annualGrossRent.round().toNumber(),
        annualExpenses: expenses.round().toNumber(),
        netAnnualRent: netAnnualRent.round().toNumber(),
        grossRentalYieldPct: grossYield.toNumber(),
        netRentalYieldPct: netYield.toNumber(),
        paybackYears
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_rental_yield',
      calculatorName: 'Rental Yield & Capital Payback Engine',
      error: err.message
    };
  }
}

/**
 * 8. ROI Scenarios Calculator (Conservative, Base, Optimistic)
 */
export function calculateROIScenarios(
  purchasePrice: number,
  holdingYears: number,
  baseAppreciationRatePct: number = 6.0,
  monthlyRent: number = 0,
  annualRentGrowthRatePct: number = 4.0
): CalculationResult<ROIScenario[]> {
  try {
    const P = validateFinancialInput('Purchase Price', purchasePrice, { min: 10000 });
    const yrs = validateFinancialInput('Holding Years', holdingYears, { isTenureYears: true });
    const baseApp = validateFinancialInput('Base Appreciation %', baseAppreciationRatePct, { isRate: true });
    const rentInit = validateFinancialInput('Monthly Rent', monthlyRent, { allowZero: true });
    const rentGrowth = validateFinancialInput('Rent Escalation %', annualRentGrowthRatePct, { allowZero: true, isRate: true });

    const configs: Array<{ name: 'Conservative' | 'Base' | 'Optimistic'; rateMod: number }> = [
      { name: 'Conservative', rateMod: -2.0 },
      { name: 'Base', rateMod: 0.0 },
      { name: 'Optimistic', rateMod: 3.0 }
    ];

    const scenarios: ROIScenario[] = configs.map((cfg) => {
      const appRate = Decimal.max(0, baseApp.plus(cfg.rateMod));
      const appFactor = appRate.div(100).plus(1).pow(yrs.toNumber());
      const futureVal = P.mul(appFactor).round();
      const capGain = futureVal.minus(P);

      // Rent compounding over holding years
      let totalRent = new Decimal(0);
      let currMonthlyRent = rentInit;
      for (let y = 1; y <= yrs.toNumber(); y++) {
        totalRent = totalRent.plus(currMonthlyRent.mul(12));
        currMonthlyRent = currMonthlyRent.mul(rentGrowth.div(100).plus(1));
      }
      totalRent = totalRent.round();

      const totalReturn = capGain.plus(totalRent);
      const roiPct = totalReturn.div(P).mul(100).toDecimalPlaces(2).toNumber();

      // CAGR = ((Final Wealth / Initial Investment)^(1/years) - 1) * 100
      const finalWealth = P.plus(totalReturn);
      const cagr = finalWealth.div(P).pow(new Decimal(1).div(yrs)).minus(1).mul(100).toDecimalPlaces(2).toNumber();

      return {
        scenarioName: cfg.name,
        appreciationRatePct: appRate.toNumber(),
        futurePropertyValue: futureVal.toNumber(),
        capitalAppreciationGain: capGain.toNumber(),
        totalRentCollected: totalRent.toNumber(),
        totalNetReturn: totalReturn.toNumber(),
        roiPct,
        cagrPct: cagr
      };
    });

    const working: CalculationWorking = {
      formulaInWords: 'Future Property Value = Purchase Price × (1 + Appreciation Rate)^HoldingYears; Total Net Return = Capital Appreciation + Cumulative Rent Collected; CAGR = [(Final Wealth / Initial Capital)^(1/Years) - 1] × 100',
      inputsAndAssumptions: {
        'Initial Purchase Price': formatINR(P),
        'Holding Duration': `${yrs.toString()} years`,
        'Base Annual Capital Appreciation': `${baseApp.toString()}%`,
        'Starting Monthly Rent': formatINR(rentInit),
        'Annual Rent Escalation': `${rentGrowth.toString()}%`
      },
      intermediateSteps: scenarios.map((s) => ({
        step: `${s.scenarioName} Scenario (${s.appreciationRatePct}% p.a. growth)`,
        description: `Future Value: ${formatINR(s.futurePropertyValue)} | Total Rent: ${formatINR(s.totalRentCollected)}`,
        result: `Total Net Return: ${formatINR(s.totalNetReturn)} (CAGR: ${s.cagrPct}%)`
      })),
      rateSourceAndDate: {
        rateName: 'Real Estate Multi-Scenario Matrix',
        rateValue: `${baseApp}% base benchmark`,
        jurisdiction: 'National',
        source: 'NHB Residex Historical Appreciation Index',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Analyzed 3 distinct scenarios: Conservative (CAGR: ${scenarios[0].cagrPct}%), Base (CAGR: ${scenarios[1].cagrPct}%), and Optimistic (CAGR: ${scenarios[2].cagrPct}%).`,
      whatIsNotIncluded: [
        'Capital gains tax on eventual liquidation',
        'Stamp duty paid during initial purchase',
        'Major structural repair or society renovation sinking funds'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_roi_scenarios',
      calculatorName: 'Multi-Scenario Investment ROI & CAGR Engine',
      data: scenarios,
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_roi_scenarios',
      calculatorName: 'Multi-Scenario Investment ROI & CAGR Engine',
      error: err.message
    };
  }
}

/**
 * 9. Buy vs Rent Decision Calculator
 */
export function calculateBuyVsRent(
  propertyCost: number,
  downPaymentPct: number = 20.0,
  loanRatePct: number = 8.5,
  loanTenureYears: number = 20,
  currentMonthlyRent: number = 25000,
  rentInflationPct: number = 5.0,
  propertyAppreciationPct: number = 6.0,
  investmentReturnPct: number = 10.0, // Alternative equity/mutual fund returns for renter
  stampDutyPct: number = 6.0,
  registrationFee: number = 30000,
  annualMaintenancePct: number = 1.0,
  annualPropertyTax: number = 15000,
  sellingCostPct: number = 2.0,
  horizonYears: number = 15
): CalculationResult<BuyVsRentResult> {
  try {
    const P = validateFinancialInput('Property Cost', propertyCost, { min: 100000 });
    const dpPct = validateFinancialInput('Down Payment %', downPaymentPct, { isRate: true, min: 10, max: 90 });
    const lRate = validateFinancialInput('Loan Rate %', loanRatePct, { isRate: true });
    const lTenure = validateFinancialInput('Loan Tenure Years', loanTenureYears, { isTenureYears: true });
    const rent0 = validateFinancialInput('Current Monthly Rent', currentMonthlyRent, { min: 1000 });
    const rInf = validateFinancialInput('Rent Inflation %', rentInflationPct, { allowZero: true, isRate: true });
    const pApp = validateFinancialInput('Property Appreciation %', propertyAppreciationPct, { allowZero: true, isRate: true });
    const invRet = validateFinancialInput('Alternative Investment Return %', investmentReturnPct, { isRate: true });
    const sdRate = validateFinancialInput('Stamp Duty %', stampDutyPct, { allowZero: true, isRate: true });
    const regFee = validateFinancialInput('Registration Fee', registrationFee, { allowZero: true });
    const maintPct = validateFinancialInput('Maintenance %', annualMaintenancePct, { allowZero: true, isRate: true });
    const propTax = validateFinancialInput('Property Tax', annualPropertyTax, { allowZero: true });
    const sellPct = validateFinancialInput('Selling Cost %', sellingCostPct, { allowZero: true, isRate: true });
    const horizon = validateFinancialInput('Horizon Years', horizonYears, { isTenureYears: true });

    // Buyer initial upfront outgoings
    const downPayment = P.mul(dpPct).div(100);
    const stampDuty = P.mul(sdRate).div(100);
    const initialBuyerOutflow = downPayment.plus(stampDuty).plus(regFee);

    // Loan amount
    const loanAmount = P.minus(downPayment);
    const emiRes = calculateEMI(loanAmount.toNumber(), lRate.toNumber(), lTenure.toNumber());
    const monthlyEmi = new Decimal(emiRes.data?.monthlyEMI || 0);

    // Amortization simulation to compute loan balance after horizon
    const amortRes = calculateAmortizationSchedule(loanAmount.toNumber(), lRate.toNumber(), lTenure.toNumber());
    const loanSchedule = amortRes.data?.schedule || [];

    // Horizon simulation
    let cumulativeBuyOutflow = initialBuyerOutflow;
    let cumulativeRentOutflow = new Decimal(0);
    // Renter invests down payment + stamp duty capital upfront
    let renterPortfolio = initialBuyerOutflow;

    let currMonthlyRent = rent0;
    let currentPropVal = P;
    let breakEvenYear: number | null = null;

    const cashflowYearly: Array<{
      year: number;
      buyOutflow: number;
      rentOutflow: number;
      propertyValue: number;
      rentPortfolio: number;
    }> = [];

    const hYears = horizon.toNumber();
    for (let y = 1; y <= hYears; y++) {
      // Annual buy outflows: 12 EMIs (if within loan tenure) + maintenance + property tax
      const emiThisYear = y <= lTenure.toNumber() ? monthlyEmi.mul(12) : new Decimal(0);
      const maintThisYear = currentPropVal.mul(maintPct).div(100);
      const buyYearOutflow = emiThisYear.plus(maintThisYear).plus(propTax);
      cumulativeBuyOutflow = cumulativeBuyOutflow.plus(buyYearOutflow);

      // Annual rent outflow
      const rentYearOutflow = currMonthlyRent.mul(12);
      cumulativeRentOutflow = cumulativeRentOutflow.plus(rentYearOutflow);

      // Property value appreciates
      currentPropVal = currentPropVal.mul(pApp.div(100).plus(1));

      // Renter portfolio compounding
      // Renter grows previous balance by investment return rate
      renterPortfolio = renterPortfolio.mul(invRet.div(100).plus(1));
      // If buyer's yearly outflow was higher than renter's outflow, renter invests the difference!
      const buyerMonthlyExcess = buyYearOutflow.minus(rentYearOutflow);
      if (buyerMonthlyExcess.gt(0)) {
        renterPortfolio = renterPortfolio.plus(buyerMonthlyExcess);
      }

      // Check net wealth at end of year y
      // Buyer net wealth = Property Value - Remaining Loan Balance - Selling Brokerage
      const monthIdx = Math.min(y * 12, loanSchedule.length) - 1;
      const outstandingLoan = monthIdx >= 0 && loanSchedule[monthIdx] ? new Decimal(loanSchedule[monthIdx].closingBalance) : new Decimal(0);
      const buyerNetWealth = currentPropVal.mul(new Decimal(1).minus(sellPct.div(100))).minus(outstandingLoan);
      const renterNetWealth = renterPortfolio;

      if (buyerNetWealth.gte(renterNetWealth) && breakEvenYear === null) {
        breakEvenYear = y;
      }

      cashflowYearly.push({
        year: y,
        buyOutflow: buyYearOutflow.round().toNumber(),
        rentOutflow: rentYearOutflow.round().toNumber(),
        propertyValue: currentPropVal.round().toNumber(),
        rentPortfolio: renterPortfolio.round().toNumber()
      });

      // Rent escalates for next year
      currMonthlyRent = currMonthlyRent.mul(rInf.div(100).plus(1));
    }

    // Final wealth evaluation at horizon
    const finalMonthIdx = Math.min(hYears * 12, loanSchedule.length) - 1;
    const finalOutstandingLoan = finalMonthIdx >= 0 && loanSchedule[finalMonthIdx] ? new Decimal(loanSchedule[finalMonthIdx].closingBalance) : new Decimal(0);
    const finalBuyNetWealth = currentPropVal.mul(new Decimal(1).minus(sellPct.div(100))).minus(finalOutstandingLoan).round();
    const finalRentNetWealth = renterPortfolio.round();

    const wealthDiff = finalBuyNetWealth.minus(finalRentNetWealth).abs().toNumber();
    let recommendation: 'BUYING_FAVORABLE' | 'RENTING_FAVORABLE' | 'NEUTRAL' = 'NEUTRAL';
    if (finalBuyNetWealth.gt(finalRentNetWealth.mul(1.05))) {
      recommendation = 'BUYING_FAVORABLE';
    } else if (finalRentNetWealth.gt(finalBuyNetWealth.mul(1.05))) {
      recommendation = 'RENTING_FAVORABLE';
    }

    const working: CalculationWorking = {
      formulaInWords: 'Buyer Wealth = Future Property Value - Outstanding Mortgage - Selling Costs; Renter Wealth = Compounded Opportunity Portfolio of Down Payment + Stamp Duty + Monthly Cashflow Savings at Equity Return Rate',
      inputsAndAssumptions: {
        'Property Initial Value': formatINR(P),
        'Down Payment': `${formatINR(downPayment)} (${dpPct.toString()}%)`,
        'Stamp Duty & Registration': `${formatINR(stampDuty.plus(regFee))}`,
        'Mortgage Interest Rate': `${lRate.toString()}% p.a.`,
        'Starting Monthly Rent': formatINR(rent0),
        'Rent Inflation': `${rInf.toString()}% p.a.`,
        'Property Appreciation': `${pApp.toString()}% p.a.`,
        'Alternative Investment Return': `${invRet.toString()}% p.a.`,
        'Analysis Horizon': `${horizon.toString()} years`
      },
      intermediateSteps: [
        {
          step: '1. Upfront Buyer Outflow',
          description: 'Down payment + Stamp Duty + Registration Fee',
          result: formatINR(initialBuyerOutflow)
        },
        {
          step: '2. Buyer Net Wealth at Horizon',
          description: `Property value after ${hYears} years minus loan and selling costs`,
          result: formatINR(finalBuyNetWealth)
        },
        {
          step: '3. Renter Portfolio Wealth at Horizon',
          description: `Compounded initial seed + reinvested monthly savings at ${invRet.toString()}% p.a.`,
          result: formatINR(finalRentNetWealth)
        },
        {
          step: '4. Break-even Timeline',
          description: 'Year at which buying wealth overtakes renting portfolio',
          result: breakEvenYear ? `Year ${breakEvenYear}` : 'Does not break even within evaluated horizon'
        }
      ],
      rateSourceAndDate: {
        rateName: 'Comprehensive Buy vs Rent Parameters',
        rateValue: 'Multi-factor statutory + market matrix',
        jurisdiction: 'Pan-India',
        source: 'Real Estate Capital Allocation Framework',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `At year ${hYears}, Buyer net wealth is ${formatINR(finalBuyNetWealth)} vs Renter portfolio wealth of ${formatINR(finalRentNetWealth)}. Outcome: ${recommendation === 'BUYING_FAVORABLE' ? 'Buying is financially favorable' : recommendation === 'RENTING_FAVORABLE' ? 'Renting and investing the surplus is financially favorable' : 'Both paths offer equivalent financial parity'}.`,
      whatIsNotIncluded: [
        'Emotional security of home ownership vs flexibility to relocate without selling friction',
        'Tax deductions under 80C (principal) and 24(b) (interest)',
        'HRA (House Rent Allowance) tax exemption claimed by salaried tenants'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_buy_vs_rent',
      calculatorName: 'Buy vs Rent Capital Allocation Engine',
      data: {
        horizonYears: hYears,
        buyTotalOutflow: cumulativeBuyOutflow.round().toNumber(),
        buyEstimatedPropertyValue: currentPropVal.round().toNumber(),
        buyNetWealth: finalBuyNetWealth.toNumber(),
        rentTotalOutflow: cumulativeRentOutflow.round().toNumber(),
        rentInvestmentPortfolioValue: finalRentNetWealth.toNumber(),
        rentNetWealth: finalRentNetWealth.toNumber(),
        recommendation,
        wealthDifference: wealthDiff,
        breakEvenYear,
        cashflowYearly
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_buy_vs_rent',
      calculatorName: 'Buy vs Rent Capital Allocation Engine',
      error: err.message
    };
  }
}

/**
 * 10. Brokerage and GST on Commission Calculator
 */
export function calculateBrokerageAndGST(
  transactionValue: number,
  brokerageRatePct: number = 2.0,
  clientType: 'individual' | 'corporate_firm' = 'individual',
  isInterstate: boolean = false,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<BrokerageGSTResult> {
  try {
    const val = validateFinancialInput('Transaction Value', transactionValue, { min: 1000 });
    const bRate = validateFinancialInput('Brokerage Rate %', brokerageRatePct, { isRate: true, min: 0.1 });

    const gstRateItem = ratesTable['gst_brokerage_service'];
    const tdsRateItem = ratesTable['tds_section_194h'];

    const gstPct = new Decimal(gstRateItem?.value ?? 18.0);
    const tdsPct = new Decimal(tdsRateItem?.value ?? 5.0);

    const grossBrokerage = val.mul(bRate).div(100).round();
    const totalGst = grossBrokerage.mul(gstPct).div(100).round();

    let cgst = new Decimal(0);
    let sgst = new Decimal(0);
    let igst = new Decimal(0);

    if (isInterstate) {
      igst = totalGst;
    } else {
      cgst = totalGst.div(2).round();
      sgst = totalGst.minus(cgst);
    }

    const invoiceTotal = grossBrokerage.plus(totalGst);

    // TDS Section 194-H applies if client is corporate/business entity or audited individual and amount > ₹15,000
    let tdsApplicable = false;
    let tdsDeducted = new Decimal(0);

    if (clientType === 'corporate_firm' && grossBrokerage.gte(15000)) {
      tdsApplicable = true;
      // TDS is deducted ONLY on base brokerage fee, NOT on GST component (CBDT Circular 23/2017)
      tdsDeducted = grossBrokerage.mul(tdsPct).div(100).round();
    }

    const netPayable = invoiceTotal.minus(tdsDeducted);

    const working: CalculationWorking = {
      formulaInWords: 'Gross Brokerage = Transaction Value × Brokerage Rate %; GST (18%) = Gross Brokerage × 18%; Invoice Total = Gross Brokerage + GST; TDS u/s 194-H (5%) = Gross Brokerage × 5% (deducted exclusively from base fee, not GST); Net Receipt = Invoice Total - TDS',
      inputsAndAssumptions: {
        'Property Transaction Value': formatINR(val),
        'Agreed Brokerage Rate': `${bRate.toString()}%`,
        'GST SAC Code': 'SAC 997222 (Real Estate Agent Services)',
        'Client Category': clientType === 'corporate_firm' ? 'Corporate / Firm (Liable for TDS)' : 'Individual Buyer / Seller',
        'Place of Supply': isInterstate ? 'Inter-state (IGST 18%)' : 'Intra-state (CGST 9% + SGST 9%)'
      },
      intermediateSteps: [
        {
          step: '1. Gross Brokerage Commission',
          description: `${bRate.toString()}% of property consideration value`,
          formula: `${val.toString()} × ${bRate.toString()}%`,
          result: formatINR(grossBrokerage)
        },
        {
          step: '2. Statutory GST (18%)',
          description: isInterstate ? '18% IGST' : '9% CGST + 9% SGST',
          formula: `${grossBrokerage.toString()} × 18%`,
          result: formatINR(totalGst)
        },
        {
          step: '3. Total Tax Invoice Amount',
          description: 'Gross Commission + 18% GST',
          formula: `${grossBrokerage.toString()} + ${totalGst.toString()}`,
          result: formatINR(invoiceTotal)
        },
        {
          step: '4. Section 194-H TDS Withholding',
          description: tdsApplicable
            ? `5% withholding tax by corporate client on base commission (excluding GST per CBDT circular 23/2017)`
            : 'No TDS applicable (Individual client or under ₹15,000 threshold)',
          result: formatINR(tdsDeducted)
        },
        {
          step: '5. Net Amount Banked by Broker',
          description: 'Invoice Total minus Tax Deducted at Source',
          formula: `${invoiceTotal.toString()} - ${tdsDeducted.toString()}`,
          result: formatINR(netPayable)
        }
      ],
      rateSourceAndDate: {
        rateName: 'GST on Brokerage (SAC 997222) & TDS Sec 194-H',
        rateValue: '18% GST, 5% TDS',
        jurisdiction: 'Central',
        source: 'CBIC Real Estate Circulars & CBDT Sec 194-H',
        effectiveDate: '2017-07-01',
        lastUpdatedDate: gstRateItem?.lastUpdatedDate || SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Gross brokerage is ${formatINR(grossBrokerage)}. With 18% GST (${formatINR(totalGst)}), total invoice is ${formatINR(invoiceTotal)}. ${tdsApplicable ? `After ₹${tdsDeducted.toString()} TDS u/s 194-H, net received is ${formatINR(netPayable)}.` : `Full invoice amount of ${formatINR(invoiceTotal)} is receivable.`}`,
      whatIsNotIncluded: [
        'GST threshold exemption: Businesses with aggregate turnover under ₹20 Lakhs (₹10 Lakhs in Special Category States) are exempt from GST registration',
        'TDS Form 16A credit issuance timeline by client (quarterly)',
        'RERA Agent registration renewal fees'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_brokerage_gst',
      calculatorName: 'Brokerage Commission, GST & TDS Engine',
      data: {
        transactionValue: val.toNumber(),
        brokerageRatePct: bRate.toNumber(),
        grossBrokerage: grossBrokerage.toNumber(),
        gstRatePct: gstPct.toNumber(),
        cgstAmount: cgst.toNumber(),
        sgstAmount: sgst.toNumber(),
        igstAmount: igst.toNumber(),
        totalGst: totalGst.toNumber(),
        invoiceTotalWithGST: invoiceTotal.toNumber(),
        tdsApplicable,
        tdsSection: 'Section 194-H',
        tdsRatePct: tdsPct.toNumber(),
        tdsDeducted: tdsDeducted.toNumber(),
        netPayableToAgent: netPayable.toNumber()
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_brokerage_gst',
      calculatorName: 'Brokerage Commission, GST & TDS Engine',
      error: err.message
    };
  }
}

/**
 * 11. Stamp Duty and Registration Calculator (Slabs based)
 * Supports Maharashtra, Karnataka, Delhi, etc.
 */
export function calculateStampDutyAndRegistration(
  propertyValue: number,
  state: string = 'Maharashtra',
  gender: 'male' | 'female' | 'joint' = 'male',
  locationType: 'urban' | 'rural' | 'metro' = 'metro',
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<StampDutyResult> {
  try {
    const val = validateFinancialInput('Property Value', propertyValue, { min: 1000 });
    const normalizedState = state.trim().toLowerCase();

    let stampDutyPct = new Decimal(5.0);
    let cessSurchargePct = new Decimal(0);
    let regFeePct = new Decimal(1.0);
    let regFeeAmount = new Decimal(0);
    let appliedSlabs: string[] = [];
    let regCap: number | undefined = undefined;

    if (normalizedState.includes('maha')) {
      // Maharashtra: 5% base + 1% Metro Cess (in Municipal Corp / Metro areas).
      // Reg Fee: 1% capped at ₹30,000 for properties > ₹30L.
      stampDutyPct = new Decimal(5.0);
      if (gender === 'female') {
        // Maharashtra 1% rebate on residential units for women
        stampDutyPct = new Decimal(4.0);
        appliedSlabs.push('1% Concession for Female purchaser under Maharashtra Stamp Act');
      }
      if (locationType === 'metro' || locationType === 'urban') {
        cessSurchargePct = new Decimal(1.0); // 1% Metro Cess / LBT
        appliedSlabs.push('1% Metro Cess / Transport Surcharge (Urban Local Body)');
      }

      if (val.gt(3000000)) {
        regFeeAmount = new Decimal(30000);
        regCap = 30000;
        appliedSlabs.push('Registration Fee: Capped at maximum statutory ceiling of ₹30,000 (Value > ₹30,00,000)');
      } else {
        regFeeAmount = val.mul(1).div(100).round();
        appliedSlabs.push('Registration Fee: 1% uncapped (Value <= ₹30,00,000)');
      }
    } else if (normalizedState.includes('karn') || normalizedState.includes('bengaluru') || normalizedState.includes('bangalore')) {
      // Karnataka: Slabs:
      // <= 20L: 2%
      // 20L - 45L: 3%
      // > 45L: 5%
      // Surcharge/Cess: 10% on stamp duty (urban) or 2% (rural)
      // Reg fee: 2%
      if (val.lte(2000000)) {
        stampDutyPct = new Decimal(2.0);
        appliedSlabs.push('Karnataka Tier 1: Up to ₹20 Lakhs (2% Stamp Duty)');
      } else if (val.lte(4500000)) {
        stampDutyPct = new Decimal(3.0);
        appliedSlabs.push('Karnataka Tier 2: ₹20 Lakhs to ₹45 Lakhs (3% Stamp Duty)');
      } else {
        stampDutyPct = new Decimal(5.0);
        appliedSlabs.push('Karnataka Tier 3: Above ₹45 Lakhs (5% Stamp Duty)');
      }

      // 10% cess on stamp duty amount
      cessSurchargePct = stampDutyPct.mul(0.10);
      appliedSlabs.push('10% Infrastructure & Urban Development Cess calculated on Stamp Duty amount');

      regFeePct = new Decimal(2.0);
      regFeeAmount = val.mul(2).div(100).round();
      appliedSlabs.push('Registration Fee: 2% of total property value');
    } else if (normalizedState.includes('delhi')) {
      // Delhi: Male 6%, Female 4%, Joint 5%
      if (gender === 'female') {
        stampDutyPct = new Decimal(4.0);
        appliedSlabs.push('Delhi Female Buyer Concession: 4% Stamp Duty');
      } else if (gender === 'joint') {
        stampDutyPct = new Decimal(5.0);
        appliedSlabs.push('Delhi Joint Ownership (Male + Female): 5% Stamp Duty');
      } else {
        stampDutyPct = new Decimal(6.0);
        appliedSlabs.push('Delhi Male Buyer: 6% Stamp Duty');
      }
      regFeePct = new Decimal(1.0);
      regFeeAmount = val.mul(1).div(100).round();
      appliedSlabs.push('Registration Fee: Flat 1% of total property value');
    } else {
      // General National Default: 6% SD + 1% Reg
      stampDutyPct = new Decimal(6.0);
      regFeePct = new Decimal(1.0);
      regFeeAmount = val.mul(1).div(100).round();
      appliedSlabs.push(`Standard Rate for ${state}: 6% Stamp Duty + 1% Registration`);
    }

    const stampDutyAmount = val.mul(stampDutyPct).div(100).round();
    const cessAmount = val.mul(cessSurchargePct).div(100).round();
    const totalGovernmentCharges = stampDutyAmount.plus(cessAmount).plus(regFeeAmount);
    const effectivePct = totalGovernmentCharges.div(val).mul(100).toDecimalPlaces(2).toNumber();

    const working: CalculationWorking = {
      formulaInWords: 'Base Stamp Duty = Property Value × State Slab Rate %; Surcharge / Cess = Property Value × Cess %; Registration Fee = Statutory Fixed Cap or 1-2% of value; Total Government Cost = Base Stamp Duty + Cess + Registration Fee',
      inputsAndAssumptions: {
        'Property Market / Agreement Value': formatINR(val),
        'Jurisdiction / State': state,
        'Buyer Gender': gender.toUpperCase(),
        'Location Classification': locationType.toUpperCase()
      },
      intermediateSteps: [
        {
          step: '1. Base Stamp Duty',
          description: `${stampDutyPct.toString()}% according to state statutory schedule`,
          formula: `${val.toString()} × ${stampDutyPct.toString()}%`,
          result: formatINR(stampDutyAmount)
        },
        {
          step: '2. Surcharge / Infrastructure Cess',
          description: cessSurchargePct.gt(0) ? `${cessSurchargePct.toString()}% Local / Metro transport cess` : 'Nil',
          result: formatINR(cessAmount)
        },
        {
          step: '3. Registration Fee',
          description: regCap ? `Fixed statutory ceiling cap at ${formatINR(regCap)}` : `${regFeePct.toString()}% of value`,
          result: formatINR(regFeeAmount)
        },
        {
          step: '4. Aggregate Government Registration Cost',
          description: 'Sum of stamp duty, cess, and registration fees',
          result: formatINR(totalGovernmentCharges)
        }
      ],
      rateSourceAndDate: {
        rateName: `${state} Stamp Duty & Registration Act`,
        rateValue: `${stampDutyPct}% Base SD`,
        jurisdiction: state,
        source: 'State Inspector General of Registration (IGR) Statutory Schedule',
        effectiveDate: '2024-04-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `In ${state}, total government registration charges are ${formatINR(totalGovernmentCharges)} (effective ${effectivePct}% of property value).`,
      whatIsNotIncluded: [
        'Document writer / advocate drafting and legal due-diligence verification charges',
        'Khata transfer or 7/12 mutation fee with local civic revenue authority',
        'Society transfer fee and entrance charges (capped at ₹25,000 under Maharashtra Co-operative Societies Bye-law No. 38)'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_stamp_duty',
      calculatorName: 'State Stamp Duty & Registration Slab Engine',
      data: {
        propertyValue: val.toNumber(),
        state,
        gender,
        locationType,
        stampDutyPct: stampDutyPct.toNumber(),
        stampDutyAmount: stampDutyAmount.toNumber(),
        cessSurchargePct: cessSurchargePct.toNumber(),
        cessSurchargeAmount: cessAmount.toNumber(),
        registrationFeePct: regFeePct.toNumber(),
        registrationFeeAmount: regFeeAmount.toNumber(),
        registrationCap: regCap,
        totalGovernmentCharges: totalGovernmentCharges.toNumber(),
        effectivePercentage: effectivePct,
        appliedSlabs
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_stamp_duty',
      calculatorName: 'State Stamp Duty & Registration Slab Engine',
      error: err.message
    };
  }
}

/**
 * 12. Capital Gains Tax Estimator (LTCG / STCG on Real Estate)
 * Supports Budget 2024 revised regime: 12.5% without indexation vs 20% with indexation choice for pre-2024 assets.
 */
export function calculateCapitalGains(
  saleConsideration: number,
  transferExpenses: number = 0,
  acquisitionCost: number = 0,
  acquisitionYear: string = '2015-16',
  improvementCosts: number = 0,
  holdingMonths: number = 36,
  section54Reinvestment: number = 0,
  section54ECBonds: number = 0,
  ratesTable: Record<string, RateItem> = INITIAL_RATES_TABLE
): CalculationResult<CapitalGainsResult> {
  try {
    const sale = validateFinancialInput('Sale Consideration', saleConsideration, { min: 1000 });
    const expenses = validateFinancialInput('Transfer Expenses (Brokerage, Legal)', transferExpenses, { allowZero: true });
    const acqCost = validateFinancialInput('Acquisition Cost', acquisitionCost, { min: 1000 });
    const improve = validateFinancialInput('Improvement Costs', improvementCosts, { allowZero: true });
    const sec54 = validateFinancialInput('Section 54 Residential Investment', section54Reinvestment, { allowZero: true });
    const sec54EC = validateFinancialInput('Section 54EC Specified Bonds', section54ECBonds, { allowZero: true, max: 5000000 });

    const netSale = sale.minus(expenses);
    const isLTCG = holdingMonths > 24; // Real estate holding > 24 months is LTCG

    let indexedCost = acqCost;
    const ciiSale = CII_TABLE['2026-27'] || 392;
    const ciiAcq = CII_TABLE[acquisitionYear] || 254;

    if (isLTCG && ciiAcq > 0) {
      // Indexed Cost = Cost * (CII Sale / CII Acquisition)
      indexedCost = acqCost.mul(ciiSale).div(ciiAcq).round();
    }

    let grossGain = new Decimal(0);
    let taxRatePct = new Decimal(20.0);
    let regimeApplied: 'Budget2024_12_5_WithoutIndexation' | 'Grandfathered_20_WithIndexation' | 'STCG_Slab' = 'Budget2024_12_5_WithoutIndexation';

    if (!isLTCG) {
      // STCG: Added to total income, taxed at normal slab (assumed 30% peak slab for real estate investors)
      regimeApplied = 'STCG_Slab';
      grossGain = netSale.minus(acqCost).minus(improve);
      taxRatePct = new Decimal(30.0);
    } else {
      // LTCG under Budget 2024 amendment:
      // Taxpayer can evaluate:
      // Option A: 12.5% without indexation on (Net Sale - Actual Cost - Improvement)
      // Option B: 20% with indexation on (Net Sale - Indexed Cost - Improvement) for properties acquired before 23 July 2024
      const gainWithoutIndex = netSale.minus(acqCost).minus(improve);
      const taxOptionA = gainWithoutIndex.gt(0) ? gainWithoutIndex.mul(0.125) : new Decimal(0);

      const gainWithIndex = netSale.minus(indexedCost).minus(improve);
      const taxOptionB = gainWithIndex.gt(0) ? gainWithIndex.mul(0.20) : new Decimal(0);

      if (taxOptionA.lte(taxOptionB)) {
        regimeApplied = 'Budget2024_12_5_WithoutIndexation';
        grossGain = Decimal.max(0, gainWithoutIndex);
        taxRatePct = new Decimal(12.5);
      } else {
        regimeApplied = 'Grandfathered_20_WithIndexation';
        grossGain = Decimal.max(0, gainWithIndex);
        taxRatePct = new Decimal(20.0);
      }
    }

    // Exemptions: Section 54 (Residential house purchase) & Section 54EC (NHAI/REC bonds capped at ₹50 Lakhs)
    let totalDeductions = new Decimal(0);
    if (isLTCG) {
      totalDeductions = Decimal.min(grossGain, sec54.plus(sec54EC));
    }

    const taxableGain = Decimal.max(0, grossGain.minus(totalDeductions));
    const cessRate = new Decimal(4.0); // 4% Health & Education Cess
    const baseTax = taxableGain.mul(taxRatePct).div(100);
    const cessAmount = baseTax.mul(cessRate).div(100);
    const estimatedTax = baseTax.plus(cessAmount).round();

    const working: CalculationWorking = {
      formulaInWords: 'Net Sale = Gross Sale - Transfer Expenses; Gross Capital Gain = Net Sale - Acquisition Cost (with/without indexation); Taxable Gain = Gross Gain - Section 54/54EC Exemptions; Tax Payable = Taxable Gain × Tax Rate + 4% Health & Education Cess',
      inputsAndAssumptions: {
        'Gross Sale Consideration': formatINR(sale),
        'Transfer Expenses (Brokerage, Legal)': formatINR(expenses),
        'Original Acquisition Cost': formatINR(acqCost),
        'Acquisition Financial Year': acquisitionYear,
        'Holding Period': `${holdingMonths} months (${isLTCG ? 'Long-Term Capital Asset (>24m)' : 'Short-Term Capital Asset (<=24m)'})`,
        'Section 54 Reinvestment': formatINR(sec54),
        'Section 54EC Bonds Investment': formatINR(sec54EC)
      },
      intermediateSteps: [
        {
          step: '1. Net Sale Consideration',
          description: 'Gross sale value minus allowable transfer costs',
          result: formatINR(netSale)
        },
        {
          step: '2. Cost Basis Computation',
          description: regimeApplied === 'Grandfathered_20_WithIndexation'
            ? `Indexed Cost of Acquisition (${formatINR(acqCost)} × ${ciiSale} ÷ ${ciiAcq}) = ${formatINR(indexedCost)}`
            : `Actual Historical Acquisition Cost: ${formatINR(acqCost)}`,
          result: formatINR(regimeApplied === 'Grandfathered_20_WithIndexation' ? indexedCost : acqCost)
        },
        {
          step: '3. Gross Capital Gain',
          description: `Calculated under optimal regime (${regimeApplied})`,
          result: formatINR(grossGain)
        },
        {
          step: '4. Statutory Exemptions (Sec 54 & 54EC)',
          description: 'Deductions for residential reinvestment or capital gains bonds',
          result: formatINR(totalDeductions)
        },
        {
          step: '5. Net Taxable Capital Gain & Tax with Cess',
          description: `${taxRatePct.toString()}% tax rate + 4% Health & Education cess`,
          result: formatINR(estimatedTax)
        }
      ],
      rateSourceAndDate: {
        rateName: 'Capital Gains Tax Regime (Finance Act 2024 / Sec 112)',
        rateValue: `${taxRatePct}% tax + 4% Cess`,
        jurisdiction: 'Central',
        source: 'Income Tax Department, Govt of India',
        effectiveDate: '2024-07-23',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Gross capital gain is ${formatINR(grossGain)}. After exemptions (${formatINR(totalDeductions)}), taxable gain is ${formatINR(taxableGain)}, with estimated tax payable of ${formatINR(estimatedTax)}.`,
      whatIsNotIncluded: [
        'Applicable Surcharge on high net-worth individuals (10% for income > ₹50L, 15% for > ₹1 Cr, 25% for > ₹2 Cr)',
        'Deposit in Capital Gains Account Scheme (CGAS) before income tax filing due date (July 31)',
        'Three-year lock-in period for property purchased under Section 54'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_capital_gains',
      calculatorName: 'Real Estate Capital Gains & Tax Shield Engine',
      data: {
        saleConsideration: sale.toNumber(),
        transferExpenses: expenses.toNumber(),
        netSaleConsideration: netSale.toNumber(),
        acquisitionCost: acqCost.toNumber(),
        acquisitionYear,
        indexedCostOfAcquisition: indexedCost.toNumber(),
        improvementCostTotal: improve.toNumber(),
        isLTCG,
        holdingMonths,
        grossCapitalGain: grossGain.round().toNumber(),
        section54Deduction: Decimal.min(grossGain, sec54).round().toNumber(),
        section54ECDeduction: Decimal.min(grossGain.minus(sec54), sec54EC).round().toNumber(),
        taxableCapitalGain: taxableGain.round().toNumber(),
        taxRatePct: taxRatePct.toNumber(),
        cessPct: cessRate.toNumber(),
        estimatedTaxPayable: estimatedTax.toNumber(),
        regimeApplied
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_capital_gains',
      calculatorName: 'Real Estate Capital Gains & Tax Shield Engine',
      error: err.message
    };
  }
}

/**
 * 13. Brokerage-Business Startup Cost and Monthly Cash-Flow Planner
 */
export function calculateStartupCostAndCashflow(
  officeRentPerMonth: number = 35000,
  depositMonths: number = 6,
  setupFitoutCost: number = 250000,
  licensingRERAFees: number = 25000,
  portalSubscriptionsPerMonth: number = 20000, // MagicBricks, 99acres, Housing.com
  teamSalariesPerMonth: number = 80000, // 2 telecallers + 1 relationship manager
  marketingBudgetPerMonth: number = 30000, // Meta / Google ads
  contingencyMonths: number = 6,
  expectedDealsPerMonth: number = 1.5,
  avgDealValue: number = 7500000, // ₹75 Lakhs average apartment deal
  avgBrokeragePct: number = 2.0 // 2% commission from seller/developer
): CalculationResult<StartupCashflowResult> {
  try {
    const rent = validateFinancialInput('Office Rent / Month', officeRentPerMonth, { allowZero: true });
    const depMonths = validateFinancialInput('Security Deposit Months', depositMonths, { allowZero: true, max: 24 });
    const fitout = validateFinancialInput('Setup & Fitout Cost', setupFitoutCost, { allowZero: true });
    const rera = validateFinancialInput('RERA & Licensing Fees', licensingRERAFees, { allowZero: true });
    const portals = validateFinancialInput('Portal Subscriptions / Month', portalSubscriptionsPerMonth, { allowZero: true });
    const salaries = validateFinancialInput('Staff Salaries / Month', teamSalariesPerMonth, { allowZero: true });
    const mktg = validateFinancialInput('Marketing Budget / Month', marketingBudgetPerMonth, { allowZero: true });
    const contMonths = validateFinancialInput('Contingency Reserve Months', contingencyMonths, { min: 3, max: 24 });
    const deals = validateFinancialInput('Expected Deals / Month', expectedDealsPerMonth, { allowZero: true });
    const dealVal = validateFinancialInput('Average Deal Value', avgDealValue, { min: 100000 });
    const bPct = validateFinancialInput('Average Brokerage %', avgBrokeragePct, { isRate: true });

    // Upfront Capex
    const securityDeposit = rent.mul(depMonths);
    const upfrontCapex = securityDeposit.plus(fitout).plus(rera);

    // Monthly Opex
    const monthlyOpex = rent.plus(portals).plus(salaries).plus(mktg);

    // Recommended cash buffer for runway
    const runwayReserve = monthlyOpex.mul(contMonths);
    const totalSeedCapital = upfrontCapex.plus(runwayReserve);

    // Revenue per closed deal
    const revenuePerDeal = dealVal.mul(bPct).div(100);
    // Deals required per month to break even on monthly opex
    const dealsToBreakeven = revenuePerDeal.gt(0)
      ? monthlyOpex.div(revenuePerDeal).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
      : 0;

    const expectedMonthlyRevenue = revenuePerDeal.mul(deals).round();
    const netMonthlyCashflow = expectedMonthlyRevenue.minus(monthlyOpex).round();

    // 12-month projection
    let bankBalance = totalSeedCapital.minus(upfrontCapex);
    const projected12MonthCashflow: Array<{
      month: number;
      revenue: number;
      expenses: number;
      net: number;
      bankBalance: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      // Startup gestation ramp: 0 deals month 1, 0.5 deals month 2, then normal deals
      let monthFactor = new Decimal(1);
      if (m === 1) monthFactor = new Decimal(0);
      else if (m === 2) monthFactor = new Decimal(0.4);
      else if (m === 3) monthFactor = new Decimal(0.8);

      const mRev = expectedMonthlyRevenue.mul(monthFactor).round();
      const mNet = mRev.minus(monthlyOpex);
      bankBalance = bankBalance.plus(mNet);

      projected12MonthCashflow.push({
        month: m,
        revenue: mRev.toNumber(),
        expenses: monthlyOpex.toNumber(),
        net: mNet.toNumber(),
        bankBalance: bankBalance.toNumber()
      });
    }

    const working: CalculationWorking = {
      formulaInWords: 'Upfront Capital = Office Security Deposit + Setup/Tech + RERA Licensing; Monthly Burn = Rent + Portals + Salaries + Marketing; Break-even Deals = Monthly Burn ÷ Revenue per Closed Deal; Recommended Total Seed = Upfront Capital + (Monthly Burn × Contingency Months)',
      inputsAndAssumptions: {
        'Monthly Office Rent': formatINR(rent),
        'Security Deposit': `${depositMonths} months (${formatINR(securityDeposit)})`,
        'Interior & Hardware Fitouts': formatINR(fitout),
        'RERA Agent Licensing Fee': formatINR(rera),
        'Property Portals Subscription': formatINR(portals),
        'Team Payroll': formatINR(salaries),
        'Lead Generation Ad Spend': formatINR(mktg),
        'Runway Safety Buffer': `${contingencyMonths} months operating expenses`,
        'Target Deal Value': `${formatINR(dealVal)} with ${bPct.toString()}% brokerage (${formatINR(revenuePerDeal)} per deal)`
      },
      intermediateSteps: [
        {
          step: '1. Upfront Capital Outlay (Capex)',
          description: 'One-time lease deposit, registration, and office readiness costs',
          result: formatINR(upfrontCapex)
        },
        {
          step: '2. Monthly Operating Expense (Burn Rate)',
          description: 'Recurring monthly cost of running agency operations',
          result: formatINR(monthlyOpex)
        },
        {
          step: '3. Break-even Transaction Volume',
          description: `Number of ₹${dealVal.div(100000).toString()} Lakh deals needed per month to cover burn rate`,
          result: `${dealsToBreakeven} deals / month`
        },
        {
          step: '4. Total Recommended Seed Fund',
          description: `Upfront capex + ${contingencyMonths} months cash reserve cushion`,
          result: formatINR(totalSeedCapital)
        }
      ],
      rateSourceAndDate: {
        rateName: 'Agency Unit Economics Model',
        rateValue: 'Verified Real Estate Brokerage Cashflow Planner',
        jurisdiction: 'Tier-1 & Tier-2 Indian Metros',
        source: 'CREDAI / National Association of Realtors India (NAR-India) Benchmarks',
        effectiveDate: '2024-01-01',
        lastUpdatedDate: SYSTEM_REFERENCE_DATE
      },
      finalAnswer: `Initial capex is ${formatINR(upfrontCapex)}. Monthly burn is ${formatINR(monthlyOpex)}. Recommended total startup fund with ${contingencyMonths} months runway is ${formatINR(totalSeedCapital)}. Break-even requires ${dealsToBreakeven} deal(s) per month.`,
      whatIsNotIncluded: [
        'Franchise brand royalty fees (if taking a franchise like RE/MAX or Sotheby\'s)',
        'Legal fees for drafting partnership deed / Private Limited incorporation with MCA',
        'Incentive bonuses paid to high-performing sales executives'
      ]
    };

    return {
      status: 'SUCCESS',
      calculatorId: 'calc_startup_cashflow',
      calculatorName: 'Real Estate Agency Startup & Runway Planner',
      data: {
        upfrontCapitalRequired: upfrontCapex.round().toNumber(),
        monthlyOperatingExpenses: monthlyOpex.round().toNumber(),
        recommendedReserveMonths: contMonths.toNumber(),
        recommendedTotalSeedCapital: totalSeedCapital.round().toNumber(),
        monthlyDealsToBreakeven: dealsToBreakeven,
        expectedMonthlyRevenue: expectedMonthlyRevenue.toNumber(),
        netMonthlyCashflow: netMonthlyCashflow.toNumber(),
        runwayMonths: contMonths.toNumber(),
        projected12MonthCashflow
      },
      working
    };
  } catch (err: any) {
    return {
      status: 'INVALID_INPUT',
      calculatorId: 'calc_startup_cashflow',
      calculatorName: 'Real Estate Agency Startup & Runway Planner',
      error: err.message
    };
  }
}
