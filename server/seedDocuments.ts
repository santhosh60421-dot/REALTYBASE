/**
 * Initial Seed Documents for REALTYBASE Knowledge Base.
 * Authentic Indian real estate regulatory documents, statutory acts,
 * state RERA rules, tax circulars, and standard operating templates.
 */

import { DocumentMetadata } from './knowledgeBase.ts';

export const INITIAL_SEED_DOCUMENTS: DocumentMetadata[] = [
  {
    id: 'doc_rera_act_2016_central',
    title: 'Real Estate (Regulation and Development) Act, 2016 (RERA Central Act No. 16 of 2016)',
    publisher: 'Ministry of Housing and Urban Affairs (MoHUA), Government of India',
    url: 'https://mohua.gov.in/upload/uploadfiles/files/Real_Estate_Act_2016.pdf',
    jurisdiction: 'Central',
    type: 'Act',
    category: 'RERA (Act, state rules, agent and project registration)',
    effectiveDate: '2016-05-01',
    lastReviewedDate: '2026-07-10',
    status: 'Current',
    reviewedBy: 'Adv. Suresh Kulkarni',
    reviewerRole: 'Senior High Court Real Estate Advocate',
    reviewStatus: 'Reviewed',
    createdDate: '2026-01-15',
    rawContent: `Section 9: Registration of Real Estate Agents
(1) No real estate agent shall facilitate the sale or purchase of, or act on behalf of any person to facilitate the sale or purchase of any plot, apartment or building, as the case may be, in a real estate project or part of it, being the projects registered under section 3, without obtaining registration under this section.
(2) Every real estate agent shall make an application to the Authority for registration in such form, manner, within such time and accompanied by such fee and documents as may be prescribed.
(3) The Authority shall, within such period, in such manner and upon satisfying itself of the fulfillment of such conditions, as may be prescribed:
(a) grant a single registration number to the real estate agent for the entire State or Union territory, as the case may be;
(b) reject the application for reasons to be recorded in writing, if such application does not conform to the provisions of the Act or the rules or regulations made thereunder: Provided that no application shall be rejected unless the applicant has been given an opportunity of being heard in the matter.
(4) Where on the completion of the period specified under sub-section (3), if the applicant does not receive any communication about the deficiencies, the registration shall be deemed to have been granted.
(5) The registration granted under this section shall be valid for such period as may be prescribed and shall be renewable upon application and payment of prescribed fees.
(6) If any real estate agent fails to comply with or contravenes the provisions of section 9 or section 10, he shall be liable to a penalty of ten thousand rupees for every day during which such default continues, which may cumulatively extend up to five per cent of the cost of plot, apartment or buildings, as the case may be, of the real estate project, for which the sale or purchase has been facilitated.

Section 10: Functions and Duties of Real Estate Agents
Every real estate agent registered under section 9 shall:
(a) not facilitate the sale or purchase of any plot, apartment or building in a real estate project or part of it being sold by the promoter in any planning area which is not registered with the Authority;
(b) maintain and preserve such books of account, records and documents as may be prescribed;
(c) not involve himself in any unfair trade practice, namely:
(i) falsely representing that the services are of a particular standard or grade;
(ii) representing that the promoter or himself has approval or affiliation which such promoter or agent does not have;
(iii) making any false or misleading representation concerning the services;
(iv) permitting the publication of any advertisement in any newspaper or otherwise of services that are not intended to be offered;
(d) facilitate the possession of all the information and documents, as the allottee, is entitled to, at the time of booking of any plot, apartment or building;
(e) discharge such other functions as may be prescribed.

Section 3: Prior Registration of Real Estate Project with Real Estate Regulatory Authority
(1) No promoter shall advertise, market, book, sell or offer for sale, or invite persons to purchase in any manner any plot, apartment or building in any real estate project or part of it, in any planning area, without registering the real estate project with the Real Estate Regulatory Authority established under this Act.
(2) Notwithstanding anything contained in sub-section (1), no registration of the real estate project shall be required:
(a) where the area of land proposed to be developed does not exceed five hundred square meters or the number of apartments proposed to be developed does not exceed eight apartments inclusive of all phases;
(b) where the promoter has received completion certificate for a real estate project prior to commencement of this Act;
(c) for the purpose of renovation or repair or re-development which does not involve marketing, advertising, selling or new allotment of any apartment, plot or building.

Section 11(4): Functions and Duties of Promoter
The promoter shall be responsible for all obligations, responsibilities and functions under the provisions of this Act or the rules and regulations made thereunder or to the allottees as per the agreement for sale, or to the association of allottees, as the case may be, till the conveyance of all the apartments, plots or buildings to the allottees, or the common areas to the association of allottees or the competent authority, as the case may be.
The promoter shall enable the formation of an association or society or co-operative society of allottees within a period of three months of the majority of allottees having booked their apartment.`
  },

  {
    id: 'doc_maharera_agent_regulations',
    title: 'MahaRERA Real Estate Agent Regulations & Order No. 41/2023 on Mandatory Agent Certification',
    publisher: 'Maharashtra Real Estate Regulatory Authority (MahaRERA)',
    url: 'https://maharera.mahaonline.gov.in/Upload/PDF/Order%2041_2023.pdf',
    jurisdiction: 'Maharashtra',
    type: 'circular',
    category: 'Broker/agent licensing',
    effectiveDate: '2023-01-10',
    lastReviewedDate: '2026-08-05',
    status: 'Current',
    reviewedBy: 'Adv. Suresh Kulkarni',
    reviewerRole: 'High Court Real Estate Advocate',
    reviewStatus: 'Reviewed',
    createdDate: '2026-02-01',
    rawContent: `MahaRERA Order No. 41/2023: Mandatory Training and Certification of Real Estate Agents
1. In order to bring consistency in the practices of real estate agents, enhance knowledge of the regulatory framework, and cultivate professional conduct, MahaRERA has introduced a mandatory training curriculum and certification examination for real estate agents.
2. Applicability:
Every individual registered as a real estate agent with MahaRERA, and in the case of firms/companies/LLPs, all authorized signatories, directors, partners, and key customer-facing personnel, MUST undergo the designated 20-hour training program and clear the MahaRERA Real Estate Agent Certificate of Competency examination conducted by the Institute of Banking Personnel Selection (IBPS).
3. Deadlines and Enforcement:
No real estate agent shall be granted a new MahaRERA agent registration or renewal of an existing registration without uploading a valid Certificate of Competency.
Developers and Promoters are strictly prohibited from engaging or advertising through any real estate agent who does not possess a valid MahaRERA registration number and a valid Certificate of Competency. Any developer engaging uncertified or unregistered agents faces penal proceedings under Section 61 of the RERA Act.
4. Registration Fees in Maharashtra (Rule 11 of Maharashtra Real Estate Rules):
- Individual Agent: Application fee of ₹10,000 for 5-year registration. Renewal fee of ₹5,000 for additional 5 years.
- Other than Individual (Proprietorship, Partnership, LLP, Pvt Ltd): Application fee of ₹1,00,000 for 5-year registration. Renewal fee of ₹50,000 for 5 years.
5. Display Requirements:
Real estate agents must display their MahaRERA registration number on all letterheads, business cards, email signatures, promotional flyers, social media handles, and marketing brochures. Agents must quote their registration number alongside the project MahaRERA number in every transaction.`
  },

  {
    id: 'doc_karnatakara_agent_rules',
    title: 'Karnataka Real Estate (Regulation and Development) Rules, 2017: Agent Licensing & Code of Conduct',
    publisher: 'Karnataka Real Estate Regulatory Authority (K-RERA)',
    url: 'https://rera.karnataka.gov.in/rulesRegulations',
    jurisdiction: 'Karnataka',
    type: 'rules',
    category: 'Broker/agent licensing',
    effectiveDate: '2017-07-10',
    lastReviewedDate: '2026-07-25',
    status: 'Current',
    reviewedBy: 'Adv. M. G. Rao',
    reviewerRole: 'Karnataka Real Estate Legal Counsel',
    reviewStatus: 'Reviewed',
    createdDate: '2026-02-10',
    rawContent: `Rule 11: Application for Registration by the Real Estate Agent
(1) Every real estate agent required to register under sub-section (2) of section 9 shall make an application in writing to the Authority in Form 'G' along with the following documents:
(a) brief details of his enterprise including name, registered address, type of enterprise (proprietorship, societies, partnership, company etc.);
(b) the particulars of registration (whether as a company, partnership, etc.) including bye-laws, memorandum of association, articles of association, etc.;
(c) photograph of the real estate agent if it is an individual and the photograph of the partners, directors etc. in case of other entities;
(d) authenticated copy of the PAN card of the real estate agent;
(e) authenticated copy of the address proof of the place of business.

Rule 11(2): Fee Schedule in Karnataka
The real estate agent shall pay a registration fee at the time of application for registration by way of online payment:
(a) a sum of twenty-five thousand rupees (₹25,000) in case of an individual; or
(b) a sum of two lakh rupees (₹2,00,000) in case of other than an individual (Firms, LLPs, Companies).

Rule 12: Grant of Registration to the Real Estate Agent
(1) On receipt of the application, the Authority shall, within a period of thirty days, grant a registration certificate in Form 'H' to the real estate agent.
(2) The registration granted under this rule shall be valid for a period of five years.
(3) Renewal of registration can be made in Form 'I' at least sixty days prior to expiry along with payment of renewal fee: ₹5,000 for individual and ₹50,000 for non-individual entities.

Rule 14: Maintenance of Books of Accounts
Every registered real estate agent shall maintain and preserve books of account, records and documents in accordance with the provisions of the Income Tax Act, 1961, and shall produce them whenever demanded by the Karnataka RERA inspection officers. Agents must maintain a register of all transactions facilitated with buyer/seller details and project RERA numbers.`
  },

  {
    id: 'doc_cbic_gst_brokerage_circular',
    title: 'CBIC Statutory Guidelines: GST Applicability on Real Estate Brokerage and Construction Services',
    publisher: 'Central Board of Indirect Taxes and Customs (CBIC), Ministry of Finance, India',
    url: 'https://cbic.gov.in/resources/htdocs-cbec/gst/circular_real_estate.pdf',
    jurisdiction: 'Central',
    type: 'circular',
    category: 'GST on real estate',
    effectiveDate: '2019-04-01',
    lastReviewedDate: '2026-06-20',
    status: 'Current',
    reviewedBy: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    createdDate: '2026-02-15',
    rawContent: `1. Real Estate Agency and Brokerage Services (SAC Code 997222):
Real estate agents and brokers provide services of intermediation and property facilitation. Under the GST law:
- Rate of GST: 18% standard rate applies uniformly across India.
- Breakdown: For intra-state supply (agent and client located in the same state), 9% CGST + 9% SGST is charged. For inter-state supply, 18% IGST is charged.
- Threshold for GST Registration: Any real estate agent or agency whose aggregate annual turnover from services exceeds ₹20 Lakhs (₹10 Lakhs in Special Category States) is mandatorily required to obtain GST registration. Agents below this threshold are exempt from charging GST unless registered voluntarily.
- Place of Supply: The place of supply of services directly in relation to immovable property (including agents, architects, surveyors) is the location at which the immovable property is situated (Section 12(3) of the IGST Act).

2. Input Tax Credit (ITC) for Real Estate Agents:
A registered real estate agent paying 18% GST on outward brokerage invoices is fully entitled to claim Input Tax Credit (ITC) on operational business expenses, including:
(a) Office rent where landlord levies GST;
(b) Subscriptions to property advertising portals (MagicBricks, 99acres, Housing.com);
(c) Telecommunication and high-speed internet bills;
(d) IT hardware, laptops, CRM software SaaS licenses;
(e) Professional fees paid to accountants and legal advisors.

3. Developer Under-Construction GST Rates (Notification No. 03/2019-Central Tax Rate):
- Affordable Residential Housing (Carpet area up to 60 sq.m in metros or 90 sq.m in non-metros, and value <= ₹45 Lakhs): Effective GST is 1% without ITC.
- Other than Affordable Residential Apartments: Effective GST is 5% without ITC.
- Commercial Real Estate: 12% with ITC (or 5% in residential real estate projects - RREP).
- Completed Properties: Schedule III of the CGST Act specifies that sale of land and sale of building where the entire consideration has been received after issuance of the completion certificate (CC) or occupancy certificate (OC) by the competent authority shall be treated neither as supply of goods nor as supply of services. Therefore, 0% GST applies on ready-to-move properties with OC/CC.`
  },

  {
    id: 'doc_incometax_tds_property',
    title: 'Income Tax Act Provisions: TDS on Property Purchase (Sec 194-IA) & Brokerage (Sec 194-H)',
    publisher: 'Central Board of Direct Taxes (CBDT), Ministry of Finance, India',
    url: 'https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx',
    jurisdiction: 'Central',
    type: 'Act',
    category: 'Income tax, TDS and capital gains',
    effectiveDate: '2024-04-01',
    lastReviewedDate: '2026-07-01',
    status: 'Current',
    reviewedBy: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    createdDate: '2026-03-01',
    rawContent: `Section 194-IA: Payment on Transfer of Certain Immovable Property other than Agricultural Land
(1) Any person, being a transferee (buyer), responsible for paying to a resident transferor (seller) any sum by way of consideration for transfer of any immovable property (other than agricultural land), shall deduct an amount equal to one per cent (1%) of such sum or the stamp duty value of such property, whichever is higher, as income-tax thereon.
(2) No deduction under sub-section (1) shall be made where the consideration for the transfer of an immovable property and the stamp duty value of such property, are both less than fifty lakh rupees (₹50,00,000).
(3) The provisions of section 203A (mandatory TAN requirement) shall not apply to a person required to deduct tax in accordance with this section. The buyer can deduct and deposit TDS using their own PAN via Challan-cum-statement in Form 26QB within 30 days from the end of the month in which deduction was made.
(4) "Immovable property" includes land, building, or part of a building, and includes club membership fee, car parking fee, electricity or water facility fee, maintenance fee, or any other charges of an incidental nature.

Section 194-H: Commission or Brokerage
(1) Any person (other than an individual or a Hindu undivided family whose total sales/turnover from business does not exceed monetary limits specified under section 44AB) who is responsible for paying to a resident any income by way of commission (not being insurance commission) or brokerage, shall deduct income-tax thereon at the rate of five per cent (5%).
(2) No deduction shall be made under this section in a case where the amount of such income or the aggregate of the amounts of such income credited or paid during the financial year does not exceed fifteen thousand rupees (₹15,000).
(3) CBDT Circular No. 23/2017: If the GST on services has been indicated separately in the invoice, tax deducted at source under Chapter XVII-B shall be deducted on the value of goods or services supplied exclusive of GST component. Therefore, client must deduct 5% TDS only on the base brokerage, NOT on the 18% GST component.`
  },

  {
    id: 'doc_incometax_capital_gains_budget2024',
    title: 'Capital Gains Taxation on Real Estate: Sections 45, 54, 54EC & Budget 2024 Amendments',
    publisher: 'Ministry of Finance, Government of India (Finance Act 2024)',
    url: 'https://incometaxindia.gov.in/budgets/budget_2024_memorandum.pdf',
    jurisdiction: 'Central',
    type: 'Act',
    category: 'Income tax, TDS and capital gains',
    effectiveDate: '2024-07-23',
    lastReviewedDate: '2026-08-01',
    status: 'Current',
    reviewedBy: 'V. Ramanathan (FCA)',
    reviewerRole: 'Senior Chartered Accountant',
    reviewStatus: 'Reviewed',
    createdDate: '2026-03-05',
    rawContent: `1. Holding Period for Immovable Property:
Immovable property (land or building or both) held for more than twenty-four (24) months is classified as a Long-Term Capital Asset. Property held for 24 months or less is classified as a Short-Term Capital Asset.

2. Short-Term Capital Gains (STCG):
STCG on sale of immovable property is added to the taxpayer's total taxable income and taxed at normal applicable slab rates (plus surcharge and 4% Health & Education Cess).

3. Long-Term Capital Gains (LTCG) - Budget 2024 Overhaul:
For transfers effected on or after 23rd July 2024:
- Standard LTCG Tax Rate: 12.5% under Section 112 (without the benefit of indexation).
- Grandfathering / Relief for Pre-July 23, 2024 Acquisitions: For resident individuals and HUFs who acquired property prior to 23rd July 2024, the taxpayer has the option to compute tax liability under either:
  (a) 12.5% without indexation; OR
  (b) 20% with indexation benefit based on the Cost Inflation Index (CII),
  whichever results in lower tax payable.
- Health & Education Cess: 4% is levied on computed capital gains tax.

4. Section 54: Exemption on Sale of Residential House Property:
- Capital gains arising from transfer of a residential house are exempt if invested in the purchase of one residential house in India within 1 year before or 2 years after the date of transfer, or constructed within 3 years after the date of transfer.
- Budget 2023 Amendment: The maximum exemption claimable under Section 54 is capped at ₹10 Crores.
- Lock-in Period: The newly acquired residential house must not be transferred within 3 years from the date of acquisition.

5. Section 54EC: Exemption through Capital Gains Bonds:
- Long-term capital gains can be exempted by investing in specified capital gains bonds issued by National Highways Authority of India (NHAI), Rural Electrification Corporation (REC), Power Finance Corporation (PFC), or Indian Railway Finance Corporation (IRFC).
- Maximum Investment Limit: ₹50 Lakhs per financial year.
- Timeline: Investment must be made within six (6) months from the date of transfer.
- Lock-in Period: 5 years with interest rate around 5.25% p.a. (interest is taxable).`
  },

  {
    id: 'doc_maharashtra_stamp_act_rules',
    title: 'Maharashtra Stamp Act, 1958 & Registration Rules (Current Schedule 2024-2026)',
    publisher: 'Inspector General of Registration and Controller of Stamps (IGR Maharashtra)',
    url: 'https://igrmaharashtra.gov.in/stamp_rates',
    jurisdiction: 'Maharashtra',
    type: 'Act',
    category: 'Stamp duty and registration',
    effectiveDate: '2024-04-01',
    lastReviewedDate: '2026-07-15',
    status: 'Current',
    reviewedBy: 'Adv. Suresh Kulkarni',
    reviewerRole: 'High Court Real Estate Advocate',
    reviewStatus: 'Reviewed',
    createdDate: '2026-03-10',
    rawContent: `Article 25 of Schedule I of Maharashtra Stamp Act: Conveyance of Immovable Property
1. Base Stamp Duty Rates in Maharashtra:
- Within Municipal Corporation Limits (Mumbai, Thane, Navi Mumbai, Pune, Pimpri-Chinchwad, Nagpur, Nashik): 5% base stamp duty.
- Within Municipal Council / Cantonment Limits: 5% base stamp duty.
- Within Gram Panchayat (Rural) Limits: 3% to 4% base stamp duty.

2. Additional Surcharges and Cess:
- Metro Cess / Local Body Transport Surcharge: 1% additional surcharge is levied on conveyances within Mumbai, Pune, Thane, and Nagpur municipal corporation jurisdictions to fund urban transit infrastructure.
- Total effective stamp duty in Mumbai/Pune urban corporation zones: 6% (5% Base + 1% Metro Cess).

3. Concessions:
- Women Buyers: 1% concession on stamp duty is available for female individual purchasers of residential property, provided the property is registered solely in the woman's name and has a 15-year restriction against transfer to any male person.

4. Registration Fees in Maharashtra (Govt Notification):
- For property value up to ₹30,00,000: Registration fee is 1% of the agreement value or market value (whichever is higher).
- For property value exceeding ₹30,00,000: Registration fee is CAPPED at a statutory ceiling of exactly ₹30,000.
(Example: A property worth ₹1 Crore pays ₹30,000 registration fee, NOT ₹1,00,000).
- Document handling and biometric verification scanning fee: Fixed at ₹1,000 per document.`
  },

  {
    id: 'doc_due_diligence_checklist_title',
    title: 'Master Real Estate Title Due-Diligence & Conveyance Checklist for Brokers and Developers',
    publisher: 'Bar Association of India & RERA Advisory Council',
    url: 'https://realtybase.internal/compliance/title_due_diligence_checklist.pdf',
    jurisdiction: 'Central',
    type: 'guide',
    category: 'Sale agreements and due-diligence checklists',
    effectiveDate: '2024-01-01',
    lastReviewedDate: '2026-07-20',
    status: 'Current',
    reviewedBy: 'Adv. Suresh Kulkarni',
    reviewerRole: 'Senior Property Advocate',
    reviewStatus: 'Reviewed',
    createdDate: '2026-03-15',
    rawContent: `Mandatory Document Verification for Clear and Marketable Real Estate Title:
1. Title Search and Chain of Deeds (30-Year Search):
- Inspect registered Sale Deeds, Gift Deeds, Partition Deeds, Release Deeds, or Succession Certificates establishing an unbroken title chain for at least thirty (30) years.
- Verify that every intermediate transaction was duly stamped and registered at the sub-registrar office.

2. Encumbrance Certificate (EC / Nil-Encumbrance Certificate):
- Obtain Form 15 (showing registered transactions, registered mortgages, court attachments, lis pendens) or Form 16 (Nil Encumbrance certificate) from the Sub-Registrar's Office for the past 30 years.

3. Revenue Records & Land Extracts:
- Maharashtra: 7/12 extract (Satbara Utara), 8-A extract, and Ferfar (Mutation Entry Register Form 6). Confirm no pencil entries or pending revenue disputes.
- Karnataka: RTC (Record of Rights, Tenancy and Crops) Form 16, Mutation Register Extract (MR), Akarband, and Tippani / Village Map.
- Delhi / North India: Khatoni, Khasra Girdawari, Jamabandi records with Tehsildar office.
- Municipal Khata: A-Khata vs B-Khata (Karnataka), Property Tax Ledger extract (PTIN), up-to-date property tax receipts.

4. Project Approvals and Statutory Clearances:
- Sanctioned Building Plan approval by Town Planning Authority or Municipal Corporation.
- Commencement Certificate (CC) issued by the competent planning authority certifying physical inspection of plinth.
- Occupancy Certificate (OC) or Completion Certificate (CC) issued by Municipal Corporation certifying completion according to sanctioned bylaws before giving possession.
- Fire NOC, Environmental Clearance (EC from MoEF for built-up area > 20,000 sq.m), Airport Authority of India (AAI) height clearance, Tree Authority NOC.

5. RERA Compliance Verification:
- Cross-check the project registration status on the state RERA portal.
- Verify promoter's quarterly progress reports (QPR), escrow account details (70% in dedicated scheduled bank account under Section 4(2)(l)(D)), and proposed possession date.`
  },

  {
    id: 'doc_business_setup_brokerage',
    title: 'Legal Entity Setup & Statutory Compliance Roadmap for Starting a Real Estate Agency in India',
    publisher: 'Confederation of Real Estate Developers Associations of India (CREDAI) Legal Wing',
    url: 'https://credai.org/business_setup_guide_agents.pdf',
    jurisdiction: 'Central',
    type: 'guide',
    category: 'Business setup and compliance',
    effectiveDate: '2024-01-01',
    lastReviewedDate: '2026-06-30',
    status: 'Current',
    reviewedBy: 'V. Ramanathan (FCA)',
    reviewerRole: 'Corporate & Tax Consultant',
    reviewStatus: 'Reviewed',
    createdDate: '2026-03-20',
    rawContent: `1. Choice of Business Entity:
(a) Sole Proprietorship: Simplest setup, zero MCA incorporation cost, tied to founder's individual PAN. Drawback: Unlimited personal liability and higher individual RERA registration fees in some states.
(b) Limited Liability Partnership (LLP): Ideal for 2 or more partners. Offers limited liability protection, lower audit compliance burden than a Pvt Ltd company if capital <= ₹25L and turnover <= ₹40L.
(c) Private Limited Company: Highest credibility when dealing with tier-1 developers (Godrej, DLF, Lodha, Prestige) who require corporate channel partners. Enables equity funding and employee stock options (ESOPs).

2. Step-by-Step Incorporation Checklist:
Step 1: Obtain Digital Signature Certificates (DSC) and Director Identification Numbers (DIN).
Step 2: SPICe+ (INC-32) filing with Ministry of Corporate Affairs (MCA) for name reservation, Certificate of Incorporation (COI), PAN, and TAN.
Step 3: MSME / Udyam Registration (free online registration providing priority sector lending benefits and protection against delayed corporate payments under the MSMED Act).
Step 4: Shop and Establishment Act License (Gumasta in Maharashtra) from the local municipal corporation within 30 days of office setup.
Step 5: Professional Tax Registration (PTRC for employer, PTEC for directors/firm).
Step 6: Open Bank Current Account with scheduled commercial bank in the business legal name.
Step 7: Goods and Services Tax (GST) Registration under SAC 997222.
Step 8: State RERA Real Estate Agent License (Form G / Form H) with 5-year validity.

3. Statutory Accounting and Compliance Deadlines:
- Monthly: TDS deposit by 7th of subsequent month; GSTR-1 by 11th; GSTR-3B by 20th.
- Quarterly: Form 26Q (TDS return) by 31st of month following quarter.
- Annual: Income tax return by 31st October (if tax audit applicable) or 31st July; MCA Annual Filings (AOC-4 and MGT-7) within 30 and 60 days of AGM.`
  },

  {
    id: 'doc_rbi_housing_finance_ltv',
    title: 'RBI Master Directions on Housing Finance: Loan-to-Value (LTV) Caps & Underwriting Norms',
    publisher: 'Reserve Bank of India (RBI)',
    url: 'https://rbi.org.in/scripts/BS_ViewMasDirections.aspx?id=10500',
    jurisdiction: 'Central',
    type: 'circular',
    category: 'RBI and bank lending guidelines',
    effectiveDate: '2022-04-01',
    lastReviewedDate: '2026-07-05',
    status: 'Current',
    reviewedBy: 'Priya Sundaram',
    reviewerRole: 'Mortgage Advisory Specialist',
    reviewStatus: 'Reviewed',
    createdDate: '2026-04-01',
    rawContent: `1. Regulatory Loan-to-Value (LTV) Limits for Banks and Housing Finance Companies (HFCs):
To prevent systemic risk in the housing finance sector, the Reserve Bank of India has mandated strict upper bounds on Loan-to-Value (LTV) ratios:
- Tier 1 (Loan amount up to ₹30 Lakhs): Maximum permitted LTV is 90%. (Borrower down payment minimum 10%). Risk weight is 35%.
- Tier 2 (Loan amount above ₹30 Lakhs and up to ₹75 Lakhs): Maximum permitted LTV is 80%. (Borrower down payment minimum 20%). Risk weight is 35% if LTV <= 75%, and 50% if LTV is between 75% and 80%.
- Tier 3 (Loan amount above ₹75 Lakhs): Maximum permitted LTV is 75%. (Borrower down payment minimum 25%). Risk weight is 50%.

2. Exclusion of Statutory Costs from Loan Consideration:
In order to maintain transparent valuation, banks are instructed that the cost of stamp duty, registration charges, and other documentation fees SHOULD NOT be included in the cost of the housing property when calculating the LTV ratio.
Exception: In cases where the cost of the house/dwelling unit does not exceed ₹10 Lakhs (Affordable Housing for weaker sections), bank may include the cost of stamp duty, registration and other documentation expenses in the total property value for calculation of LTV.

3. Prohibition on Upfront Disbursal in Under-Construction Projects:
Disbursal of housing loans sanctioned to individuals should be strictly linked to the stages of construction of the housing project. Upfront disbursals or lump sum disbursal in case of incomplete/under-construction projects are prohibited.
Banks are barred from participating in innovative '80:20' or '75:25' subvention schemes where upfront money is disbursed to developers before construction milestones.`
  },

  {
    id: 'doc_rera_dispute_handling_tribunal',
    title: 'RERA Dispute Resolution Framework: Section 31 Complaints, Conciliation Forums & Appeals',
    publisher: 'National Real Estate Forum / Maharashtra RERA Appellate Tribunal',
    url: 'https://maharera.mahaonline.gov.in/dispute_redressal_manual.pdf',
    jurisdiction: 'Central',
    type: 'guide',
    category: 'Dispute handling',
    effectiveDate: '2023-01-01',
    lastReviewedDate: '2026-06-15',
    status: 'Current',
    reviewedBy: 'Adv. Suresh Kulkarni',
    reviewerRole: 'High Court Real Estate Advocate',
    reviewStatus: 'Reviewed',
    createdDate: '2026-04-10',
    rawContent: `Section 31: Filing of Complaints to the Authority or the Adjudicating Officer
(1) Any aggrieved person may file a complaint with the Authority or the adjudicating officer, as the case may be, for any violation or contravention of the provisions of this Act or the rules and regulations made thereunder, against any promoter, allottee or real estate agent.
Explanation: For the purpose of this sub-section "person" shall include the association of allottees or any voluntary consumer association registered under any law for the time being in force.
(2) Every complaint shall be in such form and accompanied by such fee as may be prescribed. (In Maharashtra: ₹5,000 online filing fee).

RERA Conciliation Forums:
Before undergoing formal adversarial litigation, RERA authorities (such as MahaRERA and UP RERA) provide a Conciliation and Dispute Resolution Forum comprising one representative from a Developer Association (CREDAI/NAREDCO) and one representative from a Consumer Organization (Mumbai Grahak Panchayat).
- Non-adversarial, consensus-driven process with a target resolution timeline of 45 days.
- Nominal conciliation fee (₹1,000). If conciliation succeeds, both parties sign an enforceable consent agreement.
- If conciliation fails, the complainant can proceed directly to formal hearing before the RERA Authority.

Section 18: Return of Amount and Compensation:
If the promoter fails to complete or is unable to give possession of an apartment, plot or building in accordance with the terms of the agreement for sale:
- If allottee wishes to withdraw from the project: Promoter shall return the entire amount received along with interest at the prescribed rate (SBI Marginal Cost of Funds Based Lending Rate MCLR + 2%).
- If allottee does not intend to withdraw: Promoter shall pay interest for every month of delay till the handing over of possession.

Appellate Mechanism:
- Any person aggrieved by any decision or order of the Authority may prefer an appeal to the Real Estate Appellate Tribunal within 60 days.
- Section 43(5) Pre-deposit Requirement: Where a promoter files an appeal against an order directing payment of amount or penalty, the promoter must deposit at least thirty per cent (30%) of the penalty, or the entire total amount to be paid to the allottee including interest before the appeal is entertained.`
  },

  {
    id: 'doc_marketing_lead_generation_guide',
    title: 'Real Estate Agency Marketing Operations: Lead Acquisition, RERA Ad Compliance & Cost per Deal',
    publisher: 'National Association of Realtors India (NAR-INDIA)',
    url: 'https://narindia.com/operations/agency_marketing_handbook.pdf',
    jurisdiction: 'Central',
    type: 'guide',
    category: 'Marketing, leads and operations',
    effectiveDate: '2024-01-01',
    lastReviewedDate: '2026-07-01',
    status: 'Current',
    reviewedBy: 'Santhosh (Compliance Lead)',
    reviewerRole: 'Operations & Compliance Specialist',
    reviewStatus: 'Reviewed',
    createdDate: '2026-04-15',
    rawContent: `1. RERA Compliance in Real Estate Advertising:
- Mandatory Disclosures: Under Section 11(2) of the RERA Act, every advertisement, digital landing page, hoarding, brochure, or social media promotion must prominently display:
  (a) The RERA registration number of the project;
  (b) The official state RERA website portal address;
  (c) The RERA registration number of the real estate agent/channel partner.
- No Misleading Superlatives: Real estate agents must not publish unauthorized renderings, inaccurate commute times (e.g. "5 minutes to airport" when actual drive is 35 minutes), or false amenities. Penalties for misleading ads can reach up to 5% of project cost under Section 60.

2. Lead Generation Channels & Unit Economics:
- Property Portals (MagicBricks, 99acres, Housing.com): Fixed monthly subscription tier (₹15,000 - ₹35,000/month). Delivers high-intent active property seekers. Conversion benchmark: 1.5% - 2.5% of verified leads close into deals within 60-90 days.
- Meta Ads (Facebook & Instagram Lead Forms): Cost per Lead (CPL) averages ₹250 - ₹650 for residential apartments in metros. Delivers volume, but requires immediate telecalling qualification within 5 minutes to prevent lead drop-off.
- Google Search Ads: Highest intent targeting keywords such as "2 BHK in Whitefield" or "flats for sale in Bandra". CPL averages ₹800 - ₹1,800. Conversion benchmark: 3% - 4%.
- Channel Partner Walk-in Days: Organizing exclusive site visits with developer support on weekends yields immediate bookings with zero ad inventory risk.

3. Standard Agency Operating Metrics:
- Lead-to-Site-Visit Ratio: Healthy benchmark is 10% - 15% (out of 100 leads, 10 to 15 physical site visits scheduled).
- Visit-to-Booking Ratio: Industry benchmark is 8% - 12% (out of 10 qualified site visits, 1 booking closed).
- Total Leads Required per Closed Deal: Typically 60 - 80 fresh leads per closed residential unit.`
  }
];
