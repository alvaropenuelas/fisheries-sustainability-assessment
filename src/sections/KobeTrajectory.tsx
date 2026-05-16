import { useRef, useEffect, useState, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { classifyIces, STATUS_COLORS, icesStocks } from '../data/stocks'
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
import pokSeries       from '../data/timeseries/ices/pok.27.3a46.json'
import codArcticSeries from '../data/timeseries/ices/cod.27.1-2.json'
import herNSSSeries    from '../data/timeseries/ices/her.27.1-24a514a.json'

gsap.registerPlugin(ScrollTrigger)

const TRAJECTORY_COLORS: Record<string, string> = {
  'cod.27.47d20':     '#B33A3A',
  'her.27.3a47d':     '#2E86C1',
  'mac.27.nea':       '#E67E22',
  'had.27.46a20':     '#8E44AD',
  'whb.27.1-91214':   '#1A5276',
  'ple.27.420':       '#229954',
  'sol.27.4':         '#D4AC0D',
  'pok.27.3a46':      '#717D7E',
  'cod.27.1-2':       '#922B21',
  'her.27.1-24a514a': '#117A65',
}

// Short labels for SVG (space-constrained)
const SHORT_LABEL: Record<string, string> = {
  'cod.27.47d20':     'N.Sea cod',
  'her.27.3a47d':     'N.Sea herring',
  'mac.27.nea':       'Mackerel',
  'had.27.46a20':     'Haddock',
  'whb.27.1-91214':   'Blue whiting',
  'ple.27.420':       'Plaice',
  'sol.27.4':         'Sole',
  'pok.27.3a46':      'Saithe',
  'cod.27.1-2':       'Arctic cod',
  'her.27.1-24a514a': 'NS-S herring',
}

type SeriesRow = { year: number; f_fmsy?: number; ssb_msybtrigger?: number }

interface StockTrack {
  stock: string
  species: string
  color: string
  series: Array<{ year: number; f_fmsy: number; ssb_msybtrigger: number }>
  terminal: { f_fmsy: number; ssb_msybtrigger: number; year: number } | null
}

function buildTracks(): StockTrack[] {
  const rawData: Array<{ stock: string; data: { series: SeriesRow[] } }> = [
    { stock: 'cod.27.47d20',     data: codNSSeries     as { series: SeriesRow[] } },
    { stock: 'her.27.3a47d',     data: herNSSeries     as { series: SeriesRow[] } },
    { stock: 'mac.27.nea',       data: macSeries       as { series: SeriesRow[] } },
    { stock: 'had.27.46a20',     data: hadSeries       as { series: SeriesRow[] } },
    { stock: 'whb.27.1-91214',   data: whbSeries       as { series: SeriesRow[] } },
    { stock: 'ple.27.420',       data: pleSeries       as { series: SeriesRow[] } },
    { stock: 'sol.27.4',         data: solSeries       as { series: SeriesRow[] } },
    { stock: 'pok.27.3a46',      data: pokSeries       as { series: SeriesRow[] } },
    { stock: 'cod.27.1-2',       data: codArcticSeries as { series: SeriesRow[] } },
    { stock: 'her.27.1-24a514a', data: herNSSSeries    as { series: SeriesRow[] } },
  ]

  return rawData.map(({ stock, data }) => {
    const icesStock = icesStocks.find(s => s.stock === stock)!
    const complete = data.series
      .filter((r: SeriesRow) => r.f_fmsy != null && r.ssb_msybtrigger != null && r.year >= 1988)
      .map((r: SeriesRow) => ({ year: r.year, f_fmsy: r.f_fmsy!, ssb_msybtrigger: r.ssb_msybtrigger! }))
    const terminal = complete.length > 0 ? complete[complete.length - 1] : null
    return {
      stock,
      species: icesStock.species,
      color: TRAJECTORY_COLORS[stock],
      series: complete,
      terminal,
    }
  })
}

const TRACKS = buildTracks()
const MIN_YEAR = 1988
const MAX_YEAR = Math.max(...TRACKS.map(t => t.terminal?.year ?? MIN_YEAR))

// SVG chart constants
const W = 860
const H = 460
const ML = 72, MR = 20, MT = 20, MB = 44
const PW = W - ML - MR
const PH = H - MT - MB
const X_MAX = 2.0
const Y_MAX = 3.2

function xS(v: number) { return (v / X_MAX) * PW }
function yS(v: number) { return PH - (v / Y_MAX) * PH }

function ticks(max: number, count: number) {
  return Array.from({ length: count + 1 }, (_, i) => parseFloat(((max / count) * i).toFixed(2)))
}

function classifyPoint(f: number, ssb: number): ReturnType<typeof classifyIces> {
  if (ssb < 0.5 && f > 1.5) return 'Collapsed'
  if (ssb < 0.8 && f > 1.2) return 'Overexploited'
  if (ssb < 0.8) return 'Depleted'
  if (f > 1.1) return 'Declining'
  if (ssb > 1.2 && f < 0.9) return 'Recovering'
  return 'Stable'
}

// Most-recent point at or before the selected year — matches what the dots show
function latestPoint(track: StockTrack, year: number) {
  const pts = track.series.filter(r => r.year <= year)
  return pts.length > 0 ? pts[pts.length - 1] : null
}

export default function KobeTrajectory() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible]           = useState(false)
  const [year, setYear]                 = useState(MAX_YEAR)
  const [hoveredStock, setHoveredStock] = useState<string | null>(null)
  const [activeStock, setActiveStock]   = useState<string | null>(null)
  const [mousePos, setMousePos]         = useState({ x: 0, y: 0 })
  const { isDark, colors: c } = useTheme()

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => {
        setVisible(true)
        gsap.fromTo(
          '.traj-chart',
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
        )
        const obj = { y: MIN_YEAR }
        gsap.to(obj, {
          y: MAX_YEAR,
          duration: 3.5,
          ease: 'power1.inOut',
          onUpdate: () => setYear(Math.round(obj.y)),
          delay: 0.3,
        })
      },
    })
    return () => trigger.kill()
  }, [])

  const xTicks = useMemo(() => ticks(X_MAX, 8), [])
  const yTicks = useMemo(() => ticks(Y_MAX, 8), [])

  // Tooltip data derived from hover + current year
  const tooltipData = useMemo(() => {
    if (!hoveredStock) return null
    const track = TRACKS.find(t => t.stock === hoveredStock)
    if (!track) return null
    const pt = latestPoint(track, year)
    if (!pt) return null
    return {
      species: track.species,
      color:   track.color,
      f_fmsy:  pt.f_fmsy,
      ssb:     pt.ssb_msybtrigger,
      ptYear:  pt.year,
      status:  classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger),
    }
  }, [hoveredStock, year])

  // Tooltip for active (polyline-hovered) stock
  const activeTooltipData = useMemo(() => {
    if (!activeStock) return null
    const track = TRACKS.find(t => t.stock === activeStock)
    if (!track) return null
    const pt = latestPoint(track, year)
    if (!pt) return null
    return {
      species: track.species,
      color:   track.color,
      f_fmsy:  pt.f_fmsy,
      ssb:     pt.ssb_msybtrigger,
      ptYear:  pt.year,
      status:  classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger),
    }
  }, [activeStock, year])

  // Table: most-recent point at or before the selected year, for every track
  const tableRows = useMemo(() =>
    TRACKS.flatMap(track => {
      const pt = latestPoint(track, year)
      if (!pt) return []
      return [{
        species: track.species,
        color:   track.color,
        f_fmsy:  pt.f_fmsy,
        ssb:     pt.ssb_msybtrigger,
        ptYear:  pt.year,
        status:  classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger),
      }]
    }),
    [year]
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 8 })
  }

  return (
    <section
      ref={sectionRef}
      className="px-8 md:px-16 lg:px-24 py-24 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <SectionLabel number="02b" title="KOBE TRAJECTORIES" />

      <div className="mb-10">
        <h2
          className="font-mono text-3xl md:text-4xl font-semibold mb-3"
          style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
        >
          Historical Stock<br />Trajectories
        </h2>
        <p
          className="font-sans text-sm max-w-lg leading-relaxed"
          style={{ color: c.textMuted, transition: 'color 300ms ease' }}
        >
          The EU Common Fisheries Policy (2013) set legally binding MSY objectives for all
          commercially exploited stocks by 2020. The trajectories below show how each ICES-assessed
          stock has moved through Kobe space since 1988 — revealing which stocks responded to
          management and which remain in overfished or rebuilding states. Source: ICES SAG
          2023/2022/2021.
        </p>
        <p
          className="font-sans text-xs max-w-lg leading-relaxed mt-3"
          style={{ color: c.textSubtle, transition: 'color 300ms ease' }}
        >
          Sprat (spr.27.3a4) and Capelin (cap.27.1-2) are excluded: sprat uses an escapement-based
          assessment with no F/F<sub>MSY</sub> reference point; capelin uses SSB-only assessment.
          Both appear in Species Cards with their respective metrics.
        </p>
      </div>

      {visible && (
        <div className="traj-chart">
          <style>{`
            input[type=range]::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #2d6a4f;
              cursor: pointer;
              border: 2px solid #fff;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            }
          `}</style>

          {/* Year display + slider */}
          <div className="flex items-center gap-4 mb-4">
            <span
              className="font-mono text-4xl font-semibold tabular-nums w-20"
              style={{ color: c.accent }}
            >
              {year}
            </span>
            {(() => {
              const pct = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100
              return (
                <input
                  type="range"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    flex: '1 1 0%',
                    maxWidth: '24rem',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #2d6a4f ${pct}%, #d4c5a9 ${pct}%)`,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              )
            })()}
            <span
              className="font-mono text-[10px] tracking-[0.2em] uppercase"
              style={{ color: c.textMuted }}
            >
              {MIN_YEAR}–{MAX_YEAR}
            </span>
          </div>

          {/* SVG container — position:relative for tooltip overlay */}
          <div
            ref={containerRef}
            className="border"
            style={{
              position: 'relative',
              borderColor: c.cardBorder,
              backgroundColor: c.cardBg,
              padding: '16px',
              transition: 'background-color 300ms ease, border-color 300ms ease',
              overflowX: 'auto',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => { setHoveredStock(null); setActiveStock(null) }}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: '100%', height: 'auto', minWidth: '540px', display: 'block' }}
            >
              <defs>
                <clipPath id="kobe-clip">
                  <rect x={0} y={0} width={PW} height={PH} />
                </clipPath>
              </defs>

              <g transform={`translate(${ML},${MT})`}>
                {/* Quadrant backgrounds */}
                <rect x={0}     y={0}         width={xS(1)}        height={yS(0)}              fill="#B33A3A" fillOpacity={0.05} />
                <rect x={xS(1)} y={0}         width={PW - xS(1)}   height={yS(0)}              fill="#C77D2E" fillOpacity={0.05} />
                <rect x={0}     y={yS(Y_MAX)} width={xS(1)}        height={yS(1) - yS(Y_MAX)}  fill="#D9A856" fillOpacity={0.05} />
                <rect x={xS(1)} y={yS(Y_MAX)} width={PW - xS(1)}   height={yS(1) - yS(Y_MAX)}  fill="#4A8B6F" fillOpacity={0.05} />

                {/* Arctic cod FMSY uncertainty band */}
                <rect
                  x={xS(0.733)} y={0}
                  width={xS(1.100) - xS(0.733)} height={PH}
                  fill="#6B8FAE" fillOpacity={isDark ? 0.18 : 0.12}
                />

                {/* Grid lines */}
                {xTicks.map(v => (
                  <line key={v} x1={xS(v)} y1={0} x2={xS(v)} y2={PH}
                    stroke={isDark ? '#2a3a48' : '#e8e4df'} strokeWidth={1} />
                ))}
                {yTicks.map(v => (
                  <line key={v} x1={0} y1={yS(v)} x2={PW} y2={yS(v)}
                    stroke={isDark ? '#2a3a48' : '#e8e4df'} strokeWidth={1} />
                ))}

                {/* MSY reference lines */}
                <line x1={xS(1)} y1={0} x2={xS(1)} y2={PH}
                  stroke={isDark ? '#4a6a84' : '#9abacc'} strokeWidth={1.5} strokeDasharray="5 4" />
                <line x1={0} y1={yS(1)} x2={PW} y2={yS(1)}
                  stroke={isDark ? '#4a6a84' : '#9abacc'} strokeWidth={1.5} strokeDasharray="5 4" />

                <g clipPath="url(#kobe-clip)">
                  {/* Trajectory lines */}
                  {TRACKS.map(track => {
                    const pts = track.series
                      .filter(r => r.year <= year)
                      .map(r => `${xS(r.f_fmsy).toFixed(1)},${yS(r.ssb_msybtrigger).toFixed(1)}`)
                    if (pts.length < 2) return null
                    const isActive   = activeStock === track.stock
                    const isDimmed   = activeStock !== null && !isActive
                    return (
                      <polyline
                        key={track.stock}
                        points={pts.join(' ')}
                        fill="none"
                        stroke={track.color}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        strokeOpacity={activeStock === null ? 0.72 : isDimmed ? 0.08 : 1.0}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        style={{ transition: 'stroke-opacity 120ms, stroke-width 120ms', cursor: 'pointer' }}
                        onMouseEnter={() => setActiveStock(track.stock)}
                      />
                    )
                  })}

                  {/* Dots at latest visible position */}
                  {TRACKS.map(track => {
                    const pt = latestPoint(track, year)
                    if (!pt) return null
                    const isHovered  = hoveredStock === track.stock
                    const isDimmed   = hoveredStock !== null && !isHovered
                    const dotColor   = STATUS_COLORS[classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger)]
                    const cx = xS(pt.f_fmsy)
                    const cy = yS(pt.ssb_msybtrigger)
                    return (
                      <g
                        key={track.stock}
                        style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 120ms', cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredStock(track.stock)}
                      >
                        <circle cx={cx} cy={cy} r={isHovered ? 9 : 7}
                          fill={isDark ? dotColor : '#FFFFFF'}
                          stroke={isDark ? '#1A1A18' : dotColor}
                          strokeWidth={isDark ? 1.5 : 2}
                        />
                        <circle cx={cx} cy={cy} r={isHovered ? 4 : 3} fill={dotColor} />
                      </g>
                    )
                  })}

                  {/* Terminal year species labels — appear when terminal year is reached */}
                  {TRACKS.map(track => {
                    if (!track.terminal || year < track.terminal.year) return null
                    const cx = xS(track.terminal.f_fmsy)
                    const cy = yS(track.terminal.ssb_msybtrigger)
                    const isHovered = hoveredStock === track.stock
                    const isDimmed  = hoveredStock !== null && !isHovered
                    return (
                      <text
                        key={track.stock + '-label'}
                        x={cx + 6} y={cy - 6}
                        fontSize={10}
                        fontFamily="IBM Plex Mono"
                        fill={track.color}
                        opacity={isDimmed ? 0.15 : isHovered ? 1 : 0.75}
                        style={{ transition: 'opacity 120ms', pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {SHORT_LABEL[track.stock]}
                      </text>
                    )
                  })}

                  {/* Transparent wide hit areas — rendered last so they sit on top in SVG z-order */}
                  {TRACKS.map(track => {
                    const pts = track.series
                      .filter(r => r.year <= year)
                      .map(r => `${xS(r.f_fmsy).toFixed(1)},${yS(r.ssb_msybtrigger).toFixed(1)}`)
                    if (pts.length < 2) return null
                    return (
                      <polyline
                        key={track.stock + '-hit'}
                        points={pts.join(' ')}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setActiveStock(track.stock)}
                      />
                    )
                  })}
                </g>

                {/* Arctic cod FMSY range label */}
                <text
                  x={xS(0.916)} y={PH - 6}
                  textAnchor="middle" fontSize={8} fontFamily="IBM Plex Mono"
                  fontStyle="italic" fill={isDark ? '#6B8FAE' : '#4a6a84'} opacity={0.85}
                >
                  FMSY 0.40–0.60
                </text>

                {/* X axis */}
                {xTicks.map(v => (
                  <g key={v} transform={`translate(${xS(v)},${PH})`}>
                    <line y2={5} stroke={isDark ? '#3a4a58' : '#c8c4be'} />
                    <text y={18} textAnchor="middle" fontSize={10} fontFamily="IBM Plex Mono"
                      fill={isDark ? '#6a7a88' : '#7a7a72'}>{v}</text>
                  </g>
                ))}

                {/* Y axis */}
                {yTicks.map(v => (
                  <g key={v} transform={`translate(0,${yS(v)})`}>
                    <line x2={-5} stroke={isDark ? '#3a4a58' : '#c8c4be'} />
                    <text x={-9} textAnchor="end" dominantBaseline="middle" fontSize={10}
                      fontFamily="IBM Plex Mono" fill={isDark ? '#6a7a88' : '#7a7a72'}>{v}</text>
                  </g>
                ))}

                {/* Axis labels */}
                <text x={PW / 2} y={PH + 38} textAnchor="middle" fontSize={11}
                  fontFamily="IBM Plex Mono" fontStyle="italic" fill={isDark ? '#6a7a88' : '#7a7a72'}>
                  F / FMSY
                </text>
                <text x={-(PH / 2)} y={-52} textAnchor="middle" fontSize={11}
                  fontFamily="IBM Plex Mono" fontStyle="italic" fill={isDark ? '#6a7a88' : '#7a7a72'}
                  transform="rotate(-90)">
                  SSB / MSY B trigger
                </text>

                {/* Quadrant labels */}
                <text x={xS(0.5) - 4} y={14} textAnchor="middle" fontSize={8.5}
                  fontFamily="IBM Plex Mono" fontStyle="italic"
                  fill={isDark ? '#8a4a4a' : '#b36060'} opacity={0.7}>Overfished</text>
                <text x={xS(1.5) + 4} y={14} textAnchor="middle" fontSize={8.5}
                  fontFamily="IBM Plex Mono" fontStyle="italic"
                  fill={isDark ? '#7a8a5a' : '#7a8a5a'} opacity={0.7}>Sustainable</text>
              </g>
            </svg>

            {/* Hover tooltip — dot/legend hover */}
            {tooltipData && !activeTooltipData && (
              <div
                style={{
                  position: 'absolute',
                  left: mousePos.x,
                  top: mousePos.y,
                  pointerEvents: 'none',
                  zIndex: 50,
                  minWidth: 180,
                  backgroundColor: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: '4px',
                  padding: '8px',
                  boxShadow: isDark
                    ? '0 2px 12px rgba(0,0,0,0.5)'
                    : '0 2px 10px rgba(27,58,75,0.12)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '12px',
                  transition: 'background-color 300ms ease, border-color 300ms ease',
                }}
              >
                <div style={{ color: tooltipData.color, fontWeight: 600, marginBottom: '2px' }}>
                  {tooltipData.species}
                </div>
                <div style={{ color: c.textMuted, fontSize: '10px', marginBottom: '6px' }}>
                  {tooltipData.ptYear}
                </div>
                <StatusBadge status={tooltipData.status} size="sm" />
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
                    <span style={{ color: c.textMuted }}>F / FMSY</span>
                    <span style={{ color: c.textPrimary }}>{tooltipData.f_fmsy.toFixed(3)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ color: c.textMuted }}>SSB / Btrigger</span>
                    <span style={{ color: c.textPrimary }}>{tooltipData.ssb.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Polyline hover tooltip — activeStock */}
            {activeTooltipData && (
              <div
                style={{
                  position: 'absolute',
                  left: mousePos.x,
                  top: mousePos.y,
                  pointerEvents: 'none',
                  zIndex: 50,
                  minWidth: 180,
                  backgroundColor: c.tooltipBg,
                  border: `1px solid ${c.tooltipBorder}`,
                  borderRadius: '4px',
                  padding: '8px',
                  boxShadow: isDark
                    ? '0 2px 12px rgba(0,0,0,0.5)'
                    : '0 2px 10px rgba(27,58,75,0.12)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '12px',
                }}
              >
                <div style={{ color: activeTooltipData.color, fontWeight: 600, marginBottom: '2px' }}>
                  {activeTooltipData.species}
                </div>
                <div style={{ color: c.textMuted, fontSize: '10px', marginBottom: '6px' }}>
                  {activeTooltipData.ptYear}
                </div>
                <StatusBadge status={activeTooltipData.status} size="sm" />
                <div style={{ marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
                    <span style={{ color: c.textMuted }}>F / FMSY</span>
                    <span style={{ color: c.textPrimary }}>{activeTooltipData.f_fmsy.toFixed(3)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <span style={{ color: c.textMuted }}>SSB / Btrigger</span>
                    <span style={{ color: c.textPrimary }}>{activeTooltipData.ssb.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Year data table — most-recent point ≤ selected year for every track */}
          {tableRows.length > 0 && (
            <div
              className="mt-4 border overflow-x-auto"
              style={{
                borderColor: c.cardBorder,
                backgroundColor: c.cardBg,
                transition: 'background-color 300ms ease, border-color 300ms ease',
              }}
            >
              <table className="w-full font-mono text-[11px]" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${c.cardBorder}` }}>
                    {['Species', 'Year', 'F / FMSY', 'SSB / MSYBtrigger', 'Status'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left tracking-[0.15em] uppercase"
                        style={{ color: c.textMuted, fontWeight: 500 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr
                      key={row.species}
                      style={{
                        borderBottom: i < tableRows.length - 1 ? `1px solid ${c.border}` : undefined,
                        backgroundColor: hoveredStock === TRACKS[i]?.stock
                          ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                          : undefined,
                      }}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2.5 h-[2px] flex-shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }} />
                          <span style={{ color: c.textPrimary }}>{row.species}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 tabular-nums" style={{ color: c.textMuted }}>
                        {row.ptYear}
                      </td>
                      <td className="px-4 py-2 tabular-nums" style={{ color: c.textPrimary }}>
                        {row.f_fmsy.toFixed(3)}
                      </td>
                      <td className="px-4 py-2 tabular-nums" style={{ color: c.textPrimary }}>
                        {row.ssb.toFixed(3)}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {TRACKS.map(track => {
              const icesStock = icesStocks.find(s => s.stock === track.stock)!
              const status = classifyIces(icesStock)
              return (
                <div
                  key={track.stock}
                  className="flex items-center gap-2 p-2 border"
                  style={{
                    borderColor: c.border,
                    transition: 'border-color 300ms ease',
                    opacity: hoveredStock && hoveredStock !== track.stock ? 0.4 : 1,
                  }}
                  onMouseEnter={() => setHoveredStock(track.stock)}
                  onMouseLeave={() => setHoveredStock(null)}
                >
                  <div className="w-3 h-[2px] flex-shrink-0 rounded-full"
                    style={{ backgroundColor: track.color }} />
                  <div className="min-w-0">
                    <div className="font-sans text-[10px] truncate leading-tight"
                      style={{ color: c.textPrimary }}>
                      {track.species}
                    </div>
                    <StatusBadge status={status} size="sm" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
