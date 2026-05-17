import type { ProxyStock } from './stocks'

// Hardcoded values manually transcribed from FAO FishStat (May 2026).
// Used as fallback when the FAO pipeline has not been run.
// To recompute: npm run fetch-fao && npm run generate-proxy
export const proxyStocks: ProxyStock[] = [
  { track: 'proxy', species: 'Atlantic horse mackerel', area: 'FAO 27', depletion: 0.04, tau: -0.79, p: 0.0001 },
  {
    track: 'proxy', species: 'Atlantic redfishes', area: 'FAO 27', depletion: 0.10, tau: -0.83, p: 0.0001,
    flag: 'Data-limited',
    note: 'Pre-2000 reporting discontinuity in REG+REB catches makes depletion ratio and tau uninterpretable. Excluded from proxy classification.',
  },
  { track: 'proxy', species: 'Sandeels',                area: 'FAO 27', depletion: 0.08, tau: -0.58, p: 0.0020 },
  { track: 'proxy', species: 'European sprat',          area: 'FAO 27', depletion: 0.47, tau: -0.28, p: 0.0430 },
  { track: 'proxy', species: 'Atlantic herring',        area: 'FAO 27', depletion: 0.52, tau: -0.28, p: 0.0510 },
  { track: 'proxy', species: 'Atlantic cod',            area: 'FAO 21', depletion: 0.55, tau: -0.12, p: 0.3100 },
  { track: 'proxy', species: 'Atlantic mackerel',       area: 'FAO 27', depletion: 0.65, tau:  0.45, p: 0.0008 },
  { track: 'proxy', species: 'Blue whiting',            area: 'FAO 27', depletion: 0.76, tau:  0.28, p: 0.0380 },
  {
    track: 'proxy', species: 'Haddock', area: 'FAO 27', depletion: 0.71, tau: 0.31, p: 0.0280,
    note: 'Sharp 2013 catch break (420 kt → 299 kt in one year) suggests quota change rather than biomass decline. ICES direct assessment classifies this stock as Recovering — this divergence is a textbook example of catch-based proxy bias (Branch et al. 2011).',
  },
  { track: 'proxy', species: 'American plaice',         area: 'FAO 21', depletion: 0.08, tau: -0.71, p: 0.0001 },
  { track: 'proxy', species: 'Yellowtail flounder',     area: 'FAO 21', depletion: 0.13, tau: -0.62, p: 0.0004 },
  { track: 'proxy', species: 'Atlantic wolffish',       area: 'FAO 27', depletion: 0.27, tau: -0.44, p: 0.0090 },
]
