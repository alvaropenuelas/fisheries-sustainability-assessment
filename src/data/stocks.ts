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

export const proxyStocks: ProxyStock[] = [
  { track: 'proxy', species: 'Atlantic horse mackerel', area: 'FAO 27', depletion: 0.04, tau: -0.79, p: 0.0001 },
  { track: 'proxy', species: 'Atlantic redfishes',      area: 'FAO 27', depletion: 0.10, tau: -0.83, p: 0.0001 },
  { track: 'proxy', species: 'Sandeels',                area: 'FAO 27', depletion: 0.08, tau: -0.58, p: 0.002  },
  { track: 'proxy', species: 'European sprat',          area: 'FAO 27', depletion: 0.47, tau: -0.28, p: 0.043  },
  { track: 'proxy', species: 'Atlantic herring',        area: 'FAO 27', depletion: 0.52, tau: -0.28, p: 0.051  },
  { track: 'proxy', species: 'Atlantic cod',            area: 'FAO 21', depletion: 0.55, tau: -0.12, p: 0.31   },
  { track: 'proxy', species: 'Atlantic mackerel',       area: 'FAO 27', depletion: 0.65, tau:  0.45, p: 0.0008 },
  { track: 'proxy', species: 'Blue whiting',            area: 'FAO 27', depletion: 0.76, tau:  0.28, p: 0.038  },
  { track: 'proxy', species: 'Haddock',                 area: 'FAO 27', depletion: 0.71, tau:  0.31, p: 0.028  },
  { track: 'proxy', species: 'American plaice',         area: 'FAO 21', depletion: 0.08, tau: -0.71, p: 0.0001 },
  { track: 'proxy', species: 'Yellowtail flounder',     area: 'FAO 21', depletion: 0.13, tau: -0.62, p: 0.0004 },
  { track: 'proxy', species: 'Atlantic wolffish',       area: 'FAO 27', depletion: 0.27, tau: -0.44, p: 0.009  },
]

export function classifyIces(s: IcesStock): Status {
  if (s.assessmentType === 'escapement') return 'Data-limited'
  if (s.assessmentType === 'ssb_only') {
    if (s.ssb_msybtrigger < 0.5) return 'Collapsed'
    if (s.ssb_msybtrigger < 1.0) return 'Depleted'
    return 'Stable'
  }
  const { f_fmsy: f, ssb_msybtrigger: ssb } = s
  if (ssb < 0.5 && f > 1.5) return 'Collapsed'
  if (ssb < 0.8 && f > 1.2) return 'Overexploited'
  if (ssb < 0.8) return 'Depleted'
  if (f > 1.1) return 'Declining'
  if (ssb > 1.2 && f < 0.9) return 'Recovering'
  return 'Stable'
}

export function classifyProxy(s: ProxyStock): Status {
  const { depletion, tau, p } = s
  if (depletion < 0.25) return 'Collapsed'
  if (depletion < 0.50 && p < 0.05 && tau < 0) return 'Overexploited'
  if (depletion < 0.50) return 'Depleted'
  if (depletion >= 0.50 && tau < -0.2 && p < 0.05) return 'Declining'
  if (depletion >= 0.50 && tau > 0.2 && p < 0.05) return 'Recovering'
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
