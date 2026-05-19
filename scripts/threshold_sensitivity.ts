#!/usr/bin/env node
/**
 * Threshold sensitivity analysis for proxy and ICES classification rules.
 * Applies three threshold sets (baseline, stricter ×0.8, looser ×1.2) to all
 * 24 stocks and reports which stocks flip between stressed / not-stressed.
 *
 * Run: npx tsx scripts/threshold_sensitivity.ts
 */
import { icesStocks } from '../src/data/stocks.js'
import { proxyStocks } from '../src/data/proxyStocksGenerated.js'
import type { IcesStock, ProxyStock, Status } from '../src/data/stocks.js'

// ─── threshold parameter types ───────────────────────────────────────────────

interface ProxyThresholds {
  collapseAt: number  // depletion < collapseAt → Collapsed
  bandTop:    number  // depletion < bandTop    → Overexploited / Depleted band
  tauMag:     number  // |τ| > tauMag && p<0.05 → Declining / Recovering
}

interface IcesThresholds {
  ssbCollapse:    number  // SSB < ssbCollapse && F > fCollapse  → Collapsed
  fCollapse:      number
  ssbOverexp:     number  // SSB < ssbOverexp  && F > fOverexp   → Overexploited
  fOverexp:       number
  ssbDepleted:    number  // SSB < ssbDepleted                   → Depleted
  fDeclining:     number  // F > fDeclining                      → Declining
  ssbRecovering:  number  // SSB > ssbRecovering && F < fRecover → Recovering
  fRecovering:    number
  // ssb_only stocks use ssbOnlyCollapse / ssbOnlyDepleted
  ssbOnlyCollapse: number
  ssbOnlyDepleted: number
}

// ─── three threshold sets ─────────────────────────────────────────────────────

const PROXY_BASELINE: ProxyThresholds = { collapseAt: 0.10, bandTop: 0.50, tauMag: 0.20 }
const PROXY_STRICTER: ProxyThresholds = { collapseAt: 0.08, bandTop: 0.40, tauMag: 0.16 }
const PROXY_LOOSER:   ProxyThresholds = { collapseAt: 0.12, bandTop: 0.60, tauMag: 0.24 }

const ICES_BASELINE: IcesThresholds = {
  ssbCollapse: 0.50, fCollapse: 1.50,
  ssbOverexp:  0.80, fOverexp:  1.20,
  ssbDepleted: 0.80,
  fDeclining:  1.10,
  ssbRecovering: 1.20, fRecovering: 0.90,
  ssbOnlyCollapse: 0.50, ssbOnlyDepleted: 1.00,
}
const ICES_STRICTER: IcesThresholds = {
  ssbCollapse: 0.40, fCollapse: 1.20,
  ssbOverexp:  0.64, fOverexp:  0.96,
  ssbDepleted: 0.64,
  fDeclining:  0.88,
  ssbRecovering: 0.96, fRecovering: 0.72,
  ssbOnlyCollapse: 0.40, ssbOnlyDepleted: 0.80,
}
const ICES_LOOSER: IcesThresholds = {
  ssbCollapse: 0.60, fCollapse: 1.80,
  ssbOverexp:  0.96, fOverexp:  1.44,
  ssbDepleted: 0.96,
  fDeclining:  1.32,
  ssbRecovering: 1.44, fRecovering: 1.08,
  ssbOnlyCollapse: 0.60, ssbOnlyDepleted: 1.20,
}

// ─── parameterised classifiers ────────────────────────────────────────────────

function classifyProxyVariant(s: ProxyStock, t: ProxyThresholds): Status {
  if (s.flag === 'Data-limited') return 'Data-limited'
  const { depletion: d, tau, p } = s
  if (d < t.collapseAt)                          return 'Collapsed'
  if (d < t.bandTop && tau < 0 && p < 0.05)      return 'Overexploited'
  if (d < t.bandTop)                             return 'Depleted'
  if (tau < -t.tauMag && p < 0.05)               return 'Declining'
  if (tau >  t.tauMag && p < 0.05)               return 'Recovering'
  return 'Stable'
}

function classifyIcesVariant(s: IcesStock, t: IcesThresholds): Status {
  if (s.assessmentType === 'escapement') return 'Data-limited'
  if (s.assessmentType === 'ssb_only') {
    if (s.ssb_msybtrigger < t.ssbOnlyCollapse) return 'Collapsed'
    if (s.ssb_msybtrigger < t.ssbOnlyDepleted) return 'Depleted'
    return 'Stable'
  }
  const { f_fmsy: f, ssb_msybtrigger: ssb } = s
  if (ssb < t.ssbCollapse && f > t.fCollapse) return 'Collapsed'
  if (ssb < t.ssbOverexp  && f > t.fOverexp)  return 'Overexploited'
  if (ssb < t.ssbDepleted)                    return 'Depleted'
  if (f > t.fDeclining)                       return 'Declining'
  if (ssb > t.ssbRecovering && f < t.fRecovering) return 'Recovering'
  return 'Stable'
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const STRESSED: Set<Status> = new Set(['Collapsed', 'Overexploited', 'Depleted', 'Declining'])

function isStressed(status: Status): boolean {
  return STRESSED.has(status)
}

function stressChar(status: Status): string {
  if (status === 'Data-limited') return ' DL '
  return isStressed(status) ? '  S ' : '  N '
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

// ─── main ────────────────────────────────────────────────────────────────────

type Row = {
  label:    string
  track:    'proxy' | 'ices'
  base:     Status
  strict:   Status
  loose:    Status
  flips:    number
}

const rows: Row[] = []

for (const s of proxyStocks) {
  const base   = classifyProxyVariant(s, PROXY_BASELINE)
  const strict = classifyProxyVariant(s, PROXY_STRICTER)
  const loose  = classifyProxyVariant(s, PROXY_LOOSER)
  const flips  = countFlips([base, strict, loose])
  rows.push({ label: s.species + ' (proxy)', track: 'proxy', base, strict, loose, flips })
}

for (const s of icesStocks) {
  const base   = classifyIcesVariant(s, ICES_BASELINE)
  const strict = classifyIcesVariant(s, ICES_STRICTER)
  const loose  = classifyIcesVariant(s, ICES_LOOSER)
  const flips  = countFlips([base, strict, loose])
  rows.push({ label: s.species + ' (' + s.area + ')', track: 'ices', base, strict, loose, flips })
}

function countFlips(statuses: Status[]): number {
  // Count transitions in the stressed/not-stressed binary across [base, strict, loose].
  // Data-limited stocks are excluded from flip counting (return -1).
  if (statuses.some(st => st === 'Data-limited')) return -1
  let flips = 0
  for (let i = 1; i < statuses.length; i++) {
    if (isStressed(statuses[i]) !== isStressed(statuses[i - 1])) flips++
  }
  return flips
}

// Print table
console.log('\n══════════════════════════════════════════════════════════════════════════════════════════')
console.log('THRESHOLD SENSITIVITY — proxy ±20% depletion/tau, ICES ±20% SSB/F reference points')
console.log('══════════════════════════════════════════════════════════════════════════════════════════')
console.log(pad('Stock', 40) + pad('Baseline', 16) + pad('Stricter×0.8', 16) + pad('Looser×1.2', 16) + 'Stress-flips')
console.log('─'.repeat(92))

for (const r of rows) {
  const flipStr = r.flips === -1 ? '  — ' : `  ${r.flips}  `
  console.log(
    pad(r.label, 40) +
    pad(r.base + stressChar(r.base), 16) +
    pad(r.strict + stressChar(r.strict), 16) +
    pad(r.loose + stressChar(r.loose), 16) +
    flipStr
  )
}

console.log('─'.repeat(92))

// Summary
const assessable = rows.filter(r => r.flips !== -1)
const robust     = assessable.filter(r => r.flips === 0)
const sensitive  = assessable.filter(r => r.flips > 0)

console.log(`\nAssessable stocks (excl. Data-limited): ${assessable.length}`)
console.log(`Robust (never flip stressed ↔ not-stressed): ${robust.length}/${assessable.length}`)
console.log(`Sensitive (flip ≥1 time): ${sensitive.length}/${assessable.length}`)

console.log('\nSensitive stocks:')
for (const r of sensitive) {
  const states = [r.base, r.strict, r.loose]
  const desc   = states.map(st => `${st}(${isStressed(st) ? 'S' : 'N'})`).join(' → ')
  console.log(`  ${r.label}: ${desc}`)
}

console.log()
