import type { PassportData } from './passport-data';

/**
 * Pre-extracted reference passport data matching the user's provided
 * Tchibo FiTS Specification (Project 151546) & Bureau Veritas Test Report ((6825)298-0551).
 * Can be loaded as an instant sample in the AI PDF Auto-Fill dialog.
 */
export const EXTRACTED_TCHIBO_PASSPORT: PassportData = {
  general: {
    projectId: '151546',
    orderNo: '4300085070',
    version: '4 updated',
    completeness: 98,
    updatedDate: '30 Oct 2025',
    productName: "Men's Shorty Pyjamas, Modal",
    subtitle: 'Modal Single Jersey Sleepwear Set · Tchibo FiTS Certified',
    brand: 'Tchibo',
    season: 'SS26',
    category: 'Sleepwear & Lounge',
    status: 'VERIFIED',
    designDescription:
      'Short-sleeved V-neck top with self-fabric piping, 2 cm forward shoulder seam, paired with set-on waistband shorts featuring internal drawstring, side pockets, and bottom coverstitch.',
    weightGsm: 160,
    originCountry: 'Bangladesh',
    lifetimeYears: '4+ Years (Tested for 10+ wash/dry cycles)',
    carbonKg: 3.42,
    qrCodeSeed: 'https://tchibo.dpp.eu/p/151546-4300085070',
    qrCodeLab: 'BV-BD-(6825)298-0551-FITS',
    badges: ['Cotton made in Africa (CmiA)', 'OEKO-TEX Standard 100', 'Birla Livaeco Modal', 'BV Tested PASS'],
    articleNumbers: {
      uni: {
        S: '730801',
        M: '730798',
        L: '730802',
        XL: '730799',
        XXL: '730800',
      },
      aop: {
        S: '730793',
        M: '730794',
        L: '730796',
        XL: '730797',
        XXL: '730795',
      },
    },
    visuals: {
      cw1Name: 'Jadeite (Pantone 16-5304 TCX)',
      cw1Image: '',
      cw2Name: 'Dark Green (COLORO 097-36-06 / AOP 085-52-07)',
      cw2Image: '',
      aiModelInfo: 'Extracted via Gemini 3.8 Flash from Tchibo FiTS & Bureau Veritas Test Report',
      prompt: 'men shorty pyjamas modal single jersey Tchibo technical specification and test report',
      colors: 'Jadeite (Top/Bottom) · Dark Green (Top/Bottom) · AOP Geometric Hexagon Pattern',
    },
  },
  materials: {
    cotton: 48,
    modal: 47,
    elastane: 5,
    recycledContent: 0,
    fabricWeight: 160,
    tolerance: '±3% (ISO 1833 compliant)',
    yarnSources: {
      cottonCert: 'Cotton made in Africa (CmiA) certified spinning mill · Registered in SCOT tracking tool',
      modalCert: 'Nominated Modal: Birla Livaeco / Lenzing TENCEL™',
      elastaneCert: 'Nominated Elastane: creora® by Creora / LYCRA® / ROICA®',
    },
    labAnalysis: [
      { fiber: 'Cotton (CmiA)', labeled: '48.0%', lab: '49.3% (Avg A-D)' },
      { fiber: 'Modal (Birla)', labeled: '47.0%', lab: '46.8% (Avg A-D)' },
      { fiber: 'Elastane (creora®)', labeled: '5.0%', lab: '3.8% (Avg A-D)' },
    ],
    microfibreNote:
      'High-cellulosic composition (95% cotton + modal) substantially reduces synthetic microfiber shedding compared to standard polyester pyjamas.',
    svhcSubstances: [
      {
        substance: 'Extractable Heavy Metals (As, Cd, Pb, Hg, Cu, Cr, Co, Ni, Ba, Se)',
        cas: 'DIN EN 16711-2',
        component: 'Shell & Contrast Fabric',
        status: 'PASS (All ND)',
      },
      {
        substance: 'Azo Amines & Arylamine Salts (Splitting off Amines)',
        cas: 'EN ISO 14362-1:2017',
        component: 'Dyed Jersey & Threads',
        status: 'PASS (ND <5 mg/kg)',
      },
      {
        substance: 'Phthalates (DINP, DNOP, DEHP, DIDP, BBP, DBP, DIBP)',
        cas: 'EN ISO 14389',
        component: 'Elastic tape & prints',
        status: 'PASS (ND <50 mg/kg)',
      },
      {
        substance: 'Formaldehyde',
        cas: 'DIN EN ISO 14184-1',
        component: 'Shell & pocket bags',
        status: 'PASS (ND <16 mg/kg)',
      },
      {
        substance: 'Cyclic Siloxanes (D4, D5, D6)',
        cas: '556-67-2 / 541-02-6',
        component: 'Softener & finishing',
        status: 'PASS (ND <500 mg/kg)',
      },
      {
        substance: 'Chlorinated Paraffins (SCCP & MCCP)',
        cas: 'ISO 22818',
        component: 'Elastic & mobilon tape',
        status: 'PASS (ND <50 mg/kg)',
      },
    ],
  },
  measurements: {
    topFit:
      'V-neck single jersey top with self-fabric piping, overlap topstitch, continuous back necktape, forward shoulder seam (approx 2cm), and 3-thread bottom coverstitch at 2.5cm.',
    bottomFit:
      'Straight leg short with set-on waistband, 3.5cm elastic & drawstring tunnel inside, side pocket bartacks at 0.6cm width, and 3-thread coverstitch hem.',
    top: [
      { k: 'C', name: '1/2 Chest (2cm below armhole)', how: 'Measured straight 2cm below armhole', vals: { S: 50, M: 54, L: 58, XL: 62, XXL: 66 }, g: 'Chest' },
      { k: 'B', name: '1/2 Bottom Hem', how: 'Measured straight along bottom hem', vals: { S: 49, M: 53, L: 57, XL: 61, XXL: 65 }, g: 'Hem' },
      { k: 'STS', name: 'Shoulder to Shoulder', how: 'Distance between outer shoulder points', vals: { S: 46, M: 48, L: 50, XL: 52, XXL: 54 }, g: 'Shoulders' },
      { k: 'BL', name: 'Back Length', how: 'From highest shoulder point (HSP)', vals: { S: 73, M: 75, L: 77, XL: 79, XXL: 81 }, g: 'Length' },
      { k: 'SL', name: 'Sleeve Length', how: 'Along sleeve-fold', vals: { S: 21, M: 22, L: 23, XL: 24, XXL: 25 }, g: 'Sleeve' },
      { k: 'AS', name: 'Armhole Straight', how: 'Measured at right angle', vals: { S: 23, M: 24, L: 25, XL: 26, XXL: 27 }, g: 'Armhole' },
      { k: 'NO', name: 'Neck Opening', how: 'Measured straight seam to seam', vals: { S: 17.5, M: 18, L: 18.5, XL: 19, XXL: 19.5 }, g: 'Neck' },
      { k: 'NDF', name: 'Neck Drop Front', how: 'From HSP to front neckline', vals: { S: 16, M: 16.5, L: 17, XL: 17.5, XXL: 18 }, g: 'Neck' },
    ],
    bottom: [
      { k: 'WB', name: '1/2 Waistband Relaxed', how: 'Measured straight along edge', vals: { S: 36, M: 39, L: 42, XL: 45, XXL: 48 }, g: 'Waist' },
      { k: 'WBS', name: '1/2 Waistband Stretched', how: 'Minimum stretchability', vals: { S: 47, M: 50, L: 53, XL: 56, XXL: 59 }, g: 'Waist' },
      { k: 'H', name: '1/2 Hip', how: 'Measured straight at hip height', vals: { S: 51, M: 54, L: 57, XL: 60, XXL: 63 }, g: 'Hip' },
      { k: 'IL', name: 'Inseam Length', how: 'Along inseam', vals: { S: 14, M: 15, L: 16, XL: 17, XXL: 18 }, g: 'Inseam' },
      { k: 'T', name: '1/2 Thigh', how: 'From fold to fold (per sketch)', vals: { S: 32, M: 34, L: 36, XL: 38, XXL: 40 }, g: 'Thigh' },
      { k: 'FR', name: 'Front Rise', how: 'Along seam including waistband', vals: { S: 29, M: 30, L: 31, XL: 32, XXL: 33 }, g: 'Rise' },
      { k: 'BR', name: 'Back Rise', how: 'Along seam including waistband', vals: { S: 41.5, M: 42.5, L: 43.5, XL: 44.5, XXL: 45.5 }, g: 'Rise' },
      { k: 'CL', name: 'Drawcord Total Length', how: 'Visible length / total length', vals: { S: 140, M: 150, L: 160, XL: 170, XXL: 180 }, g: 'Drawcord' },
    ],
  },
  traceability: {
    percentage: 100,
    summary:
      'Complete Tier 1 to Tier 4 verified supply chain audit through SCOT (Sustainable Cotton Tracker) and Bureau Veritas Bangladesh inspection.',
    nodes: [
      {
        tier: 'Tier 1 — Garment Cut & Sew',
        date: 'Oct 2025',
        title: 'AKH Knitting & Dyeing Ltd.',
        subtitle: 'Plot # 130, DEPZ Extension Area, Ganakbari, Savar, Dhaka, Bangladesh',
        color: 'green',
        items: [
          { label: 'Facility', val: 'AKH Savar Unit 4' },
          { label: 'Certifications', val: 'Amfori BSCI Grade A · Accord / RSC Compliant' },
          { label: 'Auditor', val: 'Bureau Veritas Consumer Products (BD) Ltd.' },
          { label: 'Labour Standard', val: 'Fair wage, healthcare & free transport' },
        ],
      },
      {
        tier: 'Tier 2 — Fabric Knitting & Dyeing',
        date: 'Sep 2025',
        title: 'AKH Dyeing & Finishing Division',
        subtitle: 'Savar Industrial Area, Dhaka, Bangladesh',
        color: 'green',
        items: [
          { label: 'Process', val: 'Single jersey circular knitting (32x28 gauge)' },
          { label: 'Dyeing', val: 'Low-liquor reactive dye, Oeko-Tex Eco-Passport' },
          { label: 'Effluent Treatment', val: 'Biological ETP with 85% water recycling' },
          { label: 'Finishing', val: 'Mechanical compaction & eco-softener' },
        ],
      },
      {
        tier: 'Tier 3 — Yarn Spinning',
        date: 'Aug 2025',
        title: 'CmiA Registered Spinning Mills / Birla Cellulose',
        subtitle: 'Kharach & Bharuch Facilities (India) & SCOT Network',
        color: 'green',
        items: [
          { label: 'Yarn Construction', val: 'Ring spun combed Ne 34/1, 20 D (S-twist)' },
          { label: 'Modal Source', val: 'Birla Livaeco / FSC certified pulp' },
          { label: 'Tracking Tool', val: 'CmiA SCOT Account verified' },
          { label: 'Elastane', val: 'creora® spandex by Hyosung' },
        ],
      },
      {
        tier: 'Tier 4 — Raw Material Farming',
        date: 'Jun 2025',
        title: 'Cotton made in Africa (CmiA) Smallholders',
        subtitle: 'Sub-Saharan Africa CmiA Certified Farm Cooperatives',
        color: 'green',
        items: [
          { label: 'Agriculture', val: '100% Rainfed cotton (zero artificial irrigation)' },
          { label: 'GMO Policy', val: 'Strict zero genetically modified organisms (non-GMO)' },
          { label: 'Smallholder Income', val: 'Fair pricing & agricultural training' },
          { label: 'Cellulose Origin', val: 'FSC/PEFC sustainably managed wood plantations' },
        ],
      },
    ],
  },
  quality: {
    rslStandards: 'Tchibo RSL Category 1 (v1/2024), FiTS dated 13 Aug 2025 & EU REACH Annex XVII',
    rslItems: [
      { name: 'Formaldehyde (DIN EN ISO 14184-1)', result: 'PASS — ND (<16 mg/kg) vs limit 75' },
      { name: 'pH Value (EN ISO 3071)', result: 'PASS — 5.5 to 6.5 vs limit 4.0–7.5' },
      { name: 'Extractable Heavy Metals (DIN EN 16711-2)', result: 'PASS — All metals (As, Cd, Pb, Hg, Cu, Cr, Ni, Ba, Se) ND' },
      { name: 'Azo Colorants & Amines (EN ISO 14362-1)', result: 'PASS — ND (<5 mg/kg) vs limit 20' },
      { name: 'Phthalates (EN ISO 14389)', result: 'PASS — ND (<50 mg/kg) vs limit 1000 sum' },
      { name: 'Cyclic Siloxanes (D4, D5, D6)', result: 'PASS — ND (<500 mg/kg) vs limit 1000' },
      { name: 'Chlorinated Paraffins (SCCP / MCCP)', result: 'PASS — ND (<50 mg/kg) vs limit 1000' },
      { name: 'Odour Test (SNV 195651)', result: 'PASS — Grade 1 (No abnormal odour) vs limit Grade 3' },
    ],
    labCards: [
      {
        std: 'DIN EN ISO 105 C06',
        title: 'Colour Fastness to Washing',
        val: 'Grade 4–5',
        subVal: 'Colour Change & Staining (PASS)',
        desc: 'Hand wash at 40°C in 0.4% ECE reference detergent with 10 steel balls. Zero color fading on body & contrast.',
        hint: 'Exceeds Tchibo requirement of Grade 4',
      },
      {
        std: 'DIN EN ISO 105 E01',
        title: 'Colour Fastness to Water',
        val: 'Grade 4–5',
        subVal: 'Water Immersion (PASS)',
        desc: 'Tested against acetate, cotton, nylon, polyester, acrylic, and wool multifixture strips.',
        hint: 'Highest performance bracket',
      },
      {
        std: 'DIN EN ISO 105 X12',
        title: 'Colour Fastness to Rubbing',
        val: 'Dry 4–5 / Wet 4–5',
        subVal: 'Dry & Wet Crockmeter (PASS)',
        desc: 'Both lengthwise and widthwise rubbing cycles resulted in minimal to no dye transfer.',
        hint: 'Exceeds requirement of Grade 4',
      },
      {
        std: 'DIN EN ISO 105 B02',
        title: 'Colour Fastness to Light',
        val: 'Grade 4',
        subVal: 'Xenon Arc Lamp (PASS)',
        desc: 'Evaluated under simulated sunlight conditions; colors retain original vibrancy without fading.',
        hint: 'Complies with European retail standards',
      },
      {
        std: 'DIN EN ISO 105-E04',
        title: 'Colour Fastness to Perspiration',
        val: 'Grade 4–5',
        subVal: 'Acidic & Alkaline Perspiration (PASS)',
        desc: 'Tested in both synthetic acid and alkaline sweat solutions without staining adjacent fibers.',
        hint: 'Optimal comfort for sleepwear garments',
      },
      {
        std: 'ISO 1833',
        title: 'Quantitative Fibre Composition',
        val: '48/47/5 Blend',
        subVal: 'Cotton 49.3% · Modal 46.8% · Elastane 3.8%',
        desc: 'Fibre tolerance is well within statutory ±3% European regulations (EU Regulation No. 1007/2011).',
        hint: 'Perfect match with customer label declaration',
      },
    ],
  },
  care: {
    wash: '40°C machine wash with gentle cycle',
    bleach: 'Do not bleach (oxygen or chlorine)',
    dry: 'Do not tumble dry (line dry in shade)',
    iron: 'Iron low heat (max 110°C, iron inside out)',
    dryClean: 'Do not dry clean',
    labelWording:
      'Wir empfehlen Colorwaschmittel / Colour detergent recommended / Mit ähnlichen Farben waschen / Wash with similar colours / Laver avec des couleurs similaires / Renkli çamaşır deterjanı kullanmanızı tavsiye ederiz / Prát s podobnými barvami.',
  },
  circularity: {
    tips: [
      {
        emoji: '💧',
        title: 'Wash Cool & Full',
        text: 'Washing at 30°C or 40°C with similar dark colours preserves modal softness and conserves up to 45% electricity per wash cycle.',
      },
      {
        emoji: '🌬️',
        title: 'Air Dry Flat',
        text: 'Line drying modal jersey prevents elastane heat-breakdown, eliminating unwanted shrinkage and keeping shape for years.',
      },
      {
        emoji: '🪡',
        title: 'Simple Seam Repair',
        text: 'The 4-thread overlock seams and waistband drawstring tunnel can be easily re-threaded with standard cotton thread if needed.',
      },
    ],
    upcycleTitle: 'Sleepwear to Soft Loungewear or Reusable Sleep Mask',
    upcycleSubtitle: 'Modal single jersey is exceptionally soft on sensitive skin',
    upcycleImage: '',
    upcycleSteps: [
      {
        title: 'Step 1: Reusable Travel Pouch',
        text: 'Cut a 20x25cm panel from the shorts body. Fold and sew three sides, utilizing the original drawstring as a cinch cord.',
      },
      {
        title: 'Step 2: Gentle Hair Scrunchies',
        text: 'Cut remaining jersey into 8x30cm strips. Thread elastic band through and sew ends for snag-free sleep scrunchies.',
      },
      {
        title: 'Step 3: Textile-to-Textile Mechanical Recycling',
        text: 'When worn beyond repair, drop off at any Tchibo textile takeback bin for closed-loop cellulosic fiber regeneration.',
      },
    ],
    fibreRecyclingFacts: [
      '95% natural cellulosic composition (cotton + modal) allows high-yield mechanical and chemical recycling into new viscose or lyocell pulp.',
      'Elastane content is restricted to <5% to ensure full compatibility with emerging circular sorting and shredding facilities.',
    ],
  },
  environmental: {
    totalCarbon: 3.42,
    carbonBreakdown: [
      { label: 'CmiA Cotton & Wood Pulp', value: 38, color: '#2E6B4F' },
      { label: 'Knitting, Dyeing & Finishing', value: 29, color: '#4A9B71' },
      { label: 'Garment Assembly (AKH)', value: 16, color: '#8CB89F' },
      { label: 'Sea Freight & Logistics', value: 11, color: '#C49A45' },
      { label: 'Retail & Consumer Use', value: 6, color: '#8C827A' },
    ],
    waterUsage: {
      value: 165,
      max: 1200,
      sub: 'CmiA cotton requires zero artificial irrigation; dyeing operates on low-liquor ratio machinery',
    },
    renewableEnergy: {
      value: 74,
      max: 100,
      sub: 'Facility powered by on-site rooftop solar and biomass-assisted co-generation',
    },
    recycledPackaging: {
      value: 92,
      max: 100,
      sub: 'GOTS compliant packaging; 100% post-consumer recycled polybag and FSC kraft hangtags',
    },
    packagingRecyclability: 98,
    packagingMaterials: 'Single-polymer LDPE polybag (#4) with water-based non-toxic inks + FSC paper hangtag',
    euPolicyNote: 'Fully conforms with EU Ecodesign for Sustainable Products Regulation (ESPR) and Corporate Sustainability Due Diligence Directive (CSDDD).',
  },
  compliance: {
    certifications: [
      { name: 'Cotton made in Africa (CmiA)', scope: 'Sustainable agricultural practices & farmer welfare', status: 'Certified & SCOT Verified' },
      { name: 'Bureau Veritas Lab Inspection', scope: 'Harmful substances & physical durability (Report (6825)298-0551)', status: 'Full PASS' },
      { name: 'EU REACH Regulation (EC 1907/2006)', scope: 'SVHC declaration: <0.1% for all components & packaging', status: 'Compliant' },
      { name: 'Tchibo FiTS RSL Category 1', scope: 'Restricted Substances List v1/2024 compliance', status: 'Approved' },
    ],
    salesChannel: 'Tchibo E-Commerce & Retail Stores',
    availableFrom: 'Spring / Summer 2026',
    usageClass: 'Apparel Class II (Direct Skin Contact)',
    afterSale: 'Tchibo 30-Day Free Return & Customer Guarantee',
    issuer: 'Tchibo GmbH · Hamburg, Germany',
    markets: 'Germany, Austria, Czech Republic, Poland, Slovakia, Hungary, Switzerland, Turkey',
  },
};
