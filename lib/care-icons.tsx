import React from 'react';

export interface CareSymbolOption {
  id: string;
  category: 'wash' | 'bleach' | 'dry' | 'iron' | 'dryClean';
  name: string;
  code: string;
  description: string;
  svg: string;
}

export const CARE_SYMBOLS: Record<string, CareSymbolOption[]> = {
  wash: [
    {
      id: 'wash_60',
      category: 'wash',
      name: 'Machine Wash 60°C',
      code: '60°C Wash',
      description: '60°C Machine wash, normal / baby hygiene cycle',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M6 14h28l-3 18H9L6 14z"/><path d="M6 17c3-2 6-2 9 0s6 2 9 0 6-2 9 0"/><text x="20" y="27" font-size="9" font-family="monospace" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle">60°</text></svg>`
    },
    {
      id: 'wash_40',
      category: 'wash',
      name: 'Machine Wash 40°C',
      code: '40°C Wash',
      description: '40°C Machine wash, normal / colour cycle',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M6 14h28l-3 18H9L6 14z"/><path d="M6 17c3-2 6-2 9 0s6 2 9 0 6-2 9 0"/><text x="20" y="27" font-size="9" font-family="monospace" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle">40°</text></svg>`
    },
    {
      id: 'wash_30',
      category: 'wash',
      name: 'Machine Wash 30°C',
      code: '30°C Wash',
      description: '30°C Machine wash, delicate / wool cycle',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M6 14h28l-3 18H9L6 14z"/><path d="M6 17c3-2 6-2 9 0s6 2 9 0 6-2 9 0"/><text x="20" y="27" font-size="9" font-family="monospace" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle">30°</text></svg>`
    },
    {
      id: 'wash_hand',
      category: 'wash',
      name: 'Hand Wash Only',
      code: 'Hand Wash',
      description: 'Hand wash max 40°C, handle with care',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M6 16h28l-3 16H9L6 16z"/><path d="M14 9v7m4-9v7m4-8v8m4-6v6"/><path d="M12 16c2 3 5 4 8 4s6-1 8-4"/></svg>`
    },
    {
      id: 'wash_no',
      category: 'wash',
      name: 'Do Not Wash',
      code: 'Do Not Wash',
      description: 'Do not wash with water',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M6 14h28l-3 18H9L6 14z"/><path d="M6 17c3-2 6-2 9 0s6 2 9 0 6-2 9 0"/><line x1="8" y1="8" x2="32" y2="32" stroke="#DC2626" stroke-width="2.5"/><line x1="32" y1="8" x2="8" y2="32" stroke="#DC2626" stroke-width="2.5"/></svg>`
    }
  ],
  bleach: [
    {
      id: 'bleach_no',
      category: 'bleach',
      name: 'Do Not Bleach',
      code: 'Do Not Bleach',
      description: 'Do not use bleach, only enzyme-free mild detergent',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M20 7L6 32h28L20 7z"/><line x1="9" y1="12" x2="31" y2="30" stroke="#DC2626" stroke-width="2.5"/><line x1="31" y1="12" x2="9" y2="30" stroke="#DC2626" stroke-width="2.5"/></svg>`
    },
    {
      id: 'bleach_oxygen',
      category: 'bleach',
      name: 'Oxygen / Non-Chlorine Bleach',
      code: 'Oxygen Bleach',
      description: 'Only non-chlorine oxygen-based bleach when needed',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M20 7L6 32h28L20 7z"/><line x1="16" y1="17" x2="11" y2="28"/><line x1="23" y1="17" x2="18" y2="28"/></svg>`
    },
    {
      id: 'bleach_any',
      category: 'bleach',
      name: 'Any Bleach Allowed',
      code: 'Bleach OK',
      description: 'Any commercial bleaching agent can be safely used',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M20 7L6 32h28L20 7z"/></svg>`
    }
  ],
  dry: [
    {
      id: 'dry_tumble_low',
      category: 'dry',
      name: 'Tumble Dry Low Heat',
      code: 'Tumble Low (60°C)',
      description: 'Tumble drying at lower temperature / delicate cycle',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><rect x="7" y="7" width="26" height="26" rx="3"/><circle cx="20" cy="20" r="9"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'dry_tumble_normal',
      category: 'dry',
      name: 'Tumble Dry Normal Heat',
      code: 'Tumble Normal (80°C)',
      description: 'Tumble drying possible at standard high temperature',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><rect x="7" y="7" width="26" height="26" rx="3"/><circle cx="20" cy="20" r="9"/><circle cx="16.5" cy="20" r="1.5" fill="currentColor"/><circle cx="23.5" cy="20" r="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'dry_no_tumble',
      category: 'dry',
      name: 'Do Not Tumble Dry',
      code: 'Do Not Tumble',
      description: 'Do not tumble dry, air dry naturally',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><rect x="7" y="7" width="26" height="26" rx="3"/><circle cx="20" cy="20" r="9"/><line x1="8" y1="8" x2="32" y2="32" stroke="#DC2626" stroke-width="2.5"/><line x1="32" y1="8" x2="8" y2="32" stroke="#DC2626" stroke-width="2.5"/></svg>`
    },
    {
      id: 'dry_line',
      category: 'dry',
      name: 'Line Dry in Shade',
      code: 'Line Dry',
      description: 'Hang to line dry, preferably in shade',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><rect x="7" y="7" width="26" height="26" rx="3"/><path d="M8 12c8 4 16 4 24 0"/></svg>`
    },
    {
      id: 'dry_flat',
      category: 'dry',
      name: 'Dry Flat',
      code: 'Dry Flat',
      description: 'Dry horizontally flat on towel or rack',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><rect x="7" y="7" width="26" height="26" rx="3"/><line x1="12" y1="20" x2="28" y2="20"/></svg>`
    }
  ],
  iron: [
    {
      id: 'iron_med',
      category: 'iron',
      name: 'Iron Medium Temp (150°C)',
      code: 'Iron Med (150°C)',
      description: 'Iron at maximum sole-plate temperature of 150°C (2 dots)',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M7 25h26c-2-8-6-13-14-13H7v13z"/><circle cx="17" cy="20" r="1.5" fill="currentColor"/><circle cx="23" cy="20" r="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'iron_low',
      category: 'iron',
      name: 'Iron Low Temp (110°C)',
      code: 'Iron Low (110°C)',
      description: 'Iron at maximum sole-plate temperature of 110°C (1 dot, no steam)',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M7 25h26c-2-8-6-13-14-13H7v13z"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'iron_high',
      category: 'iron',
      name: 'Iron High Temp (200°C)',
      code: 'Iron High (200°C)',
      description: 'Iron at maximum sole-plate temperature of 200°C (3 dots)',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M7 25h26c-2-8-6-13-14-13H7v13z"/><circle cx="15" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/><circle cx="25" cy="20" r="1.5" fill="currentColor"/></svg>`
    },
    {
      id: 'iron_no',
      category: 'iron',
      name: 'Do Not Iron',
      code: 'Do Not Iron',
      description: 'Do not iron or steam treat',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M7 25h26c-2-8-6-13-14-13H7v13z"/><line x1="8" y1="8" x2="32" y2="32" stroke="#DC2626" stroke-width="2.5"/><line x1="32" y1="8" x2="8" y2="32" stroke="#DC2626" stroke-width="2.5"/></svg>`
    }
  ],
  dryClean: [
    {
      id: 'dryclean_no',
      category: 'dryClean',
      name: 'Do Not Dry Clean',
      code: 'Do Not Dry Clean',
      description: 'Do not dry clean with chemical solvents',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><circle cx="20" cy="20" r="13"/><line x1="8" y1="8" x2="32" y2="32" stroke="#DC2626" stroke-width="2.5"/><line x1="32" y1="8" x2="8" y2="32" stroke="#DC2626" stroke-width="2.5"/></svg>`
    },
    {
      id: 'dryclean_p',
      category: 'dryClean',
      name: 'Professional Dry Clean (PCE)',
      code: 'Dry Clean (P)',
      description: 'Professional dry cleaning in tetrachloroethene and all solvents (P)',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><circle cx="20" cy="20" r="13"/><text x="20" y="25" font-size="14" font-family="monospace" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle">P</text></svg>`
    },
    {
      id: 'dryclean_wet',
      category: 'dryClean',
      name: 'Gentle Wet Clean (W)',
      code: 'Wet Clean (W)',
      description: 'Professional gentle wet cleaning process',
      svg: `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><circle cx="20" cy="20" r="13"/><text x="20" y="25" font-size="14" font-family="monospace" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle">W</text></svg>`
    }
  ]
};

export function getCareSymbolSvg(category: 'wash' | 'bleach' | 'dry' | 'iron' | 'dryClean', idOrText?: string): string {
  const options = CARE_SYMBOLS[category] || [];
  if (!idOrText) return options[0]?.svg || '';

  // Match by id
  const found = options.find(o => o.id === idOrText || o.code.toLowerCase() === idOrText.toLowerCase());
  if (found) return found.svg;

  // Keyword heuristic matching
  const t = idOrText.toLowerCase();
  if (category === 'wash') {
    if (t.includes('60')) return CARE_SYMBOLS.wash[0].svg;
    if (t.includes('40')) return CARE_SYMBOLS.wash[1].svg;
    if (t.includes('30')) return CARE_SYMBOLS.wash[2].svg;
    if (t.includes('hand')) return CARE_SYMBOLS.wash[3].svg;
    if (t.includes('do not') || t.includes('not wash')) return CARE_SYMBOLS.wash[4].svg;
    return CARE_SYMBOLS.wash[0].svg;
  }
  if (category === 'bleach') {
    if (t.includes('do not') || t.includes('no bleach') || t.includes('non-chlorine')) return CARE_SYMBOLS.bleach[0].svg;
    if (t.includes('oxygen')) return CARE_SYMBOLS.bleach[1].svg;
    return CARE_SYMBOLS.bleach[0].svg;
  }
  if (category === 'dry') {
    if (t.includes('low')) return CARE_SYMBOLS.dry[0].svg;
    if (t.includes('do not') || t.includes('not tumble')) return CARE_SYMBOLS.dry[2].svg;
    if (t.includes('line') || t.includes('shade')) return CARE_SYMBOLS.dry[3].svg;
    if (t.includes('flat')) return CARE_SYMBOLS.dry[4].svg;
    return CARE_SYMBOLS.dry[0].svg;
  }
  if (category === 'iron') {
    if (t.includes('medium') || t.includes('150') || t.includes('med')) return CARE_SYMBOLS.iron[0].svg;
    if (t.includes('low') || t.includes('110')) return CARE_SYMBOLS.iron[1].svg;
    if (t.includes('high') || t.includes('200')) return CARE_SYMBOLS.iron[2].svg;
    if (t.includes('do not') || t.includes('no iron')) return CARE_SYMBOLS.iron[3].svg;
    return CARE_SYMBOLS.iron[0].svg;
  }
  if (category === 'dryClean') {
    if (t.includes('do not') || t.includes('not dry clean')) return CARE_SYMBOLS.dryClean[0].svg;
    if (t.includes('wet')) return CARE_SYMBOLS.dryClean[2].svg;
    if (t.includes('pce') || t.includes('(p)')) return CARE_SYMBOLS.dryClean[1].svg;
    return CARE_SYMBOLS.dryClean[0].svg;
  }

  return options[0]?.svg || '';
}

export function CareIconRenderer({
  category,
  symbolId,
  className = 'w-7 h-7 text-ink'
}: {
  category: 'wash' | 'bleach' | 'dry' | 'iron' | 'dryClean';
  symbolId?: string;
  className?: string;
}) {
  const svgHtml = getCareSymbolSvg(category, symbolId);
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
