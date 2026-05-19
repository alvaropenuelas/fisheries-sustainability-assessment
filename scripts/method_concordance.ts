#!/usr/bin/env node
/**
 * ICES formal assessment vs FAO catch-based proxy concordance check.
 * Six species with overlapping coverage across both tracks.
 *
 * Cod excluded from agreement counts (geographic mismatch: ICES Area 27
 * vs FAO 21). Herring uses North Sea stock only (her.27.3a47d); Norwegian
 * spring herring excluded (opposite classification, distinct management unit).
 * Agreement stats computed over n=4: NS herring, mackerel, haddock, blue whiting.
 *
 * Run: ./node_modules/.bin/tsx scripts/method_concordance.ts
 */
import { icesStocks, proxyStocks, classifyIces, classifyProxy } from '../src/data/stocks.js'
import type { IcesStock, ProxyStock, Status } from '../src/data/stocks.js'

// ─── helpers ─────────────────────────────────────────────────────────────────

function getIces(code: string): IcesStock {
  const s = icesStocks.find(x => x.stock === code)
  if (!s) throw new Error(`ICES stock not found: ${code}`)
  return s
}

function getProxy(name: string): ProxyStock {
  const s = proxyStocks.find(x => x.species === name)
  if (!s) throw new Error(`Proxy stock not found: ${name}`)
  return s
}

const STRESSED_SET = new Set<Status>(['Collapsed', 'Overexploited', 'Depleted', 'Declining'])
const isStressed = (s: Status): boolean | null =>
  s === 'Data-limited' ? null : STRESSED_SET.has(s)

function pad(s: string, n: number): string {
  return (s + ' '.repeat(n)).slice(0, n)
}

// ─── build the 6 pairs ───────────────────────────────────────────────────────

interface Pair {
  species:       string
  icesStock:     IcesStock
  proxyStock:    ProxyStock
  icesCat:       Status
  proxyCat:      Status
  icesStressed:  boolean | null
  proxyStressed: boolean | null
  geoMatch:      string   // YES / PARTIAL / NO
  comparable:    boolean  // included in agreement count
  footnote:      string
}

const pairs: Pair[] = [
  // Pair 1 — Atlantic cod
  // ICES Area 27 (NS + Barents Sea); proxy FAO 21 (Grand Banks). Different ocean basins.
  (() => {
    const is = getIces('cod.27.47d20')     // use NS cod (the depleted stock) for display
    const ps = getProxy('Atlantic cod')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'Atlantic cod', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: isStressed(ic), proxyStressed: isStressed(pc),
      geoMatch: 'NO',
      comparable: false,
      footnote: 'ICES = Area 27 (NS cod shown; NE Arctic excluded). Proxy = FAO 21 (NW Atlantic). Different populations — excluded from agreement stats.',
    }
  })(),

  // Pair 2 — Atlantic herring
  // Using NS herring only (her.27.3a47d) — closest geographic match to FAO 27 catch series.
  // Norwegian spring herring (ICES Declining) excluded: opposite classification to NS herring
  // and geographically distinct management unit.
  (() => {
    const is = getIces('her.27.3a47d')
    const ps = getProxy('Atlantic herring')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'Atlantic herring', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: isStressed(ic), proxyStressed: isStressed(pc),
      geoMatch: 'PARTIAL',
      comparable: true,
      footnote: 'NS herring only. Norwegian spring herring (her.27.1-24a514a, ICES Declining) excluded — opposite classification, distinct management unit.',
    }
  })(),

  // Pair 3 — Atlantic mackerel (clean match: both NEA / Area 27)
  (() => {
    const is = getIces('mac.27.nea')
    const ps = getProxy('Atlantic mackerel')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'Atlantic mackerel', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: isStressed(ic), proxyStressed: isStressed(pc),
      geoMatch: 'YES', comparable: true, footnote: '',
    }
  })(),

  // Pair 4 — Haddock (clean match: both Area 27, North Sea)
  (() => {
    const is = getIces('had.27.46a20')
    const ps = getProxy('Haddock')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'Haddock', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: isStressed(ic), proxyStressed: isStressed(pc),
      geoMatch: 'YES', comparable: true, footnote: '',
    }
  })(),

  // Pair 5 — Blue whiting (clean match: both NEA / Area 27)
  (() => {
    const is = getIces('whb.27.1-91214')
    const ps = getProxy('Blue whiting')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'Blue whiting', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: isStressed(ic), proxyStressed: isStressed(pc),
      geoMatch: 'YES', comparable: true, footnote: '',
    }
  })(),

  // Pair 6 — European sprat
  // ICES escapement-managed → Data-limited. Not directly comparable.
  (() => {
    const is = getIces('spr.27.3a4')
    const ps = getProxy('European sprat')
    const ic = classifyIces(is), pc = classifyProxy(ps)
    return {
      species: 'European sprat', icesStock: is, proxyStock: ps,
      icesCat: ic, proxyCat: pc,
      icesStressed: null, proxyStressed: isStressed(pc),
      geoMatch: 'YES',
      comparable: false,
      footnote: 'ICES = escapement-managed (Data-limited). SSB/Btrigger reference points inapplicable — not directly comparable.',
    }
  })(),
]

// ─── print table ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════════════════════════════════════════')
console.log('METHOD CONCORDANCE — ICES formal assessments vs FAO catch-based proxy')
console.log('══════════════════════════════════════════════════════════════════════════════════════════════')
console.log()
console.log(pad('Species', 22) + pad('ICES cat', 16) + pad('Proxy cat', 16) + pad('ICES-S', 8) + pad('Prx-S', 7) + pad('Geo match', 10) + 'In stats?')
console.log('─'.repeat(95))
for (const p of pairs) {
  const icesStr  = p.icesStressed  === null ? '—  ' : p.icesStressed  ? 'S  ' : 'N  '
  const proxyStr = p.proxyStressed === null ? '—  ' : p.proxyStressed ? 'S  ' : 'N  '
  console.log(
    pad(p.species, 22) +
    pad(p.icesCat, 16) +
    pad(p.proxyCat, 16) +
    pad(icesStr, 8) +
    pad(proxyStr, 7) +
    pad(p.geoMatch, 10) +
    (p.comparable ? 'YES' : 'NO')
  )
}
console.log('─'.repeat(95))
console.log()
console.log('Footnotes:')
pairs.filter(p => p.footnote).forEach(p => console.log(`  [${p.species}] ${p.footnote}`))

// ─── agreement stats (n=4) ────────────────────────────────────────────────────

const comp = pairs.filter(p => p.comparable)
const exactAgree = comp.filter(p => p.icesCat === p.proxyCat).length
const dirAgree   = comp.filter(p => p.icesStressed === p.proxyStressed).length

console.log(`\nAgreement stats (n=${comp.length}: ${comp.map(p => p.species).join(', ')})`)
console.log(`  Exact category agreement:             ${exactAgree}/${comp.length}`)
console.log(`  Directional (stressed vs not-stressed): ${dirAgree}/${comp.length}`)

// ─── Spearman ρ (n=4) ─────────────────────────────────────────────────────────

function rankAscending(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)
  const ranks = new Array<number>(values.length)
  for (let r = 0; r < indexed.length; r++) ranks[indexed[r].i] = r + 1
  return ranks
}

const deps = comp.map(p => p.proxyStock.depletion)
const ssbs = comp.map(p => p.icesStock.ssb_msybtrigger)
const depR = rankAscending(deps)
const ssbR = rankAscending(ssbs)
const n    = comp.length
const sumD2 = depR.reduce((acc, rd, i) => acc + (rd - ssbR[i]) ** 2, 0)
const rho   = 1 - (6 * sumD2) / (n * (n * n - 1))

console.log(`\nSpearman ρ — proxy depletion vs ICES SSB/MSYBtrigger (n=${n}):`)
console.log('  Species          dep     SSB/Btrig  dep-rank  ssb-rank  d²')
comp.forEach((p, i) => {
  const d = depR[i] - ssbR[i]
  console.log(`  ${pad(p.species, 17)} ${p.proxyStock.depletion.toFixed(3)}   ${p.icesStock.ssb_msybtrigger.toFixed(3)}      ${depR[i]}         ${ssbR[i]}         ${d*d}`)
})
console.log(`  sum(d²) = ${sumD2}`)
console.log(`  ρ = ${rho.toFixed(3)}  (n=${n}; descriptive only — not statistically inferential)`)
console.log()
