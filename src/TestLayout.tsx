import { useState, useMemo, useRef } from 'react'
import { icesStocks, classifyIces, STATUS_COLORS } from './data/stocks'
import StatusBadge from './components/StatusBadge'
import { useTheme, ThemeProvider } from './context/ThemeContext'

import codNSSeries     from './data/timeseries/ices/cod.27.47d20.json'
import herNSSeries     from './data/timeseries/ices/her.27.3a47d.json'
import macSeries       from './data/timeseries/ices/mac.27.nea.json'
import hadSeries       from './data/timeseries/ices/had.27.46a20.json'
import whbSeries       from './data/timeseries/ices/whb.27.1-91214.json'
import pleSeries       from './data/timeseries/ices/ple.27.420.json'
import solSeries       from './data/timeseries/ices/sol.27.4.json'
import pokSeries       from './data/timeseries/ices/pok.27.3a46.json'
import codArcticSeries from './data/timeseries/ices/cod.27.1-2.json'
import herNSSSeries    from './data/timeseries/ices/her.27.1-24a514a.json'

type SeriesRow = { year: number; f_fmsy?: number; ssb_msybtrigger?: number }

const TRAJ_COLORS: Record<string, string> = {
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

const RAW = [
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

const TRACKS = RAW.map(({ stock, data }) => {
  const icesStock = icesStocks.find(s => s.stock === stock)!
  const series = data.series
    .filter((r: SeriesRow) => r.f_fmsy != null && r.ssb_msybtrigger != null && r.year >= 1988)
    .map((r: SeriesRow) => ({ year: r.year, f_fmsy: r.f_fmsy!, ssb_msybtrigger: r.ssb_msybtrigger! }))
  const terminal = series.length > 0 ? series[series.length - 1] : null
  return { stock, species: icesStock.species, color: TRAJ_COLORS[stock], series, terminal }
})

const MIN_YEAR = 1988
const MAX_YEAR = Math.max(...TRACKS.map(t => t.terminal?.year ?? MIN_YEAR))

const W = 700, H = 420
const ML = 64, MR = 16, MT = 16, MB = 40
const PW = W - ML - MR
const PH = H - MT - MB
const X_MAX = 2.0, Y_MAX = 4.0

const xS = (v: number) => (v / X_MAX) * PW
const yS = (v: number) => PH - (v / Y_MAX) * PH

function latestPoint(track: typeof TRACKS[0], year: number) {
  const pts = track.series.filter(r => r.year <= year)
  return pts.length > 0 ? pts[pts.length - 1] : null
}

function classifyPoint(f: number, ssb: number) {
  const s = icesStocks[0]
  return classifyIces({ ...s, f_fmsy: f, ssb_msybtrigger: ssb })
}

function xTicks() {
  const out: number[] = []
  for (let v = 0; v <= X_MAX; v += 0.25) out.push(v)
  return out
}
function yTicks() {
  const out: number[] = []
  for (let v = 0; v <= Y_MAX; v += 0.5) out.push(v)
  return out
}

function Inner() {
  const [year, setYear] = useState(MAX_YEAR)
  const [hovered, setHovered] = useState<string | null>(null)
  const [locked, setLocked] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const svgContainerRef = useRef<HTMLDivElement>(null)
  const { colors: c, isDark } = useTheme()

  const active = locked ?? hovered

  const tableRows = useMemo(() =>
    TRACKS.flatMap(track => {
      const pt = latestPoint(track, year)
      if (!pt) return []
      return [{ stock: track.stock, species: track.species, color: track.color, f_fmsy: pt.f_fmsy, ssb: pt.ssb_msybtrigger, ptYear: pt.year, status: classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger) }]
    }),
    [year]
  )

  const tooltipData = useMemo(() => {
    if (!active) return null
    const track = TRACKS.find(t => t.stock === active)
    if (!track) return null
    const pt = latestPoint(track, year)
    if (!pt) return null
    const status = classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger)
    return { species: track.species, ptYear: pt.year, f_fmsy: pt.f_fmsy, ssb: pt.ssb_msybtrigger, status, color: STATUS_COLORS[status] }
  }, [active, year])

  const pct = ((year - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100

  const handleSvgMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left + 14, y: e.clientY - rect.top - 8 })
  }

  const handleSvgClick = (e: React.MouseEvent<SVGElement>) => {
    if ((e.target as SVGElement).tagName !== 'polyline') {
      setLocked(null)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: c.bg, fontFamily: 'IBM Plex Mono, monospace', overflow: 'hidden' }}>

      {/* Left 60% */}
      <div style={{ flex: '0 0 60%', overflowY: 'auto', padding: '32px 24px 32px 32px', borderRight: `1px solid ${c.cardBorder}` }}>
        <div style={{ color: c.textMuted, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Test Layout — Kobe Trajectories
        </div>

        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <span style={{ color: c.accent, fontSize: '36px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: '72px' }}>
            {year}
          </span>
          <style>{`
            #tl-slider::-webkit-slider-thumb {
              appearance: none; width: 16px; height: 16px;
              border-radius: 50%; background: #2d6a4f;
              cursor: pointer; border: 2px solid #fff;
              box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            }
          `}</style>
          <input
            id="tl-slider"
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              flex: '1 1 0%', height: '6px', borderRadius: '3px',
              background: `linear-gradient(to right, #2d6a4f ${pct}%, ${isDark ? '#2a3a2a' : '#d4c5a9'} ${pct}%)`,
              outline: 'none', cursor: 'pointer',
            }}
          />
          <span style={{ color: c.textMuted, fontSize: '10px' }}>{MIN_YEAR}–{MAX_YEAR}</span>
        </div>

        {/* Chart */}
        <div
          ref={svgContainerRef}
          style={{ border: `1px solid ${c.cardBorder}`, backgroundColor: c.cardBg, padding: '12px', overflowX: 'auto', position: 'relative' }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={() => { if (!locked) setHovered(null) }}
        >
          {/* Tooltip */}
          {tooltipData && (
            <div style={{
              position: 'absolute',
              left: mousePos.x,
              top: mousePos.y,
              pointerEvents: 'none',
              backgroundColor: c.tooltipBg ?? (isDark ? '#1a2a2a' : '#fff'),
              border: `1px solid ${c.tooltipBorder ?? c.cardBorder}`,
              padding: '8px 10px',
              fontSize: '10px',
              lineHeight: '1.6',
              zIndex: 10,
              minWidth: '160px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>
              <div style={{ fontWeight: 600, fontSize: '11px', color: c.textPrimary, marginBottom: '4px' }}>
                {tooltipData.species}
              </div>
              <div style={{ color: c.textMuted, marginBottom: '4px' }}>
                Year: {tooltipData.ptYear}
              </div>
              <div style={{ color: c.textPrimary }}>F/Fmsy: {tooltipData.f_fmsy.toFixed(3)}</div>
              <div style={{ color: c.textPrimary }}>SSB/Btrig: {tooltipData.ssb.toFixed(3)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tooltipData.color, flexShrink: 0 }} />
                <span style={{ color: tooltipData.color, fontSize: '10px' }}>{tooltipData.status}</span>
              </div>
              {locked && (
                <div style={{ color: c.textMuted, fontSize: '9px', marginTop: '4px' }}>locked · click elsewhere to reset</div>
              )}
            </div>
          )}

          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block', cursor: active ? 'pointer' : 'default' }}
            onClick={handleSvgClick}
          >
            <defs>
              <clipPath id="tl-clip"><rect x={0} y={0} width={PW} height={PH} /></clipPath>
            </defs>
            <g transform={`translate(${ML},${MT})`}>
              {/* Quadrant backgrounds */}
              <rect x={0}     y={0}      width={xS(1)}      height={yS(0)}         fill="#B33A3A" fillOpacity={0.05} />
              <rect x={xS(1)} y={0}      width={PW-xS(1)}   height={yS(0)}         fill="#C77D2E" fillOpacity={0.05} />
              <rect x={0}     y={yS(1)}  width={xS(1)}      height={yS(0)-yS(1)}   fill="#D9A856" fillOpacity={0.05} />
              <rect x={xS(1)} y={yS(1)}  width={PW-xS(1)}   height={yS(0)-yS(1)}   fill="#4A8B6F" fillOpacity={0.05} />

              {/* Grid */}
              {xTicks().map(v => (
                <line key={v} x1={xS(v)} y1={0} x2={xS(v)} y2={PH} stroke={isDark ? '#2a3a48' : '#e8e4df'} strokeWidth={1} />
              ))}
              {yTicks().map(v => (
                <line key={v} x1={0} y1={yS(v)} x2={PW} y2={yS(v)} stroke={isDark ? '#2a3a48' : '#e8e4df'} strokeWidth={1} />
              ))}

              {/* MSY reference lines */}
              <line x1={xS(1)} y1={0} x2={xS(1)} y2={PH} stroke={isDark ? '#4a6a84' : '#9abacc'} strokeWidth={1.5} strokeDasharray="5 4" />
              <line x1={0} y1={yS(1)} x2={PW} y2={yS(1)} stroke={isDark ? '#4a6a84' : '#9abacc'} strokeWidth={1.5} strokeDasharray="5 4" />

              <g clipPath="url(#tl-clip)">
                {/* Trajectory lines */}
                {TRACKS.map(track => {
                  const pts = track.series
                    .filter(r => r.year <= year)
                    .map(r => `${xS(r.f_fmsy).toFixed(1)},${yS(r.ssb_msybtrigger).toFixed(1)}`)
                  if (pts.length < 2) return null
                  const isActive  = active === track.stock
                  const isDimmed  = active !== null && !isActive
                  return (
                    <polyline
                      key={track.stock}
                      points={pts.join(' ')}
                      fill="none"
                      stroke={track.color}
                      strokeWidth={isActive ? 3 : 1.5}
                      strokeOpacity={isDimmed ? 0.15 : 0.72}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      style={{ transition: 'stroke-opacity 100ms, stroke-width 100ms', cursor: 'pointer' }}
                      onMouseEnter={() => { if (!locked) setHovered(track.stock) }}
                      onClick={e => { e.stopPropagation(); setLocked(locked === track.stock ? null : track.stock); setHovered(null) }}
                    />
                  )
                })}

                {/* Dots */}
                {TRACKS.map(track => {
                  const pt = latestPoint(track, year)
                  if (!pt) return null
                  const isActive = active === track.stock
                  const isDimmed = active !== null && !isActive
                  const status = classifyPoint(pt.f_fmsy, pt.ssb_msybtrigger)
                  return (
                    <circle
                      key={track.stock}
                      cx={xS(pt.f_fmsy)} cy={yS(pt.ssb_msybtrigger)}
                      r={isActive ? 6 : 5}
                      fill={STATUS_COLORS[status]}
                      stroke="#fff" strokeWidth={1.5}
                      fillOpacity={isDimmed ? 0.15 : 0.95}
                      style={{ transition: 'fill-opacity 100ms, r 100ms', cursor: 'pointer' }}
                      onMouseEnter={() => { if (!locked) setHovered(track.stock) }}
                      onClick={e => { e.stopPropagation(); setLocked(locked === track.stock ? null : track.stock); setHovered(null) }}
                    />
                  )
                })}
              </g>

              {/* Axis ticks */}
              {xTicks().filter((_, i) => i % 2 === 0).map(v => (
                <text key={v} x={xS(v)} y={PH + 16} textAnchor="middle"
                  fill={c.chartTick ?? c.textMuted} fontSize={9} fontFamily="IBM Plex Mono">{v.toFixed(1)}</text>
              ))}
              {yTicks().filter((_, i) => i % 2 === 0).map(v => (
                <text key={v} x={-8} y={yS(v) + 3} textAnchor="end"
                  fill={c.chartTick ?? c.textMuted} fontSize={9} fontFamily="IBM Plex Mono">{v.toFixed(1)}</text>
              ))}

              {/* Axis labels */}
              <text x={PW / 2} y={PH + 34} textAnchor="middle"
                fill={c.textMuted} fontSize={10} fontFamily="IBM Plex Mono">F / FMSY</text>
              <text x={-PH / 2} y={-48} textAnchor="middle" transform="rotate(-90)"
                fill={c.textMuted} fontSize={10} fontFamily="IBM Plex Mono">SSB / MSYBtrigger</text>
            </g>
          </svg>
        </div>

        <p style={{ color: c.textMuted, fontSize: '11px', lineHeight: '1.7', marginTop: '16px', fontFamily: 'IBM Plex Sans, sans-serif' }}>
          Use the slider to move through time from 1988 to 2023. Each row updates
          to show that stock's F/F<sub>MSY</sub> and SSB/MSY B<sub>trigger</sub> values for the selected
          year. Stocks with no data for earlier years will show their earliest available
          assessment. Hover over a trajectory line on the chart to highlight a single
          stock and grey out the rest. The status badge reflects classification at the
          selected year, not the terminal year.
        </p>
      </div>

      {/* Right 40% — sticky species table */}
      <div style={{ flex: '0 0 40%', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '32px 32px 32px 24px' }}>
        <div style={{ color: c.textMuted, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '16px' }}>
          Stocks · {year}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tableRows.map(row => {
            const isActive = active === row.stock
            const isDimmed = active !== null && !isActive
            return (
              <div
                key={row.stock}
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${isActive ? row.color : c.cardBorder}`,
                  backgroundColor: c.cardBg,
                  opacity: isDimmed ? 0.35 : 1,
                  transition: 'opacity 100ms, border-color 100ms',
                  cursor: 'pointer',
                }}
                onClick={() => setLocked(locked === row.stock ? null : row.stock)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color, flexShrink: 0 }} />
                  <span style={{ color: c.cardText, fontSize: '11px', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.species}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status={row.status} size="sm" />
                  <span style={{ color: c.cardTextMuted, fontSize: '10px', marginLeft: 'auto' }}>
                    F/Fmsy {row.f_fmsy.toFixed(2)}
                  </span>
                  <span style={{ color: c.cardTextMuted, fontSize: '10px' }}>
                    SSB {row.ssb.toFixed(2)}
                  </span>
                </div>
                {row.ptYear < year && (
                  <div style={{ color: c.textMuted, fontSize: '9px', marginTop: '3px' }}>
                    latest data: {row.ptYear}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function TestLayout() {
  return (
    <ThemeProvider>
      <Inner />
    </ThemeProvider>
  )
}
