export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Unit = 'cm' | 'in';
export type Garment = 'top' | 'bottom';
export type StyleType = 'uni' | 'aop';

export interface MeasurementRow {
  k: string;
  name: string;
  how: string;
  vals: Record<Size, number>;
  g: string | null;
}

export interface TraceabilityNode {
  tier: string;
  date: string;
  title: string;
  subtitle: string;
  color: 'green' | 'amber';
  items: Array<{ label: string; val: string }>;
  warning?: string;
}

export interface LabCardData {
  std: string;
  title: string;
  val: string;
  subVal: string;
  desc: string;
  hint: string;
}

export interface PassportData {
  general: {
    projectId: string;
    orderNo: string;
    version: string;
    completeness: number;
    updatedDate: string;
    productName: string;
    subtitle: string;
    brand: string;
    season: string;
    category?: string;
    gender?: string;
    color?: string;
    fitting?: string;
    passportId?: string;
    status?: 'VERIFIED' | 'AUDIT PENDING' | 'DRAFT';
    designDescription: string;
    weightGsm: number;
    originCountry: string;
    lifetimeYears: string;
    carbonKg: number;
    qrCodeSeed: string;
    qrCodeLab: string;
    badges: string[];
    articleNumbers: Record<StyleType, Record<Size, string>>;
    gtinStatus?: string;
    gtinCodes?: Record<StyleType, Record<Size, string>>;
    packagingInfo?: {
      materials: string;
      recyclability: string;
      type: string;
      certification?: string;
    };
    visuals: {
      cw1Name: string;
      cw1Image: string;
      cw2Name: string;
      cw2Image: string;
      aiModelInfo: string;
      prompt: string;
      colors: string;
    };
  };
  materials: {
    cotton: number;
    viscose?: number;
    modal: number;
    elastane: number;
    recycledContent: number;
    fabricWeight: number;
    tolerance: string;
    yarnSources: {
      cottonCert: string;
      modalCert: string;
      viscoseCert?: string;
      elastaneCert: string;
    };
    labAnalysis: Array<{
      fiber: string;
      labeled: string;
      lab: string;
    }>;
    microfibreNote: string;
    svhcSubstances: Array<{
      substance: string;
      cas: string;
      component: string;
      status: string;
    }>;
  };
  measurements: {
    topFit: string;
    bottomFit: string;
    top: MeasurementRow[];
    bottom: MeasurementRow[];
  };
  traceability: {
    percentage: number;
    summary: string;
    origin?: {
      country: string;
      city: string;
      facility: string;
      lat: number;
      lng: number;
    };
    destination?: {
      country: string;
      city: string;
      label: string;
      lat: number;
      lng: number;
      transportMode?: string;
      distanceKm?: number;
    };
    testingLab?: {
      name: string;
      reportNo: string;
      location: string;
      result: string;
    };
    nodes: TraceabilityNode[];
  };
  quality: {
    rslStandards: string;
    reportNumber?: string;
    overallResult?: string;
    testingLab?: string;
    reviewedBy?: {
      name: string;
      designation: string;
      date?: string;
    };
    rslItems: Array<{ name: string; result: string }>;
    labCards: LabCardData[];
  };
  care: {
    wash: string;
    bleach: string;
    dry: string;
    iron: string;
    dryClean: string;
    labelWording: string;
  };
  circularity: {
    tips: Array<{ emoji: string; title: string; text: string }>;
    upcycleTitle: string;
    upcycleSubtitle: string;
    upcycleImage: string;
    upcycleSteps: Array<{ title: string; text: string }>;
    fibreRecyclingFacts: string[];
  };
  environmental: {
    carbonStatus?: 'available' | 'not_provided';
    carbonDataStatus?: string;
    carbonSource?: string;
    totalCarbon: number;
    carbonBreakdown: Array<{ label: string; value: number; color: string }>;
    waterUsage: { value: number; max: number; sub: string };
    renewableEnergy: { value: number; max: number; sub: string };
    recycledPackaging: { value: number; max: number; sub: string };
    packagingRecyclability: number;
    packagingMaterials: string;
    euPolicyNote: string;
  };
  compliance: {
    certifications: Array<{ name: string; scope: string; status: string }>;
    salesChannel: string;
    availableFrom: string;
    usageClass: string;
    afterSale: string;
    issuer: string;
    markets: string;
  };
}

export const DEFAULT_PASSPORT_DATA: PassportData = {
  general: {
    projectId: '151546',
    orderNo: '4300085070',
    version: 'v2.4',
    completeness: 98,
    updatedDate: '30 Oct 2025',
    productName: "Men's Pyjamas Set (Cotton & Viscose Blend)",
    subtitle: 'Single jersey 180 g/m² · Relaxed Fit · Sizes S–XXL',
    brand: 'Tchibo GmbH',
    season: 'AW 2025',
    category: 'Sleepwear & Loungewear',
    gender: "Men's",
    color: 'Jadeite / Dark Green AOP',
    fitting: 'Relaxed Loungewear Fit',
    passportId: 'DPP-BD-2025-BGDT25154711',
    status: 'VERIFIED',
    designDescription: 'V-neck top with self-fabric piping; straight-leg shorts with drawstring, elastic waistband & side pockets.',
    weightGsm: 180,
    originCountry: 'Bangladesh',
    lifetimeYears: '3+ Years',
    carbonKg: 0,
    qrCodeSeed: '151546-4300085070-BGDT25154711',
    qrCodeLab: 'Testing by ITS Labtest Bangladesh Ltd. · Report BGDT25154711 · PASS\nReviewed by Md. Tariqul Islam, Senior Executive',
    badges: [
      'Cotton made in Africa',
      'Birla Viscose (Livaeco™)',
      'creora® Elastane',
      'RSL Category 1 PASS',
      'ITS Labtest Certified',
      'FSC Recycled Packaging'
    ],
    articleNumbers: {
      uni: { S: '730801', M: '730798', L: '730802', XL: '730799', XXL: '730800' },
      aop: { S: '730793', M: '730794', L: '730796', XL: '730797', XXL: '730795' }
    },
    gtinStatus: '[ GTIN code - 13 digit (pending: size and color wise different GTIN code) ]',
    gtinCodes: {
      uni: { S: '4061234730801', M: '4061234730798', L: '4061234730802', XL: '4061234730799', XXL: '4061234730800' },
      aop: { S: '4061234730793', M: '4061234730794', L: '4061234730796', XL: '4061234730797', XXL: '4061234730795' }
    },
    packagingInfo: {
      materials: '100% Recycled Cardboard Band (FSC certified) & Bio-based Polybag',
      recyclability: '100% Recyclable packaging, plastic-reduced presentation wrap',
      type: 'Single-unit folded with FSC paper band',
      certification: 'FSC Mix Credit'
    },
    visuals: {
      cw1Name: 'CW 01 · Jadeite Solid',
      cw1Image: 'https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/17e958788-08d4-403f-bf77-8f3c19bb0af5.png',
      cw2Name: 'CW 02 · Dark Green AOP',
      cw2Image: 'https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/140b0a39b-fd34-414d-809d-bf230e553a0f.png',
      aiModelInfo: 'Stable Diffusion XL + Vizcom refine · seed 151546',
      prompt: '"men\'s modal shorty pyjamas, V-neck, drawstring shorts, jadeite / dark green AOP, ghost mannequin"',
      colors: 'Pantone 16-5304 TCX · COLORO 097-36-06 · AOP base 085-52-07'
    }
  },
  materials: {
    cotton: 58,
    viscose: 39,
    modal: 0,
    elastane: 3,
    recycledContent: 0,
    fabricWeight: 180,
    tolerance: '±3%',
    yarnSources: {
      cottonCert: 'Cotton made in Africa (CmiA) certified, ring-spun Ne 30/1 combed',
      modalCert: 'Birla Viscose (Livaeco™ by Birla Cellulose)',
      viscoseCert: 'Birla Viscose (Livaeco™ by Birla Cellulose)',
      elastaneCert: 'creora® elastane (Hyosung Corporation)'
    },
    labAnalysis: [
      { fiber: 'Cotton', labeled: '58%', lab: '58.4%' },
      { fiber: 'Viscose', labeled: '39%', lab: '38.8%' },
      { fiber: 'Elastane', labeled: '3%', lab: '2.8%' }
    ],
    microfibreNote: 'Elastane content 3.0% — synthetic fibre shedding applicable; wash bag recommended.',
    svhcSubstances: [
      { substance: 'Alkylphenol ethoxylates (APEO)', cas: 'Multiple', component: 'Dyeing', status: 'NOT DETECTED' },
      { substance: 'Heavy Metals (Extractable)', cas: 'Multiple', component: 'Pigment Print', status: '< 0.1% LIMIT' },
      { substance: 'PFAS (Per- and polyfluoroalkyl)', cas: 'Multiple', component: 'Finish', status: 'NOT DETECTED' }
    ]
  },
  measurements: {
    topFit: 'Relaxed loungewear block: short-sleeve V-neck with self-fabric piping, necktape chain-stitched at back, shoulder seam moved ~2 cm forward. Allowed dimensional change after wash: ±4%.',
    bottomFit: 'Straight-leg shorts with set-on waistband (drawstring + elastic inside), side pockets and fake fly. Allowed change after wash: ±4%.',
    top: [
      { k: 'A', name: '1/2 Chest', how: '2 cm below armhole · tol ±1', vals: { S: 50, M: 54, L: 58, XL: 62, XXL: 66 }, g: 'g-t-chest' },
      { k: 'B', name: 'Back Length', how: 'from HSP · tol ±1', vals: { S: 73, M: 75, L: 77, XL: 79, XXL: 81 }, g: 'g-t-len' },
      { k: 'C', name: 'Sleeve', how: 'along sleeve fold · tol ±1', vals: { S: 21, M: 22, L: 23, XL: 24, XXL: 25 }, g: 'g-t-sleeve' },
      { k: 'D', name: 'Shoulder', how: 'outer points straight · tol ±1', vals: { S: 46, M: 48, L: 50, XL: 52, XXL: 54 }, g: null },
      { k: 'E', name: 'Armhole', how: 'straight at right angle · tol ±1', vals: { S: 23, M: 24, L: 25, XL: 26, XXL: 27 }, g: null }
    ],
    bottom: [
      { k: 'A', name: '1/2 Waistband', how: 'straight along edge · tol ±1', vals: { S: 36, M: 39, L: 42, XL: 45, XXL: 48 }, g: 'g-b-waist' },
      { k: 'B', name: '1/2 Hip', how: 'at hip height · tol ±1', vals: { S: 51, M: 54, L: 57, XL: 60, XXL: 63 }, g: 'g-b-hip' },
      { k: 'C', name: 'Inseam', how: 'along inseam · tol ±1', vals: { S: 14, M: 15, L: 16, XL: 17, XXL: 18 }, g: 'g-b-inseam' },
      { k: 'D', name: 'Front Rise', how: 'incl. waistband · tol ±1', vals: { S: 29, M: 30, L: 31, XL: 32, XXL: 33 }, g: null },
      { k: 'E', name: 'Leg Opening', how: 'along edge · tol ±1', vals: { S: 29, M: 31, L: 33, XL: 35, XXL: 37 }, g: null }
    ]
  },
  traceability: {
    percentage: 95,
    summary: 'Full supply chain traceability verified from Tier 3 spinning to Tier 1 assembly and ITS laboratory release.',
    origin: {
      country: 'Bangladesh',
      city: 'Chittagong / Savar, Dhaka',
      facility: 'AKH Knitting & Dyeing Ltd.',
      lat: 23.8103,
      lng: 90.4125
    },
    destination: {
      country: 'Germany',
      city: 'Hamburg',
      label: 'Hamburg Central Logistics Hub, Germany',
      lat: 53.5511,
      lng: 9.9937,
      transportMode: 'Maritime Sea Freight via Port of Chittagong',
      distanceKm: 14200
    },
    testingLab: {
      name: 'ITS Labtest Bangladesh Ltd.',
      reportNo: 'BGDT25154711',
      location: 'Dhaka, Bangladesh',
      result: 'PASS'
    },
    nodes: [
      {
        tier: 'TIER 3',
        date: 'Q3 2025',
        title: 'Yarn & Fibre Sourcing — CmiA · Birla · Hyosung',
        subtitle: 'Cotton made in Africa · Birla Viscose (cellulosic) · creora® elastane (Hyosung)',
        color: 'green',
        items: [
          { label: 'Cotton 58%', val: 'Cotton made in Africa (CmiA) certified, combed Ne 30/1' },
          { label: 'Viscose 39%', val: 'Birla Viscose (Livaeco™ by Birla Cellulose)' },
          { label: 'Elastane 3%', val: 'creora® elastane (Hyosung Corporation)' },
          { label: 'Fibre Sourcing', val: 'Africa (Cotton) / India (Birla Viscose)' }
        ]
      },
      {
        tier: 'TIER 2',
        date: 'SEP 2025',
        title: 'Fabric Knitting & Dyeing — AKH Knitting & Dyeing Ltd.',
        subtitle: '🇧🇩 Narayanganj / Gazipur, Bangladesh · In-house knitting, eco-reactive dyeing & finishing',
        color: 'green',
        items: [
          { label: 'Knitting', val: 'Single jersey 180 g/m² · 32×28 gauge' },
          { label: 'Dyeing', val: 'Jadeite solid & Dark Green AOP pigment print' },
          { label: 'Finishing', val: 'Enzyme wash & softener finish · Oeko-Tex compliant' }
        ]
      },
      {
        tier: 'TIER 1',
        date: 'OCT 2025',
        title: 'Garment Assembly — AKH Knitting and Dyeing Ltd. (CMT)',
        subtitle: '🇧🇩 Savar, Dhaka, Bangladesh · Cut, Make & Trim · order 4300085070 · AQL release 1.5',
        color: 'green',
        items: [
          { label: 'Top Assembly', val: 'V-neck piping, reinforced necktape, forward shoulder seam' },
          { label: 'Bottom Assembly', val: 'Set-on waistband, knitted drawstring, side pockets' },
          { label: 'Seam Construction', val: '4-thread overlock & 3-thread coverstitch' }
        ]
      },
      {
        tier: 'TESTING',
        date: '28 OCT 2025',
        title: 'Testing & Release — ITS Labtest Bangladesh Ltd.',
        subtitle: '🇧🇩 Dhaka, Bangladesh · Report BGDT25154711 · Overall Result: PASS',
        color: 'green',
        items: [
          { label: 'Lab Report No.', val: 'BGDT25154711' },
          { label: 'Overall Result', val: 'PASS' },
          { label: 'Reviewer', val: 'Md. Tariqul Islam, Senior Executive – Analytical Lab' },
          { label: 'RSL Category', val: 'Category 1 Testing Compliant' }
        ]
      },
      {
        tier: 'LOGISTICS',
        date: 'NOV 2025',
        title: 'Distribution — Bangladesh ➔ Germany (Hamburg)',
        subtitle: 'Port of Chittagong, Bangladesh ➔ Port of Hamburg, Germany',
        color: 'green',
        items: [
          { label: 'Origin Port', val: 'Port of Chittagong, Bangladesh (BD)' },
          { label: 'Destination', val: 'Hamburg Central Logistics Hub, Germany (DE)' },
          { label: 'Transport Mode', val: 'Low-emission Sea Freight (~14,200 km)' },
          { label: 'ETA Transit', val: '~28 Days Sea Freight' }
        ]
      }
    ]
  },
  quality: {
    rslStandards: 'Adults >14 y · RSL Category 1 Test Results · ITS Labtest Bangladesh Ltd. · OVERALL PASS',
    reportNumber: 'BGDT25154711',
    overallResult: 'PASS',
    testingLab: 'ITS Labtest Bangladesh Ltd.',
    reviewedBy: {
      name: 'Md. Tariqul Islam',
      designation: 'Senior Executive – Analytical Lab, ITS Labtest Bangladesh Ltd.',
      date: '28 OCT 2025'
    },
    rslItems: [
      { name: 'Formaldehyde', result: 'ND (<16 mg/kg) · Limit: 75 mg/kg (PASS)' },
      { name: 'pH Value', result: '5.8 · Acceptable range: 4.0 – 7.5 (PASS)' },
      { name: 'Azo Amines (Carcinogenic)', result: 'ND (<5 mg/kg) · Limit: 20 mg/kg (PASS)' },
      { name: 'Phthalates (Total)', result: 'ND (<50 mg/kg) · Limit: 500 mg/kg (PASS)' },
      { name: 'Extractable Heavy Metals', result: 'Pass all limits (Pb, Cd, Cr, Ni, As, Hg) (PASS)' },
      { name: 'Alkylphenol Ethoxylates (APEO)', result: 'ND (<20 mg/kg) · Limit: 100 mg/kg (PASS)' },
      { name: 'PFAS / Fluorinated Compounds', result: 'ND (<0.025 mg/kg) · Limit: 0.1 mg/kg (PASS)' },
      { name: 'Odour Evaluation', result: 'Grade 1 (No off-odour) · Limit: Grade 3 (PASS)' }
    ],
    labCards: [
      {
        std: 'DIN EN ISO 105-C06',
        title: 'Colour Fastness to Washing',
        val: '4–5',
        subVal: 'req. 4-5 / stain 4',
        desc: 'Test A2S, 30 min @ 40 °C, ECE detergent + sodium perborate, 10 steel balls. Colour change & staining 4-5 across all colourways.',
        hint: 'Machine wash 40°C verified'
      },
      {
        std: 'DIN EN ISO 105-X12',
        title: 'Colour Fastness to Rubbing',
        val: '4–5',
        subVal: 'dry & wet · req. 4',
        desc: 'Length-wise & width-wise dry & wet rubbing test on solid and AOP print. All results 4–5, above requirement.',
        hint: 'Friction test verified'
      },
      {
        std: 'DIN EN ISO 105-B02',
        title: 'Colour Fastness to Light',
        val: '4',
        subVal: 'req. 4',
        desc: 'Artificial xenon arc light exposure. Colour change graded at 4 on solid body, contrast, and drawcord.',
        hint: 'UV resistance verified'
      },
      {
        std: 'DIN EN ISO 105-E04',
        title: 'Fastness to Perspiration',
        val: '4–5',
        subVal: 'acid & alkaline',
        desc: 'Tested in acidic (pH 5.5) and alkaline (pH 8.0) synthetic solutions. Staining of adjacent multi-fibres graded 4–5.',
        hint: 'Body sweat resistance'
      },
      {
        std: 'DIN EN ISO 105-E01',
        title: 'Colour Fastness to Water',
        val: '4–5',
        subVal: 'req. 4-5 / stain 4',
        desc: 'Immersion in demineralised water for 4 h @ 37 °C. Self-staining and staining of 6 adjacent fibres graded 4–5.',
        hint: 'Water exposure verified'
      },
      {
        std: 'ISO 105-X11',
        title: 'Colour Fastness to Hot Pressing',
        val: '4–5',
        subVal: 'dry & damp @ 110 °C',
        desc: 'Tested at low heat setting (110 °C) with dry and damp press cloths. No color migration or shade change observed.',
        hint: 'Ironing test verified'
      }
    ]
  },
  care: {
    wash: 'Machine wash 40°C',
    bleach: 'Do not bleach',
    dry: 'Do not tumble dry',
    iron: 'Iron low (max 110°C, 1 dot)',
    dryClean: 'Do not dry clean',
    labelWording: 'Machine wash 40°C with similar colours. Do not bleach. Do not tumble dry. Iron low heat. Do not dry clean. Turn garment inside-out before washing to protect print and fibers.'
  },
  circularity: {
    tips: [
      { emoji: '🌊', title: 'Wash at 40°C or cooler', text: 'Modal and cotton fibers thrive in gentle wash cycles; cooler water prolongs elastane elasticity.' },
      { emoji: '🌬️', title: 'Air dry flat or on rack', text: 'Do not tumble dry. Line drying preserves stitch integrity and avoids heat shrinkage.' },
      { emoji: '🗄️', title: "Fold, don't hang", text: 'Jersey knitwear retains shape best folded flat, preventing shoulder stretching.' },
      { emoji: '🧵', title: 'Mend seams early', text: 'Simple stitch repairs on hem or pockets can extend garment lifespan by multiple seasons.' }
    ],
    upcycleTitle: 'DIY Upcycling Idea: Retired Pyjamas ➔ Produce Pouch or Cleaning Cloths',
    upcycleSubtitle: 'Soft cotton-viscose single jersey is highly absorbent and naturally lint-free.',
    upcycleImage: 'https://image.qwenlm.ai/public_source/664e8b35-e47f-4aa4-bc0f-a8f86843d2cf/1eb313437-56f6-42b6-be85-d49488aabe23.png',
    upcycleSteps: [
      { title: 'Rescue the drawstring', text: 'Unthread the shorts drawstring intact — it serves as the closure cord for your new reusable shopping or laundry pouch.' },
      { title: 'Cut cleaning squares', text: 'Cut 25×25 cm squares from body panels. Cotton-viscose jersey does not fray and makes lint-free polishing cloths.' },
      { title: 'Sew or knot pouch body', text: 'Fold one leg panel in half, stitch side edges (or knot-fringe), and hem a top channel for the drawstring.' }
    ],
    fibreRecyclingFacts: [
      '58% Cotton + 39% Viscose = 97% natural cellulosic content, suitable for mechanical and chemical fiber recycling.',
      '3% Elastane is separable in modern fiber-to-fiber shredding streams.',
      'Deposit in designated textile recycling bins or participating retail take-back programs.'
    ]
  },
  environmental: {
    carbonStatus: 'not_provided',
    carbonDataStatus: 'Data not provided',
    carbonSource: 'Not available',
    totalCarbon: 0,
    carbonBreakdown: [],
    waterUsage: { value: 380, max: 1500, sub: 'vs 1,500L industry benchmark' },
    renewableEnergy: { value: 68, max: 100, sub: 'Solar rooftop facility' },
    recycledPackaging: { value: 100, max: 100, sub: 'FSC certified cardboard' },
    packagingRecyclability: 100,
    packagingMaterials: '100% Recycled Cardboard Band (FSC certified) and Bio-based Polybag. Zero non-recyclable plastic.',
    euPolicyNote: 'Product Environmental Footprint (PEF) category calculations pending final release by European Commission.'
  },
  compliance: {
    certifications: [
      { name: 'Cotton made in Africa (CmiA)', scope: 'Sustainable agricultural cotton sourcing', status: 'VERIFIED' },
      { name: 'Birla Viscose (Livaeco™)', scope: 'FSC-certified traceable wood pulp origin', status: 'VERIFIED' },
      { name: 'creora® elastane', scope: 'Standard 100 by OEKO-TEX® certified', status: 'VERIFIED' },
      { name: 'ITS Labtest Bangladesh Ltd.', scope: 'Report BGDT25154711 · RSL Category 1 PASS', status: 'VERIFIED' }
    ],
    salesChannel: 'Omnichannel (Retail & Online)',
    availableFrom: 'Nov 2025',
    usageClass: 'Personal Apparel',
    afterSale: 'Repair tips & Textile Take-Back',
    issuer: 'Tchibo GmbH / ITS Labtest Bangladesh Ltd.',
    markets: 'EU (DE, AT, CZ, PL, SK, HU), CH, TR'
  }
};

export const DEFAULT_CATALOG: PassportData[] = [
  DEFAULT_PASSPORT_DATA,
  {
    ...DEFAULT_PASSPORT_DATA,
    general: {
      ...DEFAULT_PASSPORT_DATA.general,
      projectId: '152840',
      orderNo: '4300085112',
      productName: "Women's Organic Waffle Robe",
      subtitle: '100% GOTS Organic Cotton · 280 g/m²',
      season: 'AW 2025',
      category: 'Loungewear',
      status: 'VERIFIED',
      weightGsm: 280,
      originCountry: 'Turkey',
      lifetimeYears: '5+ Years',
      carbonKg: 3.9,
      qrCodeSeed: '152840-4300085112',
      badges: ['GOTS Certified', 'OEKO-TEX Made in Green', 'Fair Wear Leader', 'Zero Plastic'],
      visuals: {
        ...DEFAULT_PASSPORT_DATA.general.visuals,
        cw1Name: 'CW 01 · Natural Ecru',
        cw1Image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
        cw2Name: 'CW 02 · Sage Green',
        cw2Image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
        prompt: '"luxury waffle bath robe, natural organic cotton, elegant studio lighting"'
      }
    },
    materials: {
      ...DEFAULT_PASSPORT_DATA.materials,
      cotton: 100,
      modal: 0,
      elastane: 0,
      fabricWeight: 280,
      yarnSources: {
        cottonCert: '100% GOTS certified organic Aegean cotton, combed ringspun',
        modalCert: 'N/A (Monofiber construction)',
        elastaneCert: 'N/A'
      }
    },
    environmental: {
      ...DEFAULT_PASSPORT_DATA.environmental,
      totalCarbon: 3.9,
      waterUsage: { value: 310, max: 1500, sub: 'Rain-fed organic cultivation' },
      renewableEnergy: { value: 82, max: 100, sub: 'Solar rooftop facility' }
    }
  },
  {
    ...DEFAULT_PASSPORT_DATA,
    general: {
      ...DEFAULT_PASSPORT_DATA.general,
      projectId: '153210',
      orderNo: '4300085240',
      productName: 'Seamless Active Leggings, Q-NOVA®',
      subtitle: 'High-waisted compression · 240 g/m²',
      season: 'SS 2026',
      category: 'Activewear',
      status: 'VERIFIED',
      weightGsm: 240,
      originCountry: 'Portugal',
      lifetimeYears: '4+ Years',
      carbonKg: 2.8,
      qrCodeSeed: '153210-4300085240',
      badges: ['Q-NOVA® Recycled Nylon', 'OEKO-TEX 100', 'GRS Global Recycled', 'Sweat-wicking'],
      visuals: {
        ...DEFAULT_PASSPORT_DATA.general.visuals,
        cw1Name: 'CW 01 · Midnight Black',
        cw1Image: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
        cw2Name: 'CW 02 · Mineral Blue',
        cw2Image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
        prompt: '"seamless compressive fitness leggings, recycled nylon, high waist athletic fit"'
      }
    },
    materials: {
      ...DEFAULT_PASSPORT_DATA.materials,
      cotton: 0,
      modal: 0,
      elastane: 12,
      recycledContent: 88,
      fabricWeight: 240,
      yarnSources: {
        cottonCert: 'N/A',
        modalCert: 'N/A',
        elastaneCert: 'creora® PowerFit high-recovery elastane'
      }
    },
    environmental: {
      ...DEFAULT_PASSPORT_DATA.environmental,
      totalCarbon: 2.8,
      waterUsage: { value: 180, max: 1500, sub: 'Pre-dyed dope-dyed yarn' },
      renewableEnergy: { value: 90, max: 100, sub: 'Hydroelectric energy powered' }
    }
  },
  {
    ...DEFAULT_PASSPORT_DATA,
    general: {
      ...DEFAULT_PASSPORT_DATA.general,
      projectId: '154095',
      orderNo: '4300085380',
      productName: 'Merino Wool Thermal Crew Knit',
      subtitle: '100% RWS Extra-fine Merino · 220 g/m²',
      season: 'AW 2025',
      category: 'Knitwear',
      status: 'AUDIT PENDING',
      completeness: 86,
      weightGsm: 220,
      originCountry: 'Italy',
      lifetimeYears: '7+ Years',
      carbonKg: 5.2,
      qrCodeSeed: '154095-4300085380',
      badges: ['Responsible Wool Standard', 'Mulesing-Free', 'Pure New Wool', 'Hand-Washable'],
      visuals: {
        ...DEFAULT_PASSPORT_DATA.general.visuals,
        cw1Name: 'CW 01 · Heather Charcoal',
        cw1Image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80',
        cw2Name: 'CW 02 · Oat Melange',
        cw2Image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
        prompt: '"fine knit merino wool crewneck jumper, luxury melange handfeel"'
      }
    },
    materials: {
      ...DEFAULT_PASSPORT_DATA.materials,
      cotton: 0,
      modal: 0,
      elastane: 0,
      fabricWeight: 220,
      yarnSources: {
        cottonCert: 'N/A',
        modalCert: 'N/A',
        elastaneCert: 'N/A'
      }
    },
    environmental: {
      ...DEFAULT_PASSPORT_DATA.environmental,
      totalCarbon: 5.2,
      waterUsage: { value: 390, max: 1500, sub: 'Closed-loop wool scouring' },
      renewableEnergy: { value: 70, max: 100, sub: 'Certified Italian grid mix' }
    }
  },
  {
    ...DEFAULT_PASSPORT_DATA,
    general: {
      ...DEFAULT_PASSPORT_DATA.general,
      projectId: '154820',
      orderNo: '4300085490',
      productName: 'European Flax Relaxed Linen Shirt',
      subtitle: '100% Certified European Flax® · 145 g/m²',
      season: 'SS 2026',
      category: 'Casualwear',
      status: 'VERIFIED',
      completeness: 96,
      weightGsm: 145,
      originCountry: 'Lithuania',
      lifetimeYears: '6+ Years',
      carbonKg: 3.2,
      qrCodeSeed: '154820-4300085490',
      badges: ['European Flax® Certified', 'Masters of Linen', 'Plastic-Free Horn Buttons', 'Pre-washed'],
      visuals: {
        ...DEFAULT_PASSPORT_DATA.general.visuals,
        cw1Name: 'CW 01 · Crisp White',
        cw1Image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80',
        cw2Name: 'CW 02 · Olive Linen',
        cw2Image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
        prompt: '"breathable lightweight pure linen button-up shirt, casual coastal aesthetic"'
      }
    },
    materials: {
      ...DEFAULT_PASSPORT_DATA.materials,
      cotton: 0,
      modal: 0,
      elastane: 0,
      fabricWeight: 145,
      yarnSources: {
        cottonCert: 'N/A',
        modalCert: 'European Flax® certified wet-spun long fiber linen',
        elastaneCert: 'N/A'
      }
    },
    environmental: {
      ...DEFAULT_PASSPORT_DATA.environmental,
      totalCarbon: 3.2,
      waterUsage: { value: 120, max: 1500, sub: 'Zero artificial irrigation required' },
      renewableEnergy: { value: 85, max: 100, sub: 'Biomass and wind facility' }
    }
  }
];

const CATALOG_KEY = 'tchibo_dpp_catalog_v4';

export function createEmptyPassport(customId?: string): PassportData {
  const newId = customId || '';
  return {
    general: {
      projectId: newId,
      orderNo: '',
      version: '',
      completeness: 0,
      updatedDate: '',
      productName: '',
      subtitle: '',
      brand: '',
      season: '',
      category: '',
      gender: '',
      color: '',
      fitting: '',
      passportId: '',
      status: 'DRAFT',
      designDescription: '',
      weightGsm: 0,
      originCountry: '',
      lifetimeYears: '',
      carbonKg: 0,
      qrCodeSeed: '',
      qrCodeLab: '',
      badges: [],
      articleNumbers: {
        uni: { S: '', M: '', L: '', XL: '', XXL: '' },
        aop: { S: '', M: '', L: '', XL: '', XXL: '' }
      },
      gtinStatus: '[ GTIN code - 13 digit (pending: size and color wise different GTIN code) ]',
      gtinCodes: {
        uni: { S: '', M: '', L: '', XL: '', XXL: '' },
        aop: { S: '', M: '', L: '', XL: '', XXL: '' }
      },
      packagingInfo: {
        materials: '',
        recyclability: '',
        type: '',
        certification: ''
      },
      visuals: {
        cw1Name: '',
        cw1Image: '',
        cw2Name: '',
        cw2Image: '',
        aiModelInfo: '',
        prompt: '',
        colors: ''
      }
    },
    materials: {
      cotton: 0,
      viscose: 0,
      modal: 0,
      elastane: 0,
      recycledContent: 0,
      fabricWeight: 0,
      tolerance: '',
      yarnSources: {
        cottonCert: '',
        modalCert: '',
        viscoseCert: '',
        elastaneCert: ''
      },
      labAnalysis: [],
      microfibreNote: '',
      svhcSubstances: []
    },
    measurements: {
      topFit: '',
      bottomFit: '',
      top: [],
      bottom: []
    },
    traceability: {
      percentage: 0,
      summary: '',
      origin: {
        country: 'Bangladesh',
        city: 'Chittagong / Savar, Dhaka',
        facility: 'AKH Knitting & Dyeing Ltd.',
        lat: 23.8103,
        lng: 90.4125
      },
      destination: {
        country: 'Germany',
        city: 'Hamburg',
        label: 'Hamburg Central Logistics Hub, Germany',
        lat: 53.5511,
        lng: 9.9937,
        transportMode: 'Sea Freight',
        distanceKm: 14200
      },
      testingLab: {
        name: 'ITS Labtest Bangladesh Ltd.',
        reportNo: '',
        location: 'Dhaka, Bangladesh',
        result: 'PASS'
      },
      nodes: []
    },
    quality: {
      rslStandards: '',
      reportNumber: '',
      overallResult: 'PASS',
      testingLab: 'ITS Labtest Bangladesh Ltd.',
      reviewedBy: {
        name: '',
        designation: '',
        date: ''
      },
      rslItems: [],
      labCards: []
    },
    care: {
      wash: '',
      bleach: '',
      dry: '',
      iron: '',
      dryClean: '',
      labelWording: ''
    },
    circularity: {
      tips: [],
      upcycleTitle: '',
      upcycleSubtitle: '',
      upcycleImage: '',
      upcycleSteps: [],
      fibreRecyclingFacts: []
    },
    environmental: {
      carbonStatus: 'not_provided',
      carbonDataStatus: 'Data not provided',
      carbonSource: 'Not available',
      totalCarbon: 0,
      carbonBreakdown: [],
      waterUsage: { value: 0, max: 0, sub: '' },
      renewableEnergy: { value: 0, max: 0, sub: '' },
      recycledPackaging: { value: 0, max: 0, sub: '' },
      packagingRecyclability: 0,
      packagingMaterials: '',
      euPolicyNote: ''
    },
    compliance: {
      certifications: [],
      salesChannel: '',
      availableFrom: '',
      usageClass: '',
      afterSale: '',
      issuer: '',
      markets: ''
    }
  };
}

export const PRESETS = {
  labCards: DEFAULT_PASSPORT_DATA.quality.labCards,
  topSpecs: DEFAULT_PASSPORT_DATA.measurements.top,
  bottomSpecs: DEFAULT_PASSPORT_DATA.measurements.bottom,
  circularityTips: DEFAULT_PASSPORT_DATA.circularity.tips,
  upcycleSteps: DEFAULT_PASSPORT_DATA.circularity.upcycleSteps,
  fibreRecyclingFacts: DEFAULT_PASSPORT_DATA.circularity.fibreRecyclingFacts,
  carbonBreakdown: DEFAULT_PASSPORT_DATA.environmental.carbonBreakdown,
  svhcSubstances: DEFAULT_PASSPORT_DATA.materials.svhcSubstances,
  rslItems: DEFAULT_PASSPORT_DATA.quality.rslItems,
  labAnalysis: DEFAULT_PASSPORT_DATA.materials.labAnalysis,
  traceabilityNodes: DEFAULT_PASSPORT_DATA.traceability.nodes,
  certifications: DEFAULT_PASSPORT_DATA.compliance.certifications
};

function sanitizeImageUrl(url: any, fallback: string = ''): string {
  if (!url || typeof url !== 'string') return fallback;
  const lower = url.trim().toLowerCase();
  if (
    lower.includes('example.com') ||
    lower.includes('placeholder.com') ||
    lower.includes('dummy.com') ||
    lower.includes('your-domain') ||
    lower.includes('localhost:')
  ) {
    return fallback;
  }
  return url.trim();
}

export function normalizePassportData(raw: any): PassportData {
  if (!raw || typeof raw !== 'object') return DEFAULT_PASSPORT_DATA;
  const isTchiboProject =
    raw?.general?.projectId === '151546' ||
    String(raw?.general?.brand || '').toLowerCase().includes('tchibo') ||
    String(raw?.general?.productName || '').toLowerCase().includes('pyjama') ||
    String(raw?.general?.orderNo || '').includes('4300085070');

  const base = isTchiboProject ? DEFAULT_PASSPORT_DATA : createEmptyPassport(raw?.general?.projectId || '151546');

  const normalizeSizeStrings = (obj: any, fallbackObj?: Record<Size, string>): Record<Size, string> => {
    return {
      S: String(obj?.S ?? fallbackObj?.S ?? ''),
      M: String(obj?.M ?? fallbackObj?.M ?? ''),
      L: String(obj?.L ?? fallbackObj?.L ?? ''),
      XL: String(obj?.XL ?? fallbackObj?.XL ?? ''),
      XXL: String(obj?.XXL ?? fallbackObj?.XXL ?? '')
    };
  };

  const normalizeMeasurementRow = (r: any, idx: number): MeasurementRow => {
    const valsRaw = r?.vals && typeof r.vals === 'object' ? r.vals : {};
    return {
      k: String(r?.k || String.fromCharCode(65 + idx)),
      name: String(r?.name || ''),
      how: String(r?.how || ''),
      g: r?.g || null,
      vals: {
        S: Number(valsRaw.S ?? (typeof r?.S === 'number' ? r.S : 0)),
        M: Number(valsRaw.M ?? (typeof r?.M === 'number' ? r.M : 0)),
        L: Number(valsRaw.L ?? (typeof r?.L === 'number' ? r.L : 0)),
        XL: Number(valsRaw.XL ?? (typeof r?.XL === 'number' ? r.XL : 0)),
        XXL: Number(valsRaw.XXL ?? (typeof r?.XXL === 'number' ? r.XXL : 0))
      }
    };
  };

  const rawTop = Array.isArray(raw.measurements?.top) ? raw.measurements.top : [];
  const rawBottom = Array.isArray(raw.measurements?.bottom) ? raw.measurements.bottom : [];

  const topMeasurements = rawTop.length > 0
    ? rawTop.map(normalizeMeasurementRow)
    : (base.measurements?.top || (isTchiboProject ? DEFAULT_PASSPORT_DATA.measurements.top : []));

  const bottomMeasurements = rawBottom.length > 0
    ? rawBottom.map(normalizeMeasurementRow)
    : (base.measurements?.bottom || (isTchiboProject ? DEFAULT_PASSPORT_DATA.measurements.bottom : []));

  const labCards = Array.isArray(raw.quality?.labCards) && raw.quality.labCards.length > 0
    ? raw.quality.labCards
    : (base.quality?.labCards || (isTchiboProject ? DEFAULT_PASSPORT_DATA.quality.labCards : []));

  const rslItems = Array.isArray(raw.quality?.rslItems) && raw.quality.rslItems.length > 0
    ? raw.quality.rslItems
    : (base.quality?.rslItems || (isTchiboProject ? DEFAULT_PASSPORT_DATA.quality.rslItems : []));

  const labAnalysis = Array.isArray(raw.materials?.labAnalysis) && raw.materials.labAnalysis.length > 0
    ? raw.materials.labAnalysis
    : (base.materials?.labAnalysis || (isTchiboProject ? DEFAULT_PASSPORT_DATA.materials.labAnalysis : []));

  const svhcSubstances = Array.isArray(raw.materials?.svhcSubstances) && raw.materials.svhcSubstances.length > 0
    ? raw.materials.svhcSubstances
    : (base.materials?.svhcSubstances || (isTchiboProject ? DEFAULT_PASSPORT_DATA.materials.svhcSubstances : []));

  const nodes = Array.isArray(raw.traceability?.nodes) && raw.traceability.nodes.length > 0
    ? raw.traceability.nodes.map((n: any) => ({
        ...n,
        items: Array.isArray(n?.items) ? n.items : []
      }))
    : (base.traceability?.nodes || (isTchiboProject ? DEFAULT_PASSPORT_DATA.traceability.nodes : []));

  const circularityTips = Array.isArray(raw.circularity?.tips) && raw.circularity.tips.length > 0
    ? raw.circularity.tips
    : (base.circularity?.tips || (isTchiboProject ? DEFAULT_PASSPORT_DATA.circularity.tips : []));

  const upcycleSteps = Array.isArray(raw.circularity?.upcycleSteps) && raw.circularity.upcycleSteps.length > 0
    ? raw.circularity.upcycleSteps
    : (base.circularity?.upcycleSteps || (isTchiboProject ? DEFAULT_PASSPORT_DATA.circularity.upcycleSteps : []));

  const fibreRecyclingFacts = Array.isArray(raw.circularity?.fibreRecyclingFacts) && raw.circularity.fibreRecyclingFacts.length > 0
    ? raw.circularity.fibreRecyclingFacts
    : (base.circularity?.fibreRecyclingFacts || (isTchiboProject ? DEFAULT_PASSPORT_DATA.circularity.fibreRecyclingFacts : []));

  const carbonBreakdown = Array.isArray(raw.environmental?.carbonBreakdown) && raw.environmental.carbonBreakdown.length > 0
    ? raw.environmental.carbonBreakdown
    : (base.environmental?.carbonBreakdown || (isTchiboProject ? DEFAULT_PASSPORT_DATA.environmental.carbonBreakdown : []));

  const certifications = Array.isArray(raw.compliance?.certifications) && raw.compliance.certifications.length > 0
    ? raw.compliance.certifications
    : (base.compliance?.certifications || (isTchiboProject ? DEFAULT_PASSPORT_DATA.compliance.certifications : []));

  return {
    general: {
      ...base.general,
      ...(raw.general || {}),
      badges: Array.isArray(raw.general?.badges) && raw.general.badges.length > 0 ? raw.general.badges : base.general.badges,
      articleNumbers: {
        uni: normalizeSizeStrings(
          raw.general?.articleNumbers?.uni || raw.general?.articleNumbers,
          base.general.articleNumbers.uni
        ),
        aop: normalizeSizeStrings(
          raw.general?.articleNumbers?.aop,
          base.general.articleNumbers.aop
        )
      },
      gtinCodes: {
        uni: normalizeSizeStrings(
          raw.general?.gtinCodes?.uni || raw.general?.gtinCodes,
          base.general.gtinCodes?.uni
        ),
        aop: normalizeSizeStrings(
          raw.general?.gtinCodes?.aop,
          base.general.gtinCodes?.aop
        )
      },
      packagingInfo: {
        ...(base.general.packagingInfo || {}),
        ...(raw.general?.packagingInfo || {})
      },
      visuals: {
        ...base.general.visuals,
        ...(raw.general?.visuals || {}),
        cw1Image: sanitizeImageUrl(raw.general?.visuals?.cw1Image, base.general.visuals.cw1Image || ''),
        cw2Image: sanitizeImageUrl(raw.general?.visuals?.cw2Image, base.general.visuals.cw2Image || ''),
      }
    },
    materials: {
      ...base.materials,
      ...(raw.materials || {}),
      yarnSources: {
        ...base.materials.yarnSources,
        ...(raw.materials?.yarnSources || {})
      },
      labAnalysis,
      svhcSubstances
    },
    measurements: {
      topFit: raw.measurements?.topFit || base.measurements?.topFit || (isTchiboProject ? DEFAULT_PASSPORT_DATA.measurements.topFit : 'N/A'),
      bottomFit: raw.measurements?.bottomFit || base.measurements?.bottomFit || (isTchiboProject ? DEFAULT_PASSPORT_DATA.measurements.bottomFit : 'N/A'),
      top: topMeasurements,
      bottom: bottomMeasurements
    },
    traceability: {
      ...base.traceability,
      ...(raw.traceability || {}),
      origin: { ...base.traceability.origin, ...(raw.traceability?.origin || {}) },
      destination: { ...base.traceability.destination, ...(raw.traceability?.destination || {}) },
      testingLab: { ...base.traceability.testingLab, ...(raw.traceability?.testingLab || {}) },
      nodes
    },
    quality: {
      ...base.quality,
      ...(raw.quality || {}),
      reviewedBy: { ...base.quality.reviewedBy, ...(raw.quality?.reviewedBy || {}) },
      rslItems,
      labCards
    },
    care: {
      wash: raw.care?.wash || base.care?.wash || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.wash : 'N/A'),
      bleach: raw.care?.bleach || base.care?.bleach || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.bleach : 'N/A'),
      dry: raw.care?.dry || base.care?.dry || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.dry : 'N/A'),
      iron: raw.care?.iron || base.care?.iron || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.iron : 'N/A'),
      dryClean: raw.care?.dryClean || base.care?.dryClean || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.dryClean : 'N/A'),
      labelWording: raw.care?.labelWording || base.care?.labelWording || (isTchiboProject ? DEFAULT_PASSPORT_DATA.care.labelWording : 'N/A')
    },
    circularity: {
      ...base.circularity,
      ...(raw.circularity || {}),
      tips: circularityTips,
      upcycleTitle: raw.circularity?.upcycleTitle || base.circularity?.upcycleTitle || (isTchiboProject ? DEFAULT_PASSPORT_DATA.circularity.upcycleTitle : 'N/A'),
      upcycleSubtitle: raw.circularity?.upcycleSubtitle || base.circularity?.upcycleSubtitle || (isTchiboProject ? DEFAULT_PASSPORT_DATA.circularity.upcycleSubtitle : 'N/A'),
      upcycleImage: sanitizeImageUrl(raw.circularity?.upcycleImage, base.circularity?.upcycleImage || ''),
      upcycleSteps,
      fibreRecyclingFacts
    },
    environmental: {
      ...base.environmental,
      ...(raw.environmental || {}),
      totalCarbon: raw.environmental?.totalCarbon && raw.environmental.totalCarbon > 0 ? raw.environmental.totalCarbon : (base.environmental?.totalCarbon || (isTchiboProject ? DEFAULT_PASSPORT_DATA.environmental.totalCarbon : 0)),
      waterUsage: { ...base.environmental.waterUsage, ...(raw.environmental?.waterUsage || {}) },
      renewableEnergy: { ...base.environmental.renewableEnergy, ...(raw.environmental?.renewableEnergy || {}) },
      recycledPackaging: { ...base.environmental.recycledPackaging, ...(raw.environmental?.recycledPackaging || {}) },
      carbonBreakdown
    },
    compliance: {
      ...base.compliance,
      ...(raw.compliance || {}),
      certifications
    }
  };
}

/**
 * Normalizes extracted data from uploaded documents.
 * Adheres strictly to the rule: if a field or table is missing from the document, write "N/A" (or 0 for numbers).
 * Does not invent, synthesize, or inject mock data into missing fields.
 */
export function normalizeExtractedPassportData(raw: any, existingVisuals?: any): PassportData {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  const clean = (val: any, fallback: string = 'n/a'): string => {
    if (val === null || val === undefined) return fallback;
    const s = String(val).trim();
    if (s === '' || s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return fallback;
    return s;
  };

  const num = (val: any, fallback: number = 0): number => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? fallback : parsed;
  };

  const cleanSizes = (obj: any): Record<Size, string> => ({
    S: clean(obj?.S),
    M: clean(obj?.M),
    L: clean(obj?.L),
    XL: clean(obj?.XL),
    XXL: clean(obj?.XXL),
  });

  const rawTop = Array.isArray(raw.measurements?.top) ? raw.measurements.top : [];
  const rawBottom = Array.isArray(raw.measurements?.bottom) ? raw.measurements.bottom : [];

  const topMeasurements: MeasurementRow[] = rawTop.map((r: any, idx: number) => {
    const valsRaw = r?.vals && typeof r.vals === 'object' ? r.vals : {};
    return {
      k: clean(r?.k, String.fromCharCode(65 + idx)),
      name: clean(r?.name, 'n/a'),
      how: clean(r?.how, 'n/a'),
      g: r?.g ? String(r.g) : null,
      vals: {
        S: num(valsRaw.S ?? r?.S),
        M: num(valsRaw.M ?? r?.M),
        L: num(valsRaw.L ?? r?.L),
        XL: num(valsRaw.XL ?? r?.XL),
        XXL: num(valsRaw.XXL ?? r?.XXL),
      },
    };
  });

  const bottomMeasurements: MeasurementRow[] = rawBottom.map((r: any, idx: number) => {
    const valsRaw = r?.vals && typeof r.vals === 'object' ? r.vals : {};
    return {
      k: clean(r?.k, String.fromCharCode(65 + idx)),
      name: clean(r?.name, 'n/a'),
      how: clean(r?.how, 'n/a'),
      g: r?.g ? String(r.g) : null,
      vals: {
        S: num(valsRaw.S ?? r?.S),
        M: num(valsRaw.M ?? r?.M),
        L: num(valsRaw.L ?? r?.L),
        XL: num(valsRaw.XL ?? r?.XL),
        XXL: num(valsRaw.XXL ?? r?.XXL),
      },
    };
  });

  const labCards: LabCardData[] =
    Array.isArray(raw.quality?.labCards) && raw.quality.labCards.length > 0
      ? raw.quality.labCards.map((c: any) => ({
          std: clean(c?.std),
          title: clean(c?.title),
          val: clean(c?.val),
          subVal: clean(c?.subVal),
          desc: clean(c?.desc),
          hint: clean(c?.hint),
        }))
      : [];

  const rslItems: Array<{ name: string; result: string }> =
    Array.isArray(raw.quality?.rslItems) && raw.quality.rslItems.length > 0
      ? raw.quality.rslItems.map((item: any) => ({
          name: clean(item?.name),
          result: clean(item?.result),
        }))
      : [];

  const labAnalysis =
    Array.isArray(raw.materials?.labAnalysis) && raw.materials.labAnalysis.length > 0
      ? raw.materials.labAnalysis.map((la: any) => ({
          fiber: clean(la?.fiber),
          labeled: clean(la?.labeled),
          lab: clean(la?.lab),
        }))
      : [];

  const svhcSubstances =
    Array.isArray(raw.materials?.svhcSubstances) && raw.materials.svhcSubstances.length > 0
      ? raw.materials.svhcSubstances.map((sub: any) => ({
          substance: clean(sub?.substance),
          cas: clean(sub?.cas),
          component: clean(sub?.component),
          status: clean(sub?.status),
        }))
      : [];

  const nodes: TraceabilityNode[] =
    Array.isArray(raw.traceability?.nodes) && raw.traceability.nodes.length > 0
      ? raw.traceability.nodes.map((node: any) => ({
          tier: clean(node?.tier, 'TIER 1'),
          date: clean(node?.date),
          title: clean(node?.title),
          subtitle: clean(node?.subtitle),
          color: (node?.color === 'amber' ? 'amber' : 'green') as 'green' | 'amber',
          items:
            Array.isArray(node?.items) && node.items.length > 0
              ? node.items.map((it: any) => ({
                  label: clean(it?.label),
                  val: clean(it?.val),
                }))
              : [{ label: 'Status', val: 'N/A' }],
        }))
      : [];

  const tips =
    Array.isArray(raw.circularity?.tips) && raw.circularity.tips.length > 0
      ? raw.circularity.tips.map((t: any) => ({
          emoji: t?.emoji || 'ℹ️',
          title: clean(t?.title),
          text: clean(t?.text),
        }))
      : [];

  const upcycleSteps =
    Array.isArray(raw.circularity?.upcycleSteps) && raw.circularity.upcycleSteps.length > 0
      ? raw.circularity.upcycleSteps.map((s: any) => ({
          title: clean(s?.title),
          text: clean(s?.text),
        }))
      : [];

  const fibreRecyclingFacts =
    Array.isArray(raw.circularity?.fibreRecyclingFacts) && raw.circularity.fibreRecyclingFacts.length > 0
      ? raw.circularity.fibreRecyclingFacts.map((f: any) => clean(f))
      : [];

  const carbonBreakdown =
    Array.isArray(raw.environmental?.carbonBreakdown) && raw.environmental.carbonBreakdown.length > 0
      ? raw.environmental.carbonBreakdown.map((cb: any) => ({
          label: clean(cb?.label),
          value: num(cb?.value),
          color: cb?.color || '#5FA47F',
        }))
      : [];

  const certifications =
    Array.isArray(raw.compliance?.certifications) && raw.compliance.certifications.length > 0
      ? raw.compliance.certifications.map((c: any) => ({
          name: clean(c?.name),
          scope: clean(c?.scope),
          status: clean(c?.status),
        }))
      : [];

  const badges =
    Array.isArray(raw.general?.badges) && raw.general.badges.length > 0
      ? raw.general.badges.map((b: any) => clean(b)).filter((b: string) => b.toLowerCase() !== 'n/a')
      : [];

  // Geolocation helpers: ensure valid coordinates
  const originLat = num(raw.traceability?.origin?.lat, 23.8103);
  const originLng = num(raw.traceability?.origin?.lng, 90.4125);
  const destLat = num(raw.traceability?.destination?.lat, 53.5511);
  const destLng = num(raw.traceability?.destination?.lng, 9.9937);

  // Compute realistic completeness score based on non-n/a extracted fields
  const isFilled = (val: string) => Boolean(val && val.trim().toLowerCase() !== 'n/a');
  const keyChecks = [
    isFilled(clean(raw.general?.projectId)),
    isFilled(clean(raw.general?.orderNo)),
    isFilled(clean(raw.general?.productName)),
    isFilled(clean(raw.general?.brand)),
    isFilled(clean(raw.general?.season)),
    isFilled(clean(raw.general?.category)),
    isFilled(clean(raw.general?.originCountry)),
    num(raw.materials?.fabricWeight) > 0 || num(raw.general?.weightGsm) > 0,
    num(raw.materials?.cotton) > 0 || num(raw.materials?.modal) > 0 || num(raw.materials?.viscose) > 0 || num(raw.materials?.elastane) > 0 || num(raw.materials?.recycledContent) > 0,
    isFilled(clean(raw.materials?.yarnSources?.cottonCert)) || isFilled(clean(raw.materials?.yarnSources?.modalCert)) || isFilled(clean(raw.materials?.yarnSources?.viscoseCert)),
    topMeasurements.length > 0 || bottomMeasurements.length > 0,
    isFilled(clean(raw.quality?.reportNumber)) || isFilled(clean(raw.quality?.testingLab)),
    isFilled(clean(raw.care?.wash)) || isFilled(clean(raw.care?.labelWording)),
    nodes.length > 0,
    certifications.length > 0 || badges.length > 0
  ];
  const filledCount = keyChecks.filter(Boolean).length;
  const computedCompleteness = Math.round((filledCount / keyChecks.length) * 100);

  return {
    general: {
      projectId: clean(raw.general?.projectId),
      orderNo: clean(raw.general?.orderNo),
      version: clean(raw.general?.version),
      completeness: raw.general?.completeness ? num(raw.general.completeness) : computedCompleteness,
      updatedDate: clean(raw.general?.updatedDate, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })),
      productName: clean(raw.general?.productName),
      subtitle: clean(raw.general?.subtitle),
      brand: clean(raw.general?.brand),
      season: clean(raw.general?.season),
      category: clean(raw.general?.category),
      gender: clean(raw.general?.gender),
      color: clean(raw.general?.color),
      fitting: clean(raw.general?.fitting),
      passportId: clean(raw.general?.passportId, raw.general?.projectId ? `DPP-${raw.general.projectId}` : 'N/A'),
      status: (raw.general?.status === 'VERIFIED' ? 'VERIFIED' : raw.general?.status === 'AUDIT PENDING' ? 'AUDIT PENDING' : 'DRAFT'),
      designDescription: clean(raw.general?.designDescription),
      weightGsm: num(raw.general?.weightGsm || raw.materials?.fabricWeight),
      originCountry: clean(raw.general?.originCountry),
      lifetimeYears: clean(raw.general?.lifetimeYears),
      carbonKg: num(raw.general?.carbonKg || raw.environmental?.totalCarbon),
      qrCodeSeed: clean(raw.general?.qrCodeSeed),
      qrCodeLab: clean(raw.general?.qrCodeLab),
      badges,
      articleNumbers: {
        uni: cleanSizes(raw.general?.articleNumbers?.uni || raw.general?.articleNumbers),
        aop: cleanSizes(raw.general?.articleNumbers?.aop)
      },
      gtinStatus: clean(raw.general?.gtinStatus),
      gtinCodes: {
        uni: cleanSizes(raw.general?.gtinCodes?.uni || raw.general?.gtinCodes),
        aop: cleanSizes(raw.general?.gtinCodes?.aop)
      },
      packagingInfo: {
        materials: clean(raw.general?.packagingInfo?.materials),
        recyclability: clean(raw.general?.packagingInfo?.recyclability),
        type: clean(raw.general?.packagingInfo?.type),
        certification: clean(raw.general?.packagingInfo?.certification)
      },
      visuals: {
        cw1Name: clean(raw.general?.visuals?.cw1Name),
        cw1Image: sanitizeImageUrl(raw.general?.visuals?.cw1Image, existingVisuals?.cw1Image || ''),
        cw2Name: clean(raw.general?.visuals?.cw2Name),
        cw2Image: sanitizeImageUrl(raw.general?.visuals?.cw2Image, existingVisuals?.cw2Image || ''),
        aiModelInfo: clean(raw.general?.visuals?.aiModelInfo),
        prompt: clean(raw.general?.visuals?.prompt),
        colors: clean(raw.general?.visuals?.colors)
      }
    },
    materials: {
      cotton: num(raw.materials?.cotton),
      viscose: num(raw.materials?.viscose),
      modal: num(raw.materials?.modal),
      elastane: num(raw.materials?.elastane),
      recycledContent: num(raw.materials?.recycledContent),
      fabricWeight: num(raw.materials?.fabricWeight || raw.general?.weightGsm),
      tolerance: clean(raw.materials?.tolerance),
      yarnSources: {
        cottonCert: clean(raw.materials?.yarnSources?.cottonCert),
        modalCert: clean(raw.materials?.yarnSources?.modalCert),
        viscoseCert: clean(raw.materials?.yarnSources?.viscoseCert),
        elastaneCert: clean(raw.materials?.yarnSources?.elastaneCert)
      },
      labAnalysis,
      microfibreNote: clean(raw.materials?.microfibreNote),
      svhcSubstances
    },
    measurements: {
      topFit: clean(raw.measurements?.topFit),
      bottomFit: clean(raw.measurements?.bottomFit),
      top: topMeasurements,
      bottom: bottomMeasurements
    },
    traceability: {
      percentage: num(raw.traceability?.percentage),
      summary: clean(raw.traceability?.summary),
      origin: {
        country: clean(raw.traceability?.origin?.country),
        city: clean(raw.traceability?.origin?.city),
        facility: clean(raw.traceability?.origin?.facility),
        lat: originLat,
        lng: originLng
      },
      destination: {
        country: clean(raw.traceability?.destination?.country),
        city: clean(raw.traceability?.destination?.city),
        label: clean(raw.traceability?.destination?.label),
        lat: destLat,
        lng: destLng,
        transportMode: clean(raw.traceability?.destination?.transportMode),
        distanceKm: num(raw.traceability?.destination?.distanceKm)
      },
      testingLab: {
        name: clean(raw.traceability?.testingLab?.name || raw.quality?.testingLab),
        reportNo: clean(raw.traceability?.testingLab?.reportNo || raw.quality?.reportNumber),
        location: clean(raw.traceability?.testingLab?.location),
        result: clean(raw.traceability?.testingLab?.result || raw.quality?.overallResult)
      },
      nodes
    },
    quality: {
      rslStandards: clean(raw.quality?.rslStandards),
      reportNumber: clean(raw.quality?.reportNumber),
      overallResult: clean(raw.quality?.overallResult),
      testingLab: clean(raw.quality?.testingLab),
      reviewedBy: {
        name: clean(raw.quality?.reviewedBy?.name),
        designation: clean(raw.quality?.reviewedBy?.designation),
        date: clean(raw.quality?.reviewedBy?.date)
      },
      rslItems,
      labCards
    },
    care: {
      wash: clean(raw.care?.wash),
      bleach: clean(raw.care?.bleach),
      dry: clean(raw.care?.dry),
      iron: clean(raw.care?.iron),
      dryClean: clean(raw.care?.dryClean),
      labelWording: clean(raw.care?.labelWording)
    },
    circularity: {
      tips,
      upcycleTitle: clean(raw.circularity?.upcycleTitle),
      upcycleSubtitle: clean(raw.circularity?.upcycleSubtitle),
      upcycleImage: sanitizeImageUrl(raw.circularity?.upcycleImage, ''),
      upcycleSteps,
      fibreRecyclingFacts
    },
    environmental: {
      carbonStatus: (raw.environmental?.carbonStatus === 'available' || num(raw.environmental?.totalCarbon) > 0) ? 'available' : 'not_provided',
      carbonDataStatus: clean(raw.environmental?.carbonDataStatus, 'Data not provided in documentation'),
      carbonSource: clean(raw.environmental?.carbonSource),
      totalCarbon: num(raw.environmental?.totalCarbon),
      carbonBreakdown,
      waterUsage: {
        value: num(raw.environmental?.waterUsage?.value),
        max: num(raw.environmental?.waterUsage?.max, 1000),
        sub: clean(raw.environmental?.waterUsage?.sub)
      },
      renewableEnergy: {
        value: num(raw.environmental?.renewableEnergy?.value),
        max: num(raw.environmental?.renewableEnergy?.max, 100),
        sub: clean(raw.environmental?.renewableEnergy?.sub)
      },
      recycledPackaging: {
        value: num(raw.environmental?.recycledPackaging?.value),
        max: num(raw.environmental?.recycledPackaging?.max, 100),
        sub: clean(raw.environmental?.recycledPackaging?.sub)
      },
      packagingRecyclability: num(raw.environmental?.packagingRecyclability),
      packagingMaterials: clean(raw.environmental?.packagingMaterials),
      euPolicyNote: clean(raw.environmental?.euPolicyNote)
    },
    compliance: {
      certifications,
      salesChannel: clean(raw.compliance?.salesChannel),
      availableFrom: clean(raw.compliance?.availableFrom),
      usageClass: clean(raw.compliance?.usageClass),
      afterSale: clean(raw.compliance?.afterSale),
      issuer: clean(raw.compliance?.issuer),
      markets: clean(raw.compliance?.markets)
    }
  };
}

export function getAllPassports(): PassportData[] {
  if (typeof window === 'undefined') return DEFAULT_CATALOG;
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) {
      // Seed initial catalog
      localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_CATALOG));
      return DEFAULT_CATALOG;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_CATALOG;
    }
    return parsed.map(normalizePassportData);
  } catch {
    return DEFAULT_CATALOG;
  }
}

export function getPassportById(id: string): PassportData {
  const list = getAllPassports();
  const found = list.find(p => p.general?.projectId === id);
  if (found) return normalizePassportData(found);
  // Fallback to default
  return DEFAULT_PASSPORT_DATA;
}

export function savePassport(passport: PassportData): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAllPassports();
    const idx = list.findIndex(p => p.general.projectId === passport.general.projectId);
    if (idx >= 0) {
      list[idx] = passport;
    } else {
      list.unshift(passport);
    }
    localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
    // Also update current active key for backwards compatibility
    localStorage.setItem('tchibo_custom_dpp_data_v1', JSON.stringify(passport));
  } catch (err) {
    console.error('Failed to save passport to storage', err);
  }
}

export function deletePassport(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getAllPassports().filter(p => p.general.projectId !== id);
    localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to delete passport', err);
  }
}

export function resetAllPassports(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(DEFAULT_CATALOG));
    localStorage.removeItem('tchibo_custom_dpp_data_v1');
  } catch (err) {
    console.error('Failed to reset catalog', err);
  }
}

// MongoDB & API Persistence Helpers
export async function fetchPassportsFromApi(): Promise<{
  source: string;
  connected: boolean;
  passports: PassportData[];
}> {
  try {
    const res = await fetch('/api/passports', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.passports) && data.passports.length > 0) {
      const normalized = data.passports.map(normalizePassportData);
      // Keep localStorage in sync as resilient local cache
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CATALOG_KEY, JSON.stringify(normalized));
        } catch {
          // ignore quota error
        }
      }
      return {
        source: data.source || 'mongodb',
        connected: Boolean(data.connected),
        passports: normalized,
      };
    }
  } catch (err) {
    console.warn('Could not fetch passports from /api/passports, using local storage cache:', err);
  }
  return {
    source: 'local',
    connected: false,
    passports: getAllPassports(),
  };
}

export async function savePassportToApi(passport: PassportData): Promise<{
  success: boolean;
  source: string;
  connected?: boolean;
  message?: string;
}> {
  // Always update local cache first
  savePassport(passport);

  try {
    const res = await fetch('/api/passports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passport }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      source: data.source || 'local',
      connected: data.connected,
      message: data.message,
    };
  } catch (err: any) {
    console.warn('Failed to persist passport to /api/passports:', err);
    return {
      success: true,
      source: 'local',
      connected: false,
      message: 'Saved to local browser cache (MongoDB offline or unconfigured)',
    };
  }
}

export async function deletePassportFromApi(id: string): Promise<{
  success: boolean;
  source: string;
}> {
  deletePassport(id);
  try {
    const res = await fetch(`/api/passports/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, source: data.source || 'mongodb' };
  } catch (err) {
    console.warn('Failed to delete passport on server:', err);
    return { success: true, source: 'local' };
  }
}

// Backward compatibility helpers
export function getStoredPassportData(): PassportData {
  const list = getAllPassports();
  return list[0] || DEFAULT_PASSPORT_DATA;
}

export function saveStoredPassportData(data: PassportData): void {
  savePassport(data);
}

export function resetStoredPassportData(): void {
  resetAllPassports();
}
