export type Status = 'Collapsed' | 'Overexploited' | 'Depleted' | 'Declining' | 'Stable' | 'Recovering' | 'Data-limited'

export interface IcesStock {
  track: 'ices'
  species: string
  stock: string
  area: string
  f_fmsy: number
  ssb_msybtrigger: number
  assessmentType?: 'standard' | 'escapement' | 'ssb_only'
  fmsyRange?: [number, number]
}

export interface ProxyStock {
  track: 'proxy'
  species: string
  area: string
  depletion: number
  tau: number
  p: number
  flag?: 'Data-limited'
  note?: string
}

export type Stock = IcesStock | ProxyStock

// F/FMSY and SSB/MSYBtrigger from ICES SAG 2023 terminal-year data (F and SSB) divided by
// reference points extracted from ICES advice PDFs via figshare. Source: ICES SAG 2023/2022/2021.
export const icesStocks: IcesStock[] = [
  { track: 'ices', species: 'Atlantic cod',             stock: 'cod.27.47d20',     area: 'North Sea',   f_fmsy: 0.882, ssb_msybtrigger: 0.554 },
  { track: 'ices', species: 'Atlantic herring',         stock: 'her.27.3a47d',     area: 'North Sea',   f_fmsy: 0.732, ssb_msybtrigger: 1.201 },
  { track: 'ices', species: 'Atlantic mackerel',        stock: 'mac.27.nea',       area: 'NE Atlantic', f_fmsy: 1.169, ssb_msybtrigger: 1.531 },
  { track: 'ices', species: 'Haddock',                  stock: 'had.27.46a20',     area: 'North Sea',   f_fmsy: 0.496, ssb_msybtrigger: 2.790 },
  { track: 'ices', species: 'Blue whiting',             stock: 'whb.27.1-91214',   area: 'NE Atlantic', f_fmsy: 1.609, ssb_msybtrigger: 3.022 },
  { track: 'ices', species: 'European plaice',          stock: 'ple.27.420',       area: 'North Sea',   f_fmsy: 0.559, ssb_msybtrigger: 1.885 },
  { track: 'ices', species: 'Common sole',              stock: 'sol.27.4',         area: 'North Sea',   f_fmsy: 0.715, ssb_msybtrigger: 0.746 },
  { track: 'ices', species: 'European sprat',           stock: 'spr.27.3a4',       area: 'North Sea',   f_fmsy: 0.690, ssb_msybtrigger: 1.653, assessmentType: 'escapement' },
  { track: 'ices', species: 'Capelin',                  stock: 'cap.27.1-2',       area: 'Barents Sea', f_fmsy: 0.000, ssb_msybtrigger: 2.119, assessmentType: 'ssb_only' },
  { track: 'ices', species: 'Saithe',                   stock: 'pok.27.3a46',      area: 'North Sea',   f_fmsy: 0.901, ssb_msybtrigger: 1.081 },
  { track: 'ices', species: 'Arctic cod',               stock: 'cod.27.1-2',       area: 'NE Arctic',   f_fmsy: 1.100, ssb_msybtrigger: 1.961, fmsyRange: [0.733, 1.100] },
  { track: 'ices', species: 'Norwegian spring herring', stock: 'her.27.1-24a514a', area: 'NE Atlantic', f_fmsy: 1.159, ssb_msybtrigger: 1.151 },
]

export { proxyStocks } from './proxyStocksGenerated'

// These 6 categories are a custom visualization overlay, not an official ICES taxonomy.
// ICES uses the precautionary approach framework directly. See ICES CM 2004/ACFM:22.
export function classifyIces(s: IcesStock): Status {
  if (s.assessmentType === 'escapement') return 'Data-limited'
  if (s.assessmentType === 'ssb_only') {
    if (s.ssb_msybtrigger < 0.5) return 'Collapsed'   // SSB well below precautionary zone
    if (s.ssb_msybtrigger < 1.0) return 'Depleted'    // SSB between Blim and Btrigger
    return 'Stable'
  }
  const { f_fmsy: f, ssb_msybtrigger: ssb } = s
  if (ssb < 0.5 && f > 1.5) return 'Collapsed'        // below Blim proxy and heavily overfished
  if (ssb < 0.8 && f > 1.2) return 'Overexploited'    // in danger zone with excess fishing mortality
  if (ssb < 0.8) return 'Depleted'                    // below MSY Btrigger regardless of F
  if (f > 1.1) return 'Declining'                     // overfishing with biomass not yet depleted
  if (ssb > 1.2 && f < 0.9) return 'Recovering'       // biomass building under reduced mortality
  return 'Stable'
}

export function classifyProxy(s: ProxyStock): Status {
  if (s.flag === 'Data-limited') return 'Data-limited'
  const { depletion, tau, p } = s
  // Collapsed: C/Cmax < 0.10. Threshold from Kleisner & Pauly (2011) SSplots methodology;
  // 10% of peak catch indicates severe historical depletion.
  if (depletion < 0.10) return 'Collapsed'
  // Overexploited: moderate depletion band with a significant declining trend.
  // Depletion < 0.50 follows Martell & Froese (2013) 50% rule; trend significance per
  // Mann-Kendall p < 0.05 (Branch et al. 2011 two-indicator approach).
  if (depletion < 0.50 && tau < 0 && p < 0.05) return 'Overexploited'
  // Depleted: catch-all for the 0.10–0.50 band when trend is non-significant or positive.
  if (depletion < 0.50) return 'Depleted'
  // Declining: above 50% of peak but with a strong significant downward trend.
  // |τ| > 0.20 threshold follows Carruthers et al. (2012) sensitivity analysis.
  if (tau < -0.20 && p < 0.05) return 'Declining'
  // Recovering: above 50% of peak with a strong significant upward trend.
  if (tau > 0.20 && p < 0.05) return 'Recovering'
  return 'Stable'
}

export const STATUS_COLORS: Record<Status, string> = {
  Collapsed:       '#B33A3A',
  Overexploited:   '#C77D2E',
  Depleted:        '#D9A856',
  Declining:       '#6B8FAE',
  Stable:          '#4A8B6F',
  Recovering:      '#2C6E4F',
  'Data-limited':  '#8A8A82',
}

export const ALL_STATUSES: Status[] = ['Collapsed', 'Overexploited', 'Depleted', 'Declining', 'Stable', 'Recovering', 'Data-limited']
