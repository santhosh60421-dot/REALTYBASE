/**
 * Editable Rates Table for Indian Real Estate.
 * Contains GST, TDS, Stamp Duty slabs, Registration limits, CII indices,
 * and Benchmark Interest Rates with freshness validation.
 */

import { RateItem } from './types.ts';

// Current reference date for rate freshness check: October 2026
export const SYSTEM_REFERENCE_DATE = '2026-10-01';

export const INITIAL_RATES_TABLE: Record<string, RateItem> = {
  'gst_brokerage_service': {
    id: 'rate_gst_brokerage',
    name: 'GST on Real Estate Brokerage / Agency Services',
    key: 'gst_brokerage_service',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 18.0,
    unit: '%',
    source: 'Central Board of Indirect Taxes & Customs (CBIC) - SAC 997222 Real Estate Services',
    effectiveDate: '2017-07-01',
    lastUpdatedDate: '2026-06-15',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-06-18',
    notes: 'Applicable uniformly across India at 18% (9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state) on brokerage invoice.'
  },

  'tds_section_194h': {
    id: 'rate_tds_194h',
    name: 'TDS on Real Estate Commission / Brokerage (Sec 194-H)',
    key: 'tds_section_194h',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 5.0,
    unit: '%',
    source: 'Income Tax Act 1961, Section 194-H / Central Board of Direct Taxes (CBDT)',
    effectiveDate: '2024-04-01',
    lastUpdatedDate: '2026-07-01',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Anil K. Deshmukh',
    reviewerRole: 'Direct Tax Specialist',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-07-05',
    notes: 'Deducted by corporate/firm clients when annual brokerage paid to an agent exceeds ₹15,000 threshold.'
  },

  'tds_section_194ia': {
    id: 'rate_tds_194ia',
    name: 'TDS on Purchase of Immovable Property (Sec 194-IA)',
    key: 'tds_section_194ia',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 1.0,
    unit: '%',
    source: 'Income Tax Act 1961, Section 194-IA / Finance Act',
    effectiveDate: '2022-04-01',
    lastUpdatedDate: '2026-05-20',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-05-25',
    notes: '1% TDS deducted by buyer on sale consideration or stamp duty value (whichever is higher) where value >= ₹50,00,000.'
  },

  'benchmark_home_loan_rate': {
    id: 'rate_home_loan_benchmark',
    name: 'Benchmark Floating Home Loan Interest Rate',
    key: 'benchmark_home_loan_rate',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 8.50,
    unit: '% p.a.',
    source: 'RBI External Benchmark Linked Rate (EBLR) / Top Housing Finance Lenders Consensus',
    effectiveDate: '2025-01-01',
    lastUpdatedDate: '2026-06-10',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Priya Sundaram',
    reviewerRole: 'Banking & Mortgage Consultant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-06-12',
    notes: 'Reference prime rate for salaried borrower with CIBIL score > 750.'
  },

  'benchmark_max_foir': {
    id: 'rate_foir_limit',
    name: 'Maximum Fixed Obligation to Income Ratio (FOIR)',
    key: 'benchmark_max_foir',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 40.0,
    unit: '%',
    source: 'Prudent Banking Underwriting Standards / NHB Housing Guidelines',
    effectiveDate: '2024-01-01',
    lastUpdatedDate: '2026-06-01',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Priya Sundaram',
    reviewerRole: 'Banking & Mortgage Consultant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-06-05',
    notes: 'Conservative standard allowing up to 40% of net monthly take-home for total debt servicing.'
  },

  'ltcg_real_estate_rate': {
    id: 'rate_ltcg_property',
    name: 'Long-Term Capital Gains Tax Rate on Immovable Property',
    key: 'ltcg_real_estate_rate',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 12.5,
    unit: '%',
    source: 'Finance Act 2024 / Sec 112 Income Tax Act',
    effectiveDate: '2024-07-23',
    lastUpdatedDate: '2026-08-01',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-08-05',
    notes: '12.5% without indexation for assets transferred after July 23, 2024. Pre-2024 acquisitions may elect 20% with indexation if beneficial for resident individuals.'
  },

  'health_and_education_cess': {
    id: 'rate_cess_tax',
    name: 'Health and Education Cess on Direct Income Tax',
    key: 'health_and_education_cess',
    jurisdiction: 'Central',
    type: 'percentage',
    value: 4.0,
    unit: '%',
    source: 'Finance Act / Income Tax Rules',
    effectiveDate: '2018-04-01',
    lastUpdatedDate: '2026-05-10',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-05-15',
    notes: '4% surcharged on all computed income tax / capital gains tax.'
  },

  // State Stamp Duty: Maharashtra
  'stamp_duty_maharashtra': {
    id: 'rate_sd_mh',
    name: 'Maharashtra Stamp Duty & Registration Structure',
    key: 'stamp_duty_maharashtra',
    jurisdiction: 'Maharashtra',
    type: 'slabs',
    source: 'Maharashtra Stamp Act, 1958 & IGR Maharashtra Circulars',
    effectiveDate: '2024-04-01',
    lastUpdatedDate: '2026-07-15',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Adv. Suresh Kulkarni',
    reviewerRole: 'Bombay High Court Property Advocate',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-07-20',
    notes: 'Base Stamp Duty: 5%. In Municipal Corporation zones (Mumbai, Pune, Thane, etc.), +1% Metro Cess / LBT added (total 6%). Registration Fee: 1% capped at ₹30,000 for properties exceeding ₹30 Lakhs.',
    slabs: [
      {
        min: 0,
        max: 3000000,
        inclusiveMax: true,
        ratePct: 5.0,
        surchargePct: 1.0, // Metro Cess
        fixedFee: 0, // Registration 1% without cap
        description: 'Property value up to ₹30,00,000: 5% Base + 1% Metro Cess; 1% Registration fee uncapped.'
      },
      {
        min: 3000000,
        max: null,
        inclusiveMax: false,
        ratePct: 5.0,
        surchargePct: 1.0, // Metro Cess
        fixedFee: 30000, // Registration capped at ₹30,000
        description: 'Property value above ₹30,00,000: 5% Base + 1% Metro Cess; Registration fee capped at exactly ₹30,000.'
      }
    ]
  },

  // State Stamp Duty: Karnataka
  'stamp_duty_karnataka': {
    id: 'rate_sd_ka',
    name: 'Karnataka Stamp Duty & Registration Slabs',
    key: 'stamp_duty_karnataka',
    jurisdiction: 'Karnataka',
    type: 'slabs',
    source: 'Karnataka Stamp Act 1957 & Department of Stamps and Registration, Govt of Karnataka',
    effectiveDate: '2024-04-01',
    lastUpdatedDate: '2026-06-25',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Adv. M. G. Rao',
    reviewerRole: 'Karnataka Real Estate Advocate',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-06-28',
    notes: 'Slabs: Up to ₹20L (2%), ₹20L-₹45L (3%), > ₹45L (5%). Surcharge: 10% on stamp duty (urban) or 2% (rural). Registration fee: 2% of property consideration.',
    slabs: [
      {
        min: 0,
        max: 2000000,
        inclusiveMax: true,
        ratePct: 2.0,
        cessPct: 10.0, // 10% cess on stamp duty amount
        fixedFee: 0,
        description: 'Affordable tier 1: Up to ₹20 Lakhs (2% Stamp Duty + 10% Cess on Stamp Duty + 2% Registration)'
      },
      {
        min: 2000000,
        max: 4500000,
        inclusiveMax: true,
        ratePct: 3.0,
        cessPct: 10.0,
        fixedFee: 0,
        description: 'Mid tier: ₹20 Lakhs to ₹45 Lakhs (3% Stamp Duty + 10% Cess on Stamp Duty + 2% Registration)'
      },
      {
        min: 4500000,
        max: null,
        inclusiveMax: false,
        ratePct: 5.0,
        cessPct: 10.0,
        fixedFee: 0,
        description: 'Standard tier: Above ₹45 Lakhs (5% Stamp Duty + 10% Cess on Stamp Duty + 2% Registration)'
      }
    ]
  },

  // State Stamp Duty: Delhi
  'stamp_duty_delhi': {
    id: 'rate_sd_dl',
    name: 'Delhi Stamp Duty and Registration Rates',
    key: 'stamp_duty_delhi',
    jurisdiction: 'Delhi',
    type: 'slabs',
    source: 'Revenue Department, Govt of NCT of Delhi',
    effectiveDate: '2024-01-01',
    lastUpdatedDate: '2026-05-15',
    updatedBy: 'Santhosh (Compliance Lead)',
    reviewer: 'Adv. Suresh Kulkarni',
    reviewerRole: 'Property Advocate',
    reviewStatus: 'Reviewed',
    reviewDate: '2026-05-18',
    notes: 'Male buyers: 6%, Female buyers: 4%, Joint ownership: 5%. Registration fee: Flat 1% of property value.',
    slabs: [
      {
        min: 0,
        max: null,
        inclusiveMax: false,
        ratePct: 6.0, // Male standard
        fixedFee: 0,
        description: 'Delhi General: Male 6% (or Female 4% / Joint 5%) Stamp Duty + 1% Registration fee.'
      }
    ]
  },

  // Stale rate sample for testing the 6-month verification requirement
  'mumbai_local_development_cess_stale': {
    id: 'rate_mumbai_cess_stale',
    name: 'Historic MMRDA Infrastructure Surcharge (Unverified)',
    key: 'mumbai_local_development_cess_stale',
    jurisdiction: 'Maharashtra',
    type: 'percentage',
    value: 0.5,
    unit: '%',
    source: 'Historic MMRDA notification circular 2022',
    effectiveDate: '2022-01-01',
    lastUpdatedDate: '2024-01-10', // Clearly older than 6 months from 2026-10-01!
    updatedBy: 'Historical Import',
    reviewer: undefined,
    reviewStatus: 'Pending',
    notes: 'Sample rate item marked stale for testing automated freshness guardrails.'
  }
};

/**
 * Cost Inflation Index (CII) Table notified by CBDT (Base Year 2001-02 = 100)
 */
export const CII_TABLE: Record<string, number> = {
  '2001-02': 100,
  '2002-03': 105,
  '2003-04': 109,
  '2004-05': 113,
  '2005-06': 117,
  '2006-07': 122,
  '2007-08': 129,
  '2008-09': 137,
  '2009-10': 148,
  '2010-11': 167,
  '2011-12': 184,
  '2012-13': 200,
  '2013-14': 220,
  '2014-15': 240,
  '2015-16': 254,
  '2016-17': 264,
  '2017-18': 272,
  '2018-19': 280,
  '2019-20': 289,
  '2020-21': 301,
  '2021-22': 317,
  '2022-23': 331,
  '2023-24': 348,
  '2024-25': 363,
  '2025-26': 378,
  '2026-27': 392
};

/**
 * Checks whether a rate item is fresh (last updated within 180 days / ~6 months).
 * If stale or missing, requires user confirmation.
 */
export function checkRateFreshness(
  rate: RateItem | undefined,
  currentDateStr: string = SYSTEM_REFERENCE_DATE
): { isFresh: boolean; reason?: string; monthsOld?: number } {
  if (!rate) {
    return { isFresh: false, reason: 'Rate key not found in rates registry.' };
  }

  const updatedDate = new Date(rate.lastUpdatedDate);
  const now = new Date(currentDateStr);
  const diffTime = now.getTime() - updatedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.4);

  if (diffDays > 180) {
    return {
      isFresh: false,
      reason: `Rate "${rate.name}" was last updated on ${rate.lastUpdatedDate} (${diffMonths} months ago). Rates older than 6 months require user confirmation.`,
      monthsOld: diffMonths
    };
  }

  return { isFresh: true, monthsOld: diffMonths };
}
