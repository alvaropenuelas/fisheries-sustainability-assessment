import { useRef, useEffect, useState, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  Label,
} from 'recharts'
import { icesStocks, classifyIces, STATUS_COLORS } from '../data/stocks'
import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

interface TooltipData {
  species: string
  stock: string
  area: string
  f_fmsy: number
  ssb_msybtrigger: number
  status: ReturnType<typeof classifyIces>
}

function KobeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipData }> }) {
  const { colors: c } = useTheme()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="font-mono text-xs min-w-[220px] p-4"
      style={{
        backgroundColor: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
        boxShadow: '0 2px 8px rgba(27,58,75,0.08)',
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      <div className="font-semibold text-sm mb-1" style={{ color: c.textPrimary }}>{d.species}</div>
      <div className="mb-3 text-[10px]" style={{ color: c.textMuted }}>{d.stock}</div>
      <StatusBadge status={d.status} size="sm" />
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>F / F<sub>MSY</sub></span>
          <span style={{ color: c.textPrimary }}>{d.f_fmsy.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>SSB / MSY B<sub>trigger</sub></span>
          <span style={{ color: c.textPrimary }}>{d.ssb_msybtrigger.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>Area</span>
          <span style={{ color: c.textPrimary }}>{d.area}</span>
        </div>
      </div>
    </div>
  )
}

const plotData = icesStocks
  .filter(s => !s.assessmentType || s.assessmentType === 'standard')
  .map(s => ({
    ...s,
    status: classifyIces(s),
    x: s.f_fmsy,
    y: s.ssb_msybtrigger,
  }))

function computeVisibleLabels(data: typeof plotData) {
  const THRESH_X = 0.22
  const THRESH_Y = 0.18
  const visible = new Set<string>()
  const shown: Array<{ x: number; y: number }> = []
  const sorted = [...data].sort((a, b) => a.x - b.x)
  sorted.forEach(d => {
    const tooClose = shown.some(s =>
      Math.abs(d.x - s.x) < THRESH_X && Math.abs(d.y - s.y) < THRESH_Y
    )
    if (!tooClose) {
      visible.add(d.species)
      shown.push({ x: d.x, y: d.y })
    }
  })
  return visible
}

export default function KobePlot() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const { isDark, colors: c } = useTheme()

  const visibleLabels = useMemo(() => computeVisibleLabels(plotData), [])

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => {
        setVisible(true)
        gsap.from(sectionRef.current, { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' })
      },
    })
    return () => trigger.kill()
  }, [])

  const customShape = (props: unknown) => {
    const p = props as Record<string, unknown>
    const cx = p.cx as number | undefined
    const cy = p.cy as number | undefined
    const payload = p.payload as typeof plotData[0] | undefined
    if (cx == null || cy == null || !payload) return <g />
    const color = STATUS_COLORS[payload.status]
    const showLabel = visibleLabels.has(payload.species)
    const shortName = payload.species.split(' ').slice(0, 2).join(' ')
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill={isDark ? color : '#FFFFFF'}
          stroke={isDark ? '#1A1A18' : color}
          strokeWidth={isDark ? 1.5 : 2}
        />
        {showLabel && (
          <text
            x={cx + 13}
            y={cy}
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="IBM Plex Mono"
            fill={c.chartAnnotation}
            fontStyle="italic"
          >
            {shortName}
          </text>
        )}
      </g>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="px-8 md:px-16 lg:px-24 py-24 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <SectionLabel number="02" title="ICES KOBE PLOT" />

      <div className="grid lg:grid-cols-[1fr_300px] gap-12">
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-3"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Fishing Pressure vs.<br />Stock Biomass
          </h2>
          <p
            className="font-sans text-sm max-w-lg mb-10 leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            The Kobe plot is the standard ICES visualization for dual stock status. Each point is one
            assessed stock. The x-axis shows fishing mortality relative to the maximum sustainable yield
            reference point (F/F<sub>MSY</sub>): values above 1.0 indicate overfishing. The y-axis shows
            spawning stock biomass relative to the biomass trigger point (SSB/MSY B<sub>trigger</sub>):
            values below 1.0 indicate the stock is in the precautionary zone. The ideal quadrant is
            bottom-right — low fishing pressure, healthy biomass. Top-left is the danger zone: overfished
            and subject to overfishing.
          </p>

          {visible && (
            <div
              style={{
                border: `1px solid ${c.cardBorder}`,
                backgroundColor: c.cardBg,
                padding: '24px',
                transition: 'background-color 300ms ease, border-color 300ms ease',
              }}
            >
              <div style={{ height: 460 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 80, bottom: 40, left: 20 }}>
                    {/* 4% quadrant shading */}
                    <ReferenceArea x1={0} x2={1} y1={0} y2={1} fill="#B33A3A" fillOpacity={0.04} />
                    <ReferenceArea x1={1} x2={2} y1={0} y2={1} fill="#C77D2E" fillOpacity={0.04} />
                    <ReferenceArea x1={0} x2={1} y1={1} y2={2.8} fill="#D9A856" fillOpacity={0.04} />
                    <ReferenceArea x1={1} x2={2} y1={1} y2={2.8} fill="#4A8B6F" fillOpacity={0.04} />

                    <CartesianGrid stroke={c.chartGrid} strokeDasharray="0" />

                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[0, 2.0]}
                      tickCount={9}
                      tick={{ fill: c.chartTick, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                      stroke={c.chartAxis}
                    >
                      <Label
                        value="F / FMSY"
                        offset={-10}
                        position="insideBottom"
                        fill={c.chartTick}
                        style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', fontStyle: 'italic' }}
                      />
                    </XAxis>

                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[0, 2.8]}
                      tickCount={8}
                      tick={{ fill: c.chartTick, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                      stroke={c.chartAxis}
                    >
                      <Label
                        value="SSB / MSYBtrigger"
                        angle={-90}
                        position="insideLeft"
                        fill={c.chartTick}
                        style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', fontStyle: 'italic' }}
                      />
                    </YAxis>

                    {/* Arctic cod FMSY uncertainty band (FMSY range 0.40–0.60 gives f_fmsy 0.73–1.10) */}
                    <ReferenceArea x1={0.733} x2={1.100} y1={0} y2={3.2} fill="#6B8FAE" fillOpacity={0.10} />

                    {/* Axis baselines */}
                    <ReferenceLine x={0} stroke={c.chartAxis} strokeWidth={1} />
                    <ReferenceLine y={0} stroke={c.chartAxis} strokeWidth={1} />

                    {/* MSY reference lines */}
                    <ReferenceLine
                      x={1}
                      stroke={c.chartRefLine}
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                    />
                    <ReferenceLine
                      y={1}
                      stroke={c.chartRefLine}
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                    />

                    {/* Quadrant annotation */}
                    <ReferenceLine
                      x={0.5}
                      stroke="none"
                      label={{
                        value: 'Overfishing & Overfished',
                        position: 'insideTopRight',
                        fill: c.chartAnnotation,
                        fontSize: 9,
                        fontFamily: 'IBM Plex Mono',
                        fontStyle: 'italic',
                        opacity: 0.8,
                      }}
                    />

                    <Tooltip
                      content={<KobeTooltip />}
                      cursor={{ stroke: c.borderDefined, strokeWidth: 1 }}
                    />

                    <Scatter
                      data={plotData}
                      shape={customShape}
                      isAnimationActive={false}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <p
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  color: c.cardTextMuted,
                  marginTop: '12px',
                }}
              >
                Figure 1. Kobe plot of ICES stock assessment indices (2023). Dashed lines indicate
                F/F<sub>MSY</sub> = 1 and SSB/MSY B<sub>trigger</sub> = 1. Shaded regions indicate management status.
                Blue band: Arctic cod F/F<sub>MSY</sub> uncertainty (ICES FMSY range 0.40–0.60).
                Excluded: European sprat (escapement-managed, FMSY undefined) and Capelin (SSB-only assessment).
                Source: ICES SAG 2023/2022/2021.
              </p>
            </div>
          )}

          {/* Quadrant key */}
          <div className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
            {[
              { label: 'Overfishing & Overfished', color: '#B33A3A', q: 'F>1, SSB<1' },
              { label: 'Overfishing only', color: '#C77D2E', q: 'F>1, SSB>1' },
              { label: 'Overfished only', color: '#D9A856', q: 'F<1, SSB<1' },
              { label: 'Sustainable', color: '#2C6E4F', q: 'F<1, SSB>1' },
            ].map(({ label, color, q }) => (
              <div
                key={label}
                className="flex items-start gap-2 p-2 border"
                style={{ borderColor: c.border, transition: 'border-color 300ms ease' }}
              >
                <div className="w-2 h-2 mt-0.5 flex-shrink-0" style={{ backgroundColor: color, opacity: 0.7 }} />
                <div>
                  <div className="font-mono text-[10px]" style={{ color: c.textPrimary }}>{label}</div>
                  <div className="font-mono text-[9px]" style={{ color: c.textMuted }}>{q}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Species list */}
        <div className="space-y-2">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase mb-4"
            style={{ color: c.textMuted }}
          >
            Plotted stocks (N=10)
          </div>
          {plotData
            .sort((a, b) => a.f_fmsy - b.f_fmsy)
            .map(s => (
              <div
                key={s.stock}
                className="p-3 border transition-colors duration-200"
                style={{
                  borderColor: c.cardBorder,
                  backgroundColor: c.cardBg,
                  transition: 'background-color 300ms ease, border-color 300ms ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = c.surfaceElevated
                  e.currentTarget.style.borderColor = c.borderDefined
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = c.cardBg
                  e.currentTarget.style.borderColor = c.cardBorder
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-sans text-xs truncate" style={{ color: c.cardText }}>{s.species}</span>
                  <StatusBadge status={s.status} size="sm" />
                </div>
                <div className="flex gap-4 font-mono text-[10px]" style={{ color: c.cardTextMuted }}>
                  <span>F/Fmsy {s.f_fmsy.toFixed(2)}</span>
                  <span>SSB {s.ssb_msybtrigger.toFixed(2)}</span>
                </div>
              </div>
            ))}
          <div
            className="font-mono text-[9px] leading-relaxed mt-2 p-2 border"
            style={{ borderColor: c.border, color: c.textSubtle, transition: 'border-color 300ms ease, color 300ms ease' }}
          >
            Excluded: European sprat (escapement strategy, FMSY undefined) · Capelin (SSB-only assessment). Both appear in Species Cards.
          </div>
        </div>
      </div>
    </section>
  )
}
