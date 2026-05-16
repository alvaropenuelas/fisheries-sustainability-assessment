import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  LabelList,
  Tooltip,
} from 'recharts'
import { icesStocks, classifyIces, STATUS_COLORS } from '../data/stocks'
import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const barData = [...icesStocks]
  .filter(s => s.assessmentType !== 'escapement' && s.assessmentType !== 'ssb_only')
  .map(s => ({
    label: s.species
      .replace('Atlantic ', 'Atl. ')
      .replace('European ', 'Eur. ')
      .replace('Norwegian spring ', 'N.S. '),
    fullName: s.species,
    area: s.area,
    f_fmsy: s.f_fmsy,
    ssb: s.ssb_msybtrigger,
    status: classifyIces(s),
  }))
  .sort((a, b) => b.f_fmsy - a.f_fmsy)

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof barData[0] }> }) {
  const { colors: c } = useTheme()
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      className="font-mono text-xs min-w-[180px] p-3"
      style={{
        backgroundColor: c.tooltipBg,
        border: `1px solid ${c.tooltipBorder}`,
        boxShadow: '0 2px 8px rgba(27,58,75,0.08)',
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      <div className="font-semibold mb-1 text-sm" style={{ color: c.textPrimary }}>{d.fullName}</div>
      <div className="mb-2" style={{ color: c.textMuted }}>{d.area}</div>
      <StatusBadge status={d.status} size="sm" />
      <div className="mt-2 space-y-1">
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>F / F<sub>MSY</sub></span>
          <span style={{ color: c.textPrimary }}>{d.f_fmsy.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span style={{ color: c.textMuted }}>SSB / B<sub>trig</sub></span>
          <span style={{ color: c.textPrimary }}>{d.ssb.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

export default function StockRanking() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const { colors: c } = useTheme()

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

  return (
    <section
      ref={sectionRef}
      className="px-8 md:px-16 lg:px-24 py-24 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <SectionLabel number="06" title="FISHING PRESSURE RANKING" />

      <div className="grid lg:grid-cols-[1fr_260px] gap-12">
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-3"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            ICES Stocks by<br />Fishing Mortality
          </h2>
          <p
            className="font-sans text-sm max-w-lg mb-10 leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            ICES-assessed stocks ranked by fishing mortality ratio (F/F<sub>MSY</sub>, 2023). The dashed
            reference line at 1.0 marks the maximum sustainable yield threshold — stocks to the right
            of this line are subject to overfishing relative to their F<sub>MSY</sub> reference point.
            Bar color indicates stock status classification. This ranking allows direct comparison of
            fishing pressure intensity across stocks regardless of their biomass state.
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
              <div style={{ height: 380 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={barData}
                    margin={{ top: 4, right: 56, bottom: 28, left: 88 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={c.chartGrid}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 1.8]}
                      tickCount={10}
                      tick={{ fill: c.chartTick, fontFamily: 'IBM Plex Mono', fontSize: 10 }}
                      stroke={c.chartAxis}
                      tickLine={false}
                      label={{
                        value: 'F / FMSY',
                        position: 'insideBottom',
                        offset: -14,
                        fill: c.cardTextMuted,
                        style: { fontFamily: 'IBM Plex Mono', fontSize: 10 },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={84}
                      tick={{ fill: c.cardTextMuted, fontFamily: 'IBM Plex Mono', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      x={1}
                      stroke={c.chartRefLine}
                      strokeDasharray="4 2"
                      strokeWidth={1}
                      strokeOpacity={0.6}
                    />
                    <Tooltip
                      content={<BarTooltip />}
                      cursor={{ fill: c.cardBorder, fillOpacity: 0.5 }}
                    />
                    <Bar dataKey="f_fmsy" radius={0} barSize={12} isAnimationActive={true}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status]} fillOpacity={0.9} />
                      ))}
                      <LabelList
                        dataKey="f_fmsy"
                        position="right"
                        formatter={(v: number) => v.toFixed(2)}
                        style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fill: c.cardTextMuted }}
                      />
                    </Bar>
                  </BarChart>
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
                Figure 4. ICES stocks ranked by F/F<sub>MSY</sub> (2023). Dashed line = F<sub>MSY</sub>{' '}
                reference point. Excluded: European sprat (escapement-managed) and Capelin (SSB-only assessment). Source: ICES SAG 2023.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-2 pt-14">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase mb-4"
            style={{ color: c.textMuted }}
          >
            All stocks
          </div>
          {barData.map(d => (
            <div
              key={d.fullName}
              className="p-3 border"
              style={{
                borderColor: c.cardBorder,
                backgroundColor: c.cardBg,
                transition: 'background-color 300ms ease, border-color 300ms ease',
              }}
            >
              <div className="font-sans text-xs mb-1.5 truncate" style={{ color: c.cardText }}>
                {d.fullName}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={d.status} size="sm" />
                <span className="font-mono text-[10px] ml-auto" style={{ color: c.cardTextMuted }}>
                  {d.f_fmsy.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
