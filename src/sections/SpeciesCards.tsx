import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { icesStocks, proxyStocks, classifyIces, classifyProxy, STATUS_COLORS } from '../data/stocks'
import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

import codNSSeries     from '../data/timeseries/ices/cod.27.47d20.json'
import herNSSeries     from '../data/timeseries/ices/her.27.3a47d.json'
import macSeries       from '../data/timeseries/ices/mac.27.nea.json'
import hadSeries       from '../data/timeseries/ices/had.27.46a20.json'
import whbSeries       from '../data/timeseries/ices/whb.27.1-91214.json'
import pleSeries       from '../data/timeseries/ices/ple.27.420.json'
import solSeries       from '../data/timeseries/ices/sol.27.4.json'
import sprSeries       from '../data/timeseries/ices/spr.27.3a4.json'
import capSeries       from '../data/timeseries/ices/cap.27.1-2.json'
import pokSeries       from '../data/timeseries/ices/pok.27.3a46.json'
import codArcticSeries from '../data/timeseries/ices/cod.27.1-2.json'
import herNSSSeries    from '../data/timeseries/ices/her.27.1-24a514a.json'

type Track = 'ices' | 'proxy'

// Build sparkline data (last 15 years of SSB ratio) for each ICES stock
type SparkRow = { year: number; ssb_msybtrigger: number }
type SeriesJson = { series: Array<{ year: number; ssb_msybtrigger?: number }> }

function buildSparkline(json: SeriesJson, n = 15): SparkRow[] {
  return (json.series as Array<{ year: number; ssb_msybtrigger?: number }>)
    .filter(r => r.ssb_msybtrigger != null)
    .slice(-n)
    .map(r => ({ year: r.year, ssb_msybtrigger: r.ssb_msybtrigger! }))
}

const SPARKLINES: Record<string, SparkRow[]> = {
  'cod.27.47d20':     buildSparkline(codNSSeries as SeriesJson),
  'her.27.3a47d':     buildSparkline(herNSSeries as SeriesJson),
  'mac.27.nea':       buildSparkline(macSeries as SeriesJson),
  'had.27.46a20':     buildSparkline(hadSeries as SeriesJson),
  'whb.27.1-91214':   buildSparkline(whbSeries as SeriesJson),
  'ple.27.420':       buildSparkline(pleSeries as SeriesJson),
  'sol.27.4':         buildSparkline(solSeries as SeriesJson),
  'spr.27.3a4':       buildSparkline(sprSeries as SeriesJson),
  'cap.27.1-2':       buildSparkline(capSeries as SeriesJson),
  'pok.27.3a46':      buildSparkline(pokSeries as SeriesJson),
  'cod.27.1-2':       buildSparkline(codArcticSeries as SeriesJson),
  'her.27.1-24a514a': buildSparkline(herNSSSeries as SeriesJson),
}

function Sparkline({ data, color }: { data: SparkRow[]; color: string }) {
  if (data.length < 2) return null
  const W = 100, H = 22
  const vals = data.map(r => r.ssb_msybtrigger)
  const min = Math.min(...vals) * 0.9
  const max = Math.max(...vals) * 1.05
  const xScale = (i: number) => (i / (data.length - 1)) * W
  const yScale = (v: number) => H - ((v - min) / (max - min)) * H
  const pts = data.map((r, i) => `${xScale(i).toFixed(1)},${yScale(r.ssb_msybtrigger).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}>
      {/* Reference line at SSB/MSYBtrigger = 1.0 */}
      {min < 1 && max > 1 && (
        <line
          x1={0} y1={yScale(1)} x2={W} y2={yScale(1)}
          stroke={color} strokeWidth={0.8} strokeDasharray="2 2" strokeOpacity={0.3}
        />
      )}
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeOpacity={0.75}
      />
      {/* Terminal dot */}
      <circle
        cx={xScale(data.length - 1)}
        cy={yScale(vals[vals.length - 1])}
        r={2.5}
        fill={color}
        fillOpacity={0.9}
      />
    </svg>
  )
}

function TrendArrow({ direction }: { direction: 'up' | 'down' | 'neutral' }) {
  if (direction === 'up') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#2C6E4F' }}>
      <path d="M7 2L12 9H2L7 2Z" fill="currentColor" fillOpacity="0.9" />
    </svg>
  )
  if (direction === 'down') return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#B33A3A' }}>
      <path d="M7 12L2 5H12L7 12Z" fill="currentColor" fillOpacity="0.9" />
    </svg>
  )
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#8A8A82' }}>
      <rect x="2" y="6" width="10" height="2" fill="currentColor" fillOpacity="0.6" />
    </svg>
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 },
  }),
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.15 } },
}

export default function SpeciesCards() {
  const [track, setTrack] = useState<Track>('ices')
  const { colors: c } = useTheme()

  const icesData = icesStocks.map(s => {
    const status = classifyIces(s)
    const trend =
      status === 'Recovering' ? 'up'
      : ['Collapsed', 'Overexploited', 'Declining'].includes(status) ? 'down'
      : 'neutral'
    const isEscapement = s.assessmentType === 'escapement'
    const isSSBOnly = s.assessmentType === 'ssb_only'
    return {
      key: s.stock,
      stock: s.stock,
      species: s.species,
      area: s.area,
      status,
      metric: isSSBOnly
        ? s.ssb_msybtrigger.toFixed(2)
        : isEscapement
          ? s.ssb_msybtrigger.toFixed(2)
          : s.f_fmsy.toFixed(2),
      metricLabel: isSSBOnly ? 'SSB / Ref'
        : isEscapement ? 'SSB / B_esc'
        : 'F / Fₘₛᵧ',
      trend,
      sparkline: SPARKLINES[s.stock] ?? null,
      assessmentType: s.assessmentType,
    }
  })

  const proxyData = proxyStocks.map(s => {
    const status = classifyProxy(s)
    const trend =
      status === 'Recovering' ? 'up'
      : ['Collapsed', 'Overexploited', 'Declining'].includes(status) ? 'down'
      : 'neutral'
    return {
      key: s.species + s.area,
      stock: null as string | null,
      species: s.species,
      area: s.area,
      status,
      metric: s.depletion.toFixed(2),
      metricLabel: 'Depletion',
      trend,
      sparkline: null as SparkRow[] | null,
      assessmentType: undefined as string | undefined,
    }
  })

  const cards = track === 'ices' ? icesData : proxyData

  return (
    <section
      className="px-8 md:px-16 lg:px-24 py-24 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <SectionLabel number="04" title="SPECIES CARDS" />

      <div className="flex items-start justify-between gap-8 mb-12">
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-3"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Stock-by-Stock<br />Overview
          </h2>
          <p
            className="font-sans text-sm max-w-md leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Per-stock assessment results. Toggle between ICES direct assessments and
            FAO catch-based proxy classifications.
          </p>
          <p
            className="font-sans text-sm max-w-md leading-relaxed mt-2"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            {track === 'ices'
              ? 'Sparkline shows SSB / MSY Bₛᶔᵏᵏᵉʳ ratio over 15 years. Dashed line = reference threshold.'
              : 'F/Fₘₛᵧ: fishing mortality relative to maximum sustainable yield. Values above 1.0 indicate overfishing.'}
          </p>
        </div>

        {/* Track toggle */}
        <div
          className="flex-shrink-0 flex font-mono text-xs"
          style={{ border: `1px solid ${c.border}`, transition: 'border-color 300ms ease' }}
        >
          {(['ices', 'proxy'] as Track[]).map(t => (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className="relative px-6 py-3 tracking-[0.2em] uppercase transition-colors duration-200"
              style={{
                color: track === t ? c.bg : c.textMuted,
                backgroundColor: track === t ? c.accent : 'transparent',
              }}
            >
              {t === 'ices' ? 'ICES Direct' : 'FAO Proxy'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={track}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.key}
              custom={i}
              variants={cardVariants}
              whileHover={{ borderColor: c.borderDefined, transition: { duration: 0.15 } }}
              className="border p-5 cursor-default"
              style={{
                borderColor: c.cardBorder,
                backgroundColor: c.cardBg,
                transition: 'background-color 300ms ease, border-color 300ms ease',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3
                  className="font-sans text-sm font-medium leading-tight"
                  style={{ color: c.cardText, transition: 'color 300ms ease' }}
                >
                  {card.species}
                </h3>
                <TrendArrow direction={card.trend as 'up' | 'down' | 'neutral'} />
              </div>

              {/* Metric */}
              <div className="mb-2">
                <div
                  className="font-mono text-2xl font-semibold mb-0.5"
                  style={{ color: STATUS_COLORS[card.status] }}
                >
                  {card.metric}
                </div>
                <div
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: c.cardTextMuted, transition: 'color 300ms ease' }}
                >
                  {card.metricLabel}
                </div>
              </div>

              {/* Sparkline (ICES track only) */}
              {card.sparkline && card.sparkline.length >= 2 && (
                <div className="mb-3 mt-1">
                  <Sparkline data={card.sparkline} color={STATUS_COLORS[card.status]} />
                  {card.assessmentType === 'escapement' && (
                    <div className="font-mono text-[8px] mt-0.5" style={{ color: c.cardTextMuted }}>
                      Escapement-managed · SSB/B_esc
                    </div>
                  )}
                  {card.assessmentType === 'ssb_only' && (
                    <div className="font-mono text-[8px] mt-0.5" style={{ color: c.cardTextMuted }}>
                      SSB-only assessment
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={card.status} size="sm" />
                <span
                  className="font-mono text-[10px]"
                  style={{ color: c.cardTextMuted, transition: 'color 300ms ease' }}
                >
                  {card.area}
                </span>
              </div>

              {card.species === 'Atlantic cod' && card.area === 'FAO 21' && (
                <p
                  className="font-sans text-[10px] leading-relaxed mt-2"
                  style={{ color: c.cardTextMuted, fontStyle: 'italic' }}
                >
                  Depletion ratio 0.55 vs historical peak. No significant catch trend detected
                  (τ = −0.12, p = 0.31). Stable reflects catch trend only — this stock experienced
                  a major collapse in the 1990s.
                </p>
              )}
              {card.species === 'Arctic cod' && (
                <p
                  className="font-sans text-[10px] leading-relaxed mt-2"
                  style={{ color: c.cardTextMuted, fontStyle: 'italic' }}
                >
                  Terminal year 2020: Arctic cod (Barents Sea) is assessed under the
                  Norwegian-Russian Joint Fisheries Commission cycle, which operates on a
                  different schedule than ICES Area 27 assessments. 2020 is the most recent
                  year available in ICES SAG for this stock.
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}
