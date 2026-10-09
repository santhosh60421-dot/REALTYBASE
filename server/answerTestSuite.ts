/**
 * REALTYBASE Answer Test Suite.
 * Pre-seeded with 20 beginner real estate business & compliance questions
 * plus out-of-scope questions to verify grounded guardrails.
 */

export interface AnswerTestCase {
  id: string;
  category: string;
  question: string;
  expectedKeywords: string[];
  requiredSourceIds: string[];
  expectedOutOfScope?: boolean;
  needsVerifiedDocs: boolean;
  description: string;
  lastRunResult?: {
    passed: boolean;
    actualAnswerSnippet: string;
    sourcesUsed: string[];
    outOfScopeDetected: boolean;
    missingKeywords?: string[];
    runTimestamp: string;
  };
}

export const INITIAL_ANSWER_TEST_CASES: AnswerTestCase[] = [
  {
    id: 'test_q01_maharera_license',
    category: 'RERA & Licensing',
    question: 'How do I register as an individual real estate agent under RERA in Maharashtra and what is the fee?',
    expectedKeywords: ['MahaRERA', '₹10,000', '5-year', 'Certificate of Competency', 'Rule 11'],
    requiredSourceIds: ['doc_maharera_agent_regulations', 'doc_rera_act_2016_central'],
    needsVerifiedDocs: true,
    description: 'Verifies state fee schedule (₹10,000 for 5 years) and mandatory competence certificate.'
  },
  {
    id: 'test_q02_maharera_order41',
    category: 'RERA & Licensing',
    question: 'What is the mandatory training and certification exam requirement for MahaRERA agents under Order 41/2023?',
    expectedKeywords: ['Order No. 41/2023', 'Certificate of Competency', 'IBPS', '20-hour', 'promoters'],
    requiredSourceIds: ['doc_maharera_agent_regulations'],
    needsVerifiedDocs: true,
    description: 'Tests knowledge of mandatory agent certification and IBPS examination.'
  },
  {
    id: 'test_q03_krera_agent_fee',
    category: 'RERA & Licensing',
    question: 'What is the fee to register as an individual agent in Karnataka under K-RERA Form G?',
    expectedKeywords: ['twenty-five thousand', '₹25,000', 'Form G', 'five years', 'Form H'],
    requiredSourceIds: ['doc_karnatakara_agent_rules'],
    needsVerifiedDocs: true,
    description: 'Tests Karnataka RERA individual registration fee of ₹25,000.'
  },
  {
    id: 'test_q04_unregistered_agent_ban',
    category: 'RERA & Licensing',
    question: 'Can an unregistered real estate agent facilitate property sales in a RERA registered project?',
    expectedKeywords: ['Section 9', 'No real estate agent', 'without obtaining registration', 'penalty', 'ten thousand rupees'],
    requiredSourceIds: ['doc_rera_act_2016_central'],
    needsVerifiedDocs: true,
    description: 'Verifies strict statutory prohibition under Section 9(1).'
  },
  {
    id: 'test_q05_agent_penalty_rera',
    category: 'RERA & Licensing',
    question: 'What penalty applies if an agent markets an unregistered real estate project under Section 9 or 10?',
    expectedKeywords: ['ten thousand rupees', 'every day', 'five per cent', 'cost of plot'],
    requiredSourceIds: ['doc_rera_act_2016_central'],
    needsVerifiedDocs: true,
    description: 'Tests statutory penalty formula: ₹10,000/day up to 5% of property value.'
  },
  {
    id: 'test_q06_gst_brokerage_rate',
    category: 'Taxes & GST',
    question: 'What is the GST rate on real estate brokerage commission in India and what is the SAC code?',
    expectedKeywords: ['18%', 'SAC 997222', '9% CGST', '9% SGST', '₹20 Lakhs'],
    requiredSourceIds: ['doc_cbic_gst_brokerage_circular'],
    needsVerifiedDocs: true,
    description: 'Verifies 18% standard GST under SAC 997222 and ₹20L registration threshold.'
  },
  {
    id: 'test_q07_tds_194h_commission',
    category: 'Taxes & TDS',
    question: 'Does a corporate client have to deduct TDS on brokerage commission under Section 194-H, and on what amount?',
    expectedKeywords: ['Section 194-H', '5%', '₹15,000', 'exclusive of GST', 'Circular No. 23/2017'],
    requiredSourceIds: ['doc_incometax_tds_property'],
    needsVerifiedDocs: true,
    description: 'Verifies 5% TDS rate, ₹15,000 annual threshold, and exclusion of GST from TDS base.'
  },
  {
    id: 'test_q08_agent_itc_eligibility',
    category: 'Taxes & GST',
    question: 'Can a real estate agent claim Input Tax Credit (ITC) on office rent and advertising portal subscriptions?',
    expectedKeywords: ['Input Tax Credit', 'ITC', 'office rent', 'portals', 'MagicBricks', '18%'],
    requiredSourceIds: ['doc_cbic_gst_brokerage_circular'],
    needsVerifiedDocs: true,
    description: 'Confirms ITC eligibility on operational agency expenses.'
  },
  {
    id: 'test_q09_tds_194ia_property',
    category: 'Taxes & TDS',
    question: 'When must a property buyer deduct 1% TDS under Section 194-IA and does the buyer need a TAN?',
    expectedKeywords: ['194-IA', '1%', 'fifty lakh', '₹50,00,000', '26QB', 'TAN'],
    requiredSourceIds: ['doc_incometax_tds_property'],
    needsVerifiedDocs: true,
    description: 'Tests 1% TDS on property >= ₹50L and Form 26QB without requiring TAN.'
  },
  {
    id: 'test_q10_ltcg_holding_period',
    category: 'Capital Gains',
    question: 'What is the holding period for immovable property to qualify as a Long-Term Capital Asset under the Income Tax Act?',
    expectedKeywords: ['twenty-four', '24 months', 'Long-Term Capital Asset', 'immovable property'],
    requiredSourceIds: ['doc_incometax_capital_gains_budget2024'],
    needsVerifiedDocs: true,
    description: 'Verifies 24-month statutory threshold for land and buildings.'
  },
  {
    id: 'test_q11_budget2024_ltcg_rate',
    category: 'Capital Gains',
    question: 'What is the long-term capital gains tax rate on real estate under Budget 2024 for sales after July 23, 2024?',
    expectedKeywords: ['12.5%', 'without indexation', '20%', 'July 23, 2024', 'Section 112'],
    requiredSourceIds: ['doc_incometax_capital_gains_budget2024'],
    needsVerifiedDocs: true,
    description: 'Tests Budget 2024 reform (12.5% without indexation vs 20% grandfathered choice).'
  },
  {
    id: 'test_q12_sec54_residential_exemption',
    category: 'Capital Gains',
    question: 'How can an individual claim tax exemption on capital gains under Section 54 and what is the maximum cap?',
    expectedKeywords: ['Section 54', 'residential house', '₹10 Crores', '2 years', '3 years'],
    requiredSourceIds: ['doc_incometax_capital_gains_budget2024'],
    needsVerifiedDocs: true,
    description: 'Verifies Section 54 reinvestment timelines and ₹10 Cr cap.'
  },
  {
    id: 'test_q13_sec54ec_bonds_cap',
    category: 'Capital Gains',
    question: 'What is the maximum investment limit in capital gains bonds under Section 54EC and which bonds qualify?',
    expectedKeywords: ['Section 54EC', '50 lakh', '₹50 Lakhs', 'NHAI', 'REC', '6 months'],
    requiredSourceIds: ['doc_incometax_capital_gains_budget2024'],
    needsVerifiedDocs: true,
    description: 'Tests ₹50 Lakh annual limit and 6-month investment window.'
  },
  {
    id: 'test_q14_maharashtra_stamp_duty',
    category: 'Stamp Duty',
    question: 'What is the base stamp duty rate and Metro cess in Mumbai Municipal Corporation limits?',
    expectedKeywords: ['5%', '1%', 'Metro Cess', '6%', 'Maharashtra Stamp Act'],
    requiredSourceIds: ['doc_maharashtra_stamp_act_rules'],
    needsVerifiedDocs: true,
    description: 'Verifies 5% base + 1% Metro cess = 6% effective in Mumbai/Pune.'
  },
  {
    id: 'test_q15_maharashtra_reg_cap',
    category: 'Stamp Duty',
    question: 'What is the statutory cap on registration fee in Maharashtra for properties valued above ₹30 Lakhs?',
    expectedKeywords: ['₹30,000', 'thirty thousand', 'capped', '₹30,00,000'],
    requiredSourceIds: ['doc_maharashtra_stamp_act_rules'],
    needsVerifiedDocs: true,
    description: 'Verifies exact ₹30,000 statutory cap in Maharashtra.'
  },
  {
    id: 'test_q16_karnataka_stamp_slabs',
    category: 'Stamp Duty',
    question: 'What are the stamp duty slabs in Karnataka for affordable vs standard properties?',
    expectedKeywords: ['2%', '3%', '5%', '20 Lakhs', '45 Lakhs', '10%'],
    requiredSourceIds: ['doc_karnatakara_agent_rules'],
    needsVerifiedDocs: true,
    description: 'Verifies 2% (up to 20L), 3% (20L-45L), and 5% (>45L) slabs.'
  },
  {
    id: 'test_q17_rbi_ltv_limits',
    category: 'Lending & RBI',
    question: 'What is the maximum Loan-to-Value (LTV) ratio allowed by RBI for home loans above ₹75 Lakhs?',
    expectedKeywords: ['75%', 'Loan-to-Value', 'LTV', 'down payment', '25%'],
    requiredSourceIds: ['doc_rbi_housing_finance_ltv'],
    needsVerifiedDocs: true,
    description: 'Tests RBI 75% LTV cap on loans > ₹75 Lakhs.'
  },
  {
    id: 'test_q18_title_due_diligence',
    category: 'Due Diligence',
    question: 'What is the recommended title search period and key documents needed for property due diligence in India?',
    expectedKeywords: ['30 years', 'Encumbrance Certificate', '7/12', 'RTC', 'Occupancy Certificate', 'CC'],
    requiredSourceIds: ['doc_due_diligence_checklist_title'],
    needsVerifiedDocs: true,
    description: 'Checks 30-year unbroken title chain, EC, revenue records, and OC/CC verification.'
  },
  {
    id: 'test_q19_agency_startup_checklist',
    category: 'Business Setup',
    question: 'What entity choices and registrations are needed to start a real estate agency firm in India?',
    expectedKeywords: ['Sole Proprietorship', 'LLP', 'Private Limited', 'Shop and Establishment', 'GST', 'RERA'],
    requiredSourceIds: ['doc_business_setup_brokerage'],
    needsVerifiedDocs: true,
    description: 'Verifies legal entity roadmap, MSME Udyam, Shop & Est, and RERA agent license.'
  },
  {
    id: 'test_q20_rera_dispute_complaints',
    category: 'Dispute Handling',
    question: 'How can an aggrieved homebuyer or agent file a complaint under Section 31 of RERA and what is the conciliation forum?',
    expectedKeywords: ['Section 31', 'Authority', 'Conciliation', 'CREDAI', '45 days'],
    requiredSourceIds: ['doc_rera_dispute_handling_tribunal'],
    needsVerifiedDocs: true,
    description: 'Tests Section 31 complaint mechanism and pre-litigation conciliation forums.'
  },

  // OUT-OF-SCOPE GUARDRAIL TEST CASES:
  {
    id: 'test_out_of_scope_01_california_zoning',
    category: 'Guardrail Out-of-Scope',
    question: 'What are the agricultural zoning setbacks and building permits for building a barn in Sonoma County, California?',
    expectedKeywords: ["can't find this in my verified sources"],
    requiredSourceIds: [],
    expectedOutOfScope: true,
    needsVerifiedDocs: false,
    description: 'Tests that foreign US zoning questions are strictly rejected with "I can\'t find this in my verified sources".'
  },
  {
    id: 'test_out_of_scope_02_crypto_tax_germany',
    category: 'Guardrail Out-of-Scope',
    question: 'What is the capital gains tax rate on Bitcoin and NFT sales held for 6 months in Germany?',
    expectedKeywords: ["can't find this in my verified sources"],
    requiredSourceIds: [],
    expectedOutOfScope: true,
    needsVerifiedDocs: false,
    description: 'Tests that foreign cryptocurrency tax questions are rejected without hallucinating.'
  }
];
