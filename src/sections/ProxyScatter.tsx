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
import { proxyStocks, classifyProxy, STATUS_COLORS } from '../data/stocks'
import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

type ProxyStatus = ReturnType<typeof classifyProxy>

interface TooltipData {
  species: string
  area: string
  depletion: number
  tau: number
  p: number
  status: ProxyStatus
}

function ProxyTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TooltipData }> }) {
  const { colors: c } = useTheme()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="p-4 font-mono text-xs min-w-[220px]"
      style={{
        backgroundColor: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
        boxShadow: '0 2px 8px rgba(27,58,75,0.08)',
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      <div className="font-semibold text-sm mb-2" style={{ color: c.textPrimary }}>{d.species}</div>
      <div className="mb-3 text-[10px]" style={{ color: c.textMuted }}>{d.area}</div>
      <StatusBadge status={d.status} size="sm" />
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>Depletion ratio</span>
          <span style={{ color: c.textPrimary }}>{d.depletion.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>Mann-Kendall τ</span>
          <span style={{ color: c.textPrimary }}>{d.tau.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>p-value</span>
          <span style={{ color: c.textPrimary }}>{d.p < 0.001 ? '<0.001' : d.p.toFixed(3)}</span>
        </div>
      </div>
    </div>
  )
}

const plotData = proxyStocks
  .filter(s => s.flag !== 'Data-limited')
  .map(s => ({
    ...s,
    status: classifyProxy(s),
    x: s.depletion,
    y: s.tau,
  }))

const sidebarData = proxyStocks.map(s => ({
  ...s,
  status: classifyProxy(s),
  x: s.depletion,
  y: s.tau,
}))

function computeVisibleLabels(data: typeof plotData) {
  const THRESH_X = 0.10
  const THRESH_Y = 0.12
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

export default function ProxyScatter() {
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
      <SectionLabel number="03" title="PROXY ASSESSMENT (FAO)" />

      <div className="grid lg:grid-cols-[1fr_300px] gap-12">
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-3"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Depletion Ratio vs.<br />Trend Direction
          </h2>
          <p
            className="font-sans text-sm max-w-lg mb-10 leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            For stocks lacking formal ICES assessments, two catch-based proxy indicators are computed
            from FAO FishStat annual landings (1990–2023). The depletion ratio (x-axis) is the ratio of
            recent catch to the historical maximum: values below 0.5 suggest the stock is producing less
            than half its peak yield, a proxy for relative biomass decline. The Mann-Kendall τ statistic
            (y-axis) measures monotonic trend direction: negative values indicate a sustained long-term
            decline, positive values a recovery trend. Points in the bottom-left quadrant (low depletion,
            strong negative trend) are most at risk. Note: catch trends reflect management decisions and
            fleet behavior as well as actual stock status — this method has known limitations
            (Branch et al. 2011).
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
                    {/* 3% red tint below depletion threshold */}
                    <ReferenceArea x1={0} x2={0.5} y1={-1.0} y2={0.6} fill="#B33A3A" fillOpacity={0.03} />

                    <CartesianGrid stroke={c.chartGrid} strokeDasharray="0" />

                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={[0, 1.0]}
                      tickCount={6}
                      tick={{ fill: c.chartTick, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                      stroke={c.chartAxis}
                    >
                      <Label
                        value="Depletion Ratio (C/Cmax)"
                        offset={-10}
                        position="insideBottom"
                        fill={c.chartTick}
                        style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', fontStyle: 'italic' }}
                      />
                    </XAxis>

                    <YAxis
                      type="number"
                      dataKey="y"
                      domain={[-1.0, 0.6]}
                      tickCount={9}
                      tick={{ fill: c.chartTick, fontFamily: 'IBM Plex Mono', fontSize: 11 }}
                      stroke={c.chartAxis}
                    >
                      <Label
                        value="Mann-Kendall τ"
                        angle={-90}
                        position="insideLeft"
                        fill={c.chartTick}
                        style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.08em', fontStyle: 'italic' }}
                      />
                    </YAxis>

                    {/* Axis baselines */}
                    <ReferenceLine x={0} stroke={c.chartAxis} strokeWidth={1} />
                    <ReferenceLine y={-1.0} stroke={c.chartAxis} strokeWidth={1} />

                    {/* B/Bmax depletion threshold */}
                    <ReferenceLine
                      x={0.5}
                      stroke={c.chartRefLineAlt}
                      strokeDasharray="4 3"
                      strokeOpacity={0.7}
                      strokeWidth={1}
                      label={{
                        value: 'B/Bmax = 0.5',
                        position: 'insideTopRight',
                        fill: c.chartRefLineAlt,
                        fontSize: 9,
                        fontFamily: 'IBM Plex Mono',
                        fontStyle: 'italic',
                        opacity: 0.9,
                      }}
                    />

                    {/* Trend neutral */}
                    <ReferenceLine
                      y={0}
                      stroke={c.chartRefLine}
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      strokeWidth={1}
                      label={{
                        value: 'Trend neutral',
                        position: 'insideTopRight',
                        fill: c.chartAnnotation,
                        fontSize: 9,
                        fontFamily: 'IBM Plex Mono',
                        fontStyle: 'italic',
                      }}
                    />

                    <Tooltip
                      content={<ProxyTooltip />}
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
                Figure 2. Proxy scatter of FAO catch-based indicators (1990–2023). Amber dashed line:
                depletion threshold (C/C<sub>max</sub> = 0.5). Horizontal dashed line: trend neutral (τ = 0).
                Red tint indicates depleted zone. Source: FAO FishStat 2024. Excluded: Atlantic redfishes
                (pre-2000 reporting discontinuity).
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
            {[
              { label: 'Collapsed (C/Cmax < 0.25)', color: '#B33A3A' },
              { label: 'Overexploited (depleted, declining)', color: '#C77D2E' },
              { label: 'Depleted (< 50%, no sig. trend)', color: '#D9A856' },
              { label: 'Declining (sig. downward trend)', color: '#6B8FAE' },
              { label: 'Recovering (sig. upward trend)', color: '#2C6E4F' },
              { label: 'Stable', color: '#4A8B6F' },
              { label: 'Data-limited (excluded from analysis)', color: '#8A8A82' },
            ].map(({ label, color }) => (
              <div
                key={label}
                className="flex items-start gap-2 p-2 border"
                style={{ borderColor: c.border, transition: 'border-color 300ms ease' }}
              >
                <div className="w-2 h-2 mt-0.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color, opacity: 0.9 }} />
                <div className="font-mono text-[10px] leading-relaxed" style={{ color: c.textPrimary }}>{label}</div>
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
            All proxy stocks
          </div>
          {sidebarData
            .sort((a, b) => a.depletion - b.depletion)
            .map(s => (
              <div
                key={s.species}
                className="p-3 border"
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
                  <span>D={s.depletion.toFixed(2)}</span>
                  <span>τ={s.tau.toFixed(2)}</span>
                  <span>p={s.p < 0.001 ? '<0.001' : s.p.toFixed(3)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  )
}
