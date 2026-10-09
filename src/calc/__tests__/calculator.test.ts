/**
 * REALTYBASE Automated Calculator Test Suite.
 * Verifies reference test cases with ±₹1 tolerance, property invariants,
 * slab boundary checks, edge cases, and cross-checks.
 */

import {
  calculateAffordability,
  calculateAmortizationSchedule,
  calculateBuyVsRent,
  calculateBrokerageAndGST,
  calculateCapitalGains,
  calculateEMI,
  calculatePrepayment,
  calculateRentalYield,
  calculateStampDutyAndRegistration,
  calculateStartupCostAndCashflow
} from '../engine.ts';
import { checkRateFreshness, INITIAL_RATES_TABLE } from '../rates.ts';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'Reference Value' | 'Property Invariant' | 'Slab Boundary' | 'Edge Case' | 'Cross Check';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  timestamp: string;
  results: TestResultItem[];
}

export function runAllCalculatorTests(): TestSuiteSummary {
  const results: TestResultItem[] = [];

  function assert(
    id: string,
    name: string,
    category: TestResultItem['category'],
    condition: boolean,
    expected: string,
    actual: string,
    details?: string,
    startTime: number = performance.now()
  ) {
    results.push({
      id,
      name,
      category,
      passed: condition,
      expected,
      actual,
      details,
      durationMs: Number((performance.now() - startTime).toFixed(2))
    });
  }

  // --- 1. REFERENCE VALUES (tolerance ±₹1) ---
  // Loan: ₹80,00,000, 8.5% p.a., 20 years
  const t0 = performance.now();
  const emiRes = calculateEMI(8000000, 8.5, 20);
  assert(
    'ref_emi_80l',
    'EMI on ₹80,00,000 at 8.5% for 20 years = ₹69,426 (±₹1)',
    'Reference Value',
    emiRes.status === 'SUCCESS' && Math.abs(emiRes.data!.monthlyEMI - 69426) <= 1,
    '₹69,426',
    `₹${emiRes.data?.monthlyEMI}`,
    'Standard loan formula closed-form solution',
    t0
  );

  const tAmort = performance.now();
  const amortRes = calculateAmortizationSchedule(8000000, 8.5, 20);
  const data = amortRes.data!;

  assert(
    'ref_total_interest_80l',
    'Total interest on ₹80L at 8.5% for 20 years = ₹86,62,206 (±₹100)',
    'Reference Value',
    Math.abs(data.totalInterestPaid - 8662206) <= 100,
    '₹86,62,206 (±100)',
    `₹${data.totalInterestPaid}`,
    'Sum of 240 amortized monthly interest entries',
    tAmort
  );

  assert(
    'ref_year1_interest_80l',
    'Year-1 interest on ₹80L at 8.5% = ₹6,73,892 (±₹50)',
    'Reference Value',
    Math.abs(data.year1Interest - 673892) <= 50,
    '₹6,73,892 (±50)',
    `₹${data.year1Interest}`,
    'Aggregated interest from Month 1 to Month 12',
    tAmort
  );

  assert(
    'ref_balance_12m_80l',
    'Principal balance after 12 months = ₹78,40,782 (±₹50)',
    'Reference Value',
    Math.abs(data.balanceAfter12Months - 7840782) <= 50,
    '₹78,40,782 (±50)',
    `₹${data.balanceAfter12Months}`,
    'Closing balance at month 12',
    tAmort
  );

  assert(
    'ref_balance_60m_80l',
    'Principal balance after 5 years (60m) = ₹70,50,175 (±₹150)',
    'Reference Value',
    Math.abs(data.balanceAfter60Months - 7050175) <= 150,
    '₹70,50,175 (±150)',
    `₹${data.balanceAfter60Months}`,
    'Closing balance at month 60',
    tAmort
  );

  // Rental Yield: ₹1 crore with ₹30,000 monthly rent = 3.6%
  const tYield = performance.now();
  const yieldRes = calculateRentalYield(10000000, 30000, 0);
  assert(
    'ref_rental_yield_1cr',
    'Rental yield on ₹1 Crore with ₹30,000 monthly rent = 3.6%',
    'Reference Value',
    yieldRes.status === 'SUCCESS' && yieldRes.data!.grossRentalYieldPct === 3.6,
    '3.6%',
    `${yieldRes.data?.grossRentalYieldPct}%`,
    '(30000 × 12) / 10000000 * 100 = 3.60%',
    tYield
  );

  // Affordability: ₹1,00,000 income, no EMIs, 40% limit, 8.5%, 20 years
  const tAfford = performance.now();
  const affordRes = calculateAffordability(100000, 0, 40, 8.5, 20);
  assert(
    'ref_afford_max_emi',
    'Affordability Max EMI at ₹1,00,000 income and 40% FOIR = ₹40,000',
    'Reference Value',
    affordRes.status === 'SUCCESS' && affordRes.data!.maxAllowableEmi === 40000,
    '₹40,000',
    `₹${affordRes.data?.maxAllowableEmi}`,
    '100000 × 40% - 0 = 40000',
    tAfford
  );

  assert(
    'ref_afford_max_loan',
    'Affordability Max Loan at 8.5% for 20 years = approx ₹46,09,234 (±₹100)',
    'Reference Value',
    affordRes.status === 'SUCCESS' && Math.abs(affordRes.data!.maxEligibleLoan - 4609234) <= 100,
    '₹46,09,234 (±100)',
    `₹${affordRes.data?.maxEligibleLoan}`,
    'Present value of 240 monthly payments of ₹40,000 at 8.5% p.a.',
    tAfford
  );

  // Prepayment: ₹5,00,000 lump sum on ₹80L loan saves ~₹19,09,426 interest and ~34 months
  const tPrepay = performance.now();
  const prepayRes = calculatePrepayment(8000000, 8.5, 20, 500000, 1, 0);
  assert(
    'ref_prepayment_savings',
    'Prepayment of ₹5L lump sum saves ~₹19,09,426 interest (±₹20,000) and ~34 months (±2m)',
    'Reference Value',
    prepayRes.status === 'SUCCESS' &&
      Math.abs(prepayRes.data!.interestSaved - 1909426) <= 20000 &&
      Math.abs(prepayRes.data!.monthsSaved - 34) <= 2,
    'Interest saved: ~₹19,09,426, Months saved: ~34',
    `Interest saved: ₹${prepayRes.data?.interestSaved}, Months saved: ${prepayRes.data?.monthsSaved}`,
    'Lump sum applied in Month 1 accelerates compound amortization',
    tPrepay
  );

  // --- 2. PROPERTY TESTS (Invariants) ---
  // Property 1: Final amortization balance is exactly 0
  const tProp1 = performance.now();
  const finalRow = data.schedule![data.schedule!.length - 1];
  assert(
    'prop_final_balance_zero',
    'Property: Final loan amortization closing balance is exactly 0',
    'Property Invariant',
    finalRow.closingBalance === 0,
    '0',
    `${finalRow.closingBalance}`,
    `Final installment month ${finalRow.month} clears debt`,
    tProp1
  );

  // Property 2: Principal repaid equals original loan
  const tProp2 = performance.now();
  const sumPrincipal = data.schedule!.reduce((acc, row) => acc + row.principalPaid, 0);
  assert(
    'prop_sum_principal_equals_loan',
    'Property: Total principal repaid across schedule equals original loan (₹80,00,000)',
    'Property Invariant',
    Math.abs(sumPrincipal - 8000000) <= 1,
    '8000000',
    `${sumPrincipal}`,
    'Sum of all monthly principal components',
    tProp2
  );

  // Property 3: Higher interest rate NEVER lowers EMI
  const tProp3 = performance.now();
  const emiLow = calculateEMI(5000000, 8.0, 15).data!.monthlyEMI;
  const emiHigh = calculateEMI(5000000, 9.0, 15).data!.monthlyEMI;
  assert(
    'prop_higher_rate_higher_emi',
    'Property: Higher interest rate never lowers EMI (9% vs 8%)',
    'Property Invariant',
    emiHigh > emiLow,
    `EMI(9%) > EMI(8%)`,
    `EMI(9%)=₹${emiHigh} > EMI(8%)=₹${emiLow}`,
    'Monotonicity check on interest rate',
    tProp3
  );

  // Property 4: Longer tenure NEVER raises EMI
  const tProp4 = performance.now();
  const emiShort = calculateEMI(5000000, 8.5, 15).data!.monthlyEMI;
  const emiLong = calculateEMI(5000000, 8.5, 25).data!.monthlyEMI;
  assert(
    'prop_longer_tenure_lower_emi',
    'Property: Longer tenure never raises EMI (25 yrs vs 15 yrs)',
    'Property Invariant',
    emiLong < emiShort,
    `EMI(25yr) < EMI(15yr)`,
    `EMI(25yr)=₹${emiLong} < EMI(15yr)=₹${emiShort}`,
    'Monotonicity check on loan tenure',
    tProp4
  );

  // --- 3. SLAB BOUNDARY TESTS ---
  // Maharashtra Registration Cap Slab: ₹30,00,000 threshold
  // At ₹29,99,999 (1 rupee below): 1% = ₹30,000 (uncapped)
  // At ₹30,00,000 (at boundary): 1% = ₹30,000
  // At ₹30,00,001 (1 rupee above): capped at ₹30,000
  // At ₹1,00,00,000: capped at ₹30,000 (NOT ₹1,00,000!)
  const tSlab1 = performance.now();
  const sdBelow = calculateStampDutyAndRegistration(2999999, 'Maharashtra', 'male', 'metro');
  const sdAt = calculateStampDutyAndRegistration(3000000, 'Maharashtra', 'male', 'metro');
  const sdAbove = calculateStampDutyAndRegistration(3000001, 'Maharashtra', 'male', 'metro');
  const sd1Cr = calculateStampDutyAndRegistration(10000000, 'Maharashtra', 'male', 'metro');

  assert(
    'slab_mh_reg_cap_boundary',
    'Maharashtra Registration Slabs: exact ₹30,000 cap applied above ₹30L boundary',
    'Slab Boundary',
    sdBelow.data!.registrationFeeAmount === 30000 &&
      sdAt.data!.registrationFeeAmount === 30000 &&
      sdAbove.data!.registrationFeeAmount === 30000 &&
      sd1Cr.data!.registrationFeeAmount === 30000,
    'Registration fee capped at ₹30,000 for ₹30,00,001 and ₹1,00,00,000',
    `₹30L-1: ₹${sdBelow.data?.registrationFeeAmount}, ₹30L: ₹${sdAt.data?.registrationFeeAmount}, ₹30L+1: ₹${sdAbove.data?.registrationFeeAmount}, ₹1Cr: ₹${sd1Cr.data?.registrationFeeAmount}`,
    'Verifies inclusive/exclusive statutory boundary condition',
    tSlab1
  );

  // Karnataka Slabs: ₹20 Lakhs boundary (2% vs 3%)
  const tSlab2 = performance.now();
  const kaTier1 = calculateStampDutyAndRegistration(2000000, 'Karnataka');
  const kaTier2 = calculateStampDutyAndRegistration(2000001, 'Karnataka');
  assert(
    'slab_ka_boundary_20l',
    'Karnataka Stamp Duty: ₹20,00,000 is 2%, ₹20,00,001 is 3%',
    'Slab Boundary',
    kaTier1.data!.stampDutyPct === 2.0 && kaTier2.data!.stampDutyPct === 3.0,
    '<=20L: 2%, >20L: 3%',
    `20L: ${kaTier1.data?.stampDutyPct}%, 20L+1: ${kaTier2.data?.stampDutyPct}%`,
    'Karnataka Stamp Act slab transitions',
    tSlab2
  );

  // --- 4. EDGE CASES & VALIDATION REJECTION ---
  // Edge Case 1: Zero interest rate rejected
  const tEdge1 = performance.now();
  const zeroRateRes = calculateEMI(1000000, 0, 10);
  assert(
    'edge_zero_rate_rejected',
    'Edge Case: Rejects 0% interest rate with clear validation error',
    'Edge Case',
    zeroRateRes.status === 'INVALID_INPUT' && zeroRateRes.error !== undefined,
    'INVALID_INPUT with descriptive error',
    `${zeroRateRes.status}: ${zeroRateRes.error}`,
    'Prevents division by zero in compound factor',
    tEdge1
  );

  // Edge Case 2: Excessive rate (>40%) rejected
  const tEdge2 = performance.now();
  const highRateRes = calculateEMI(1000000, 45, 10);
  assert(
    'edge_excessive_rate_rejected',
    'Edge Case: Rejects interest rate > 40%',
    'Edge Case',
    highRateRes.status === 'INVALID_INPUT',
    'INVALID_INPUT',
    `${highRateRes.status}: ${highRateRes.error}`,
    'Enforces financial sanity limits',
    tEdge2
  );

  // Edge Case 3: Excessive tenure (>40 years) rejected
  const tEdge3 = performance.now();
  const highTenureRes = calculateEMI(1000000, 8.5, 45);
  assert(
    'edge_excessive_tenure_rejected',
    'Edge Case: Rejects loan tenure > 40 years',
    'Edge Case',
    highTenureRes.status === 'INVALID_INPUT',
    'INVALID_INPUT',
    `${highTenureRes.status}: ${highTenureRes.error}`,
    'Indian mortgage regulations restrict tenure to 30-40 years max',
    tEdge3
  );

  // Edge Case 4: Negative input rejected
  const tEdge4 = performance.now();
  const negValRes = calculateRentalYield(-500000, 20000);
  assert(
    'edge_negative_input_rejected',
    'Edge Case: Rejects negative property cost',
    'Edge Case',
    negValRes.status === 'INVALID_INPUT',
    'INVALID_INPUT',
    `${negValRes.status}: ${negValRes.error}`,
    'Validation checks strictly block negative capital amounts',
    tEdge4
  );

  // Edge Case 5: Stale Rate Flagging (NEEDS_RATE_CONFIRMATION)
  const tEdge5 = performance.now();
  const staleCheck = checkRateFreshness(INITIAL_RATES_TABLE['mumbai_local_development_cess_stale']);
  assert(
    'edge_stale_rate_confirmation',
    'Rate Governance: Rates older than 6 months flagged for user confirmation',
    'Edge Case',
    staleCheck.isFresh === false && (staleCheck.monthsOld || 0) >= 6,
    'isFresh: false, reason mentioning > 6 months',
    `isFresh: ${staleCheck.isFresh}, monthsOld: ${staleCheck.monthsOld}`,
    'Non-negotiable rule: Stale rates require explicit user confirmation',
    tEdge5
  );

  // --- 5. CROSS-CHECK EMI TWO WAYS (Closed-form vs Month-by-month simulation) ---
  const tCross = performance.now();
  const closedEmi = calculateEMI(7500000, 8.75, 25).data!.monthlyEMI;
  const simSchedule = calculateAmortizationSchedule(7500000, 8.75, 25).data!.schedule!;
  // Check average EMI or first regular EMI in simulation vs closed form
  const simEmi = simSchedule[0].emi;
  assert(
    'cross_check_emi_two_ways',
    'Cross-Check: Closed-form annuity EMI equals monthly simulation EMI within ±₹1',
    'Cross Check',
    Math.abs(closedEmi - simEmi) <= 1,
    `Closed Form EMI = ₹${closedEmi}`,
    `Simulation Month 1 EMI = ₹${simEmi} (Diff: ₹${Math.abs(closedEmi - simEmi)})`,
    'Double-validates mathematical precision across two separate algorithmic paths',
    tCross
  );

  // Additional Calculators Sanity Verification
  const tBkg = performance.now();
  const bkgRes = calculateBrokerageAndGST(10000000, 2.0, 'corporate_firm', false);
  assert(
    'calc_brokerage_gst_tds',
    'Brokerage & GST: ₹1Cr deal at 2% brokerage = ₹2,00,000 base + 18% GST (₹36,000) - 5% TDS (₹10,000)',
    'Reference Value',
    bkgRes.status === 'SUCCESS' &&
      bkgRes.data!.grossBrokerage === 200000 &&
      bkgRes.data!.totalGst === 36000 &&
      bkgRes.data!.tdsDeducted === 10000 &&
      bkgRes.data!.netPayableToAgent === 226000,
    'Base: ₹2,00,000, GST: ₹36,000, TDS: ₹10,000, Net: ₹2,26,000',
    `Base: ₹${bkgRes.data?.grossBrokerage}, GST: ₹${bkgRes.data?.totalGst}, TDS: ₹${bkgRes.data?.tdsDeducted}, Net: ₹${bkgRes.data?.netPayableToAgent}`,
    'TDS Sec 194-H applied exclusively to base fee per CBDT circular',
    tBkg
  );

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    allPassed: failedCount === 0,
    timestamp: new Date().toISOString(),
    results
  };
}
