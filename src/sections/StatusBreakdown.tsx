import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  icesStocks, proxyStocks,
  classifyIces, classifyProxy,
  STATUS_COLORS, ALL_STATUSES, Status,
} from '../data/stocks'
import SectionLabel from '../components/SectionLabel'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

function buildCounts(statuses: Status[]) {
  const counts: Partial<Record<Status, number>> = {}
  statuses.forEach(s => { counts[s] = (counts[s] ?? 0) + 1 })
  return ALL_STATUSES
    .map(st => ({ name: st, value: counts[st] ?? 0, color: STATUS_COLORS[st] }))
    .filter(d => d.value > 0)
}

function DonutChart({ data, total, label }: {
  data: ReturnType<typeof buildCounts>
  total: number
  label: string
}) {
  const { colors: c } = useTheme()
  return (
    <div className="flex flex-col items-center">
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase mb-6"
        style={{ color: c.textMuted, transition: 'color 300ms ease' }}
      >
        {label}
      </div>
      <div style={{ width: 220, height: 220, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={true}
              animationBegin={200}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.85} stroke={c.bg} strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload as (typeof data)[0]
                return (
                  <div
                    className="px-3 py-2 font-mono text-xs"
                    style={{
                      backgroundColor: c.tooltipBg,
                      border: `1px solid ${c.tooltipBorder}`,
                      boxShadow: '0 2px 8px rgba(27,58,75,0.08)',
                      transition: 'background-color 300ms ease, border-color 300ms ease',
                    }}
                  >
                    <span style={{ color: d.color }}>{d.name}</span>
                    <span className="ml-2" style={{ color: c.textMuted }}>
                      {d.value} stock{d.value !== 1 ? 's' : ''}
                    </span>
                  </div>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            className="font-mono text-3xl font-semibold"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            {total}
          </div>
          <div
            className="font-mono text-[9px] tracking-[0.2em] uppercase"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            stocks
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2 w-full max-w-[220px]">
        {data.map(d => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="font-mono text-[10px]" style={{ color: c.textMuted }}>{d.name}</span>
            </div>
            <span className="font-mono text-[10px]" style={{ color: c.textPrimary }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatusBreakdown() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const { colors: c } = useTheme()

  const icesStatuses = icesStocks.map(classifyIces)
  const proxyStatuses = proxyStocks.map(classifyProxy)

  const icesData = buildCounts(icesStatuses)
  const proxyData = buildCounts(proxyStatuses)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 75%',
      onEnter: () => {
        setVisible(true)
        gsap.from('.breakdown-donut', {
          opacity: 0,
          y: 40,
          stagger: 0.2,
          duration: 0.9,
          ease: 'power3.out',
        })
        gsap.from('.breakdown-summary', {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.4,
        })
      },
    })
    return () => trigger.kill()
  }, [])

  const allStatuses = [...icesStatuses, ...proxyStatuses]
  const stressStatuses = ['Collapsed', 'Overexploited', 'Depleted', 'Declining'] as Status[]
  const stressCount = allStatuses.filter(s => stressStatuses.includes(s)).length
  const recoverCount = allStatuses.filter(s => s === 'Recovering').length
  const stableCount = allStatuses.filter(s => s === 'Stable').length

  return (
    <section
      ref={sectionRef}
      className="px-8 md:px-16 lg:px-24 py-24 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <SectionLabel number="05" title="STATUS BREAKDOWN" />

      <div className="grid lg:grid-cols-[1fr_auto] gap-16">
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-3"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Assessment Summary<br />Across Both Tracks
          </h2>
          <p
            className="font-sans text-sm max-w-lg mb-12 leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Status distribution across both analytical tracks. Left donut: 12 stocks assessed via ICES
            formal stock assessment (SAG 2023), using real F/F<sub>MSY</sub> and SSB/MSY B<sub>trigger</sub> values.
            Right donut: 12 stocks assessed via catch-based proxy method applied to FAO FishStat data.
            The two tracks are methodologically distinct and should not be directly compared — ICES
            assessments are based on full age-structured population models, while proxy assessments use
            only landing statistics as indicators.
          </p>
          <p
            className="font-sans text-sm max-w-lg mb-12 leading-relaxed"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Track divergence: Atlantic mackerel and blue whiting are classified Declining under ICES
            direct assessment (F/F<sub>MSY</sub> &gt; 1.1) but Recovering under the FAO proxy method
            (depletion ratio ≥ 0.5, significant positive catch trend). This divergence reflects a known
            limitation of catch-based proxies: rising catches during a period of active overfishing can
            be misread as stock recovery. See Branch et al. (2011).
          </p>

          {visible && (
            <div className="flex flex-col sm:flex-row gap-16 justify-start">
              <div className="breakdown-donut">
                <DonutChart data={icesData} total={icesStocks.length} label="ICES Direct Assessment" />
              </div>
              <div className="breakdown-donut">
                <DonutChart data={proxyData} total={proxyStocks.length} label="FAO Proxy Assessment" />
              </div>
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="breakdown-summary space-y-2 pt-14">
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase mb-6"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Combined N=24
          </div>

          {[
            { label: 'Under stress', value: stressCount, color: '#B33A3A', pct: Math.round(stressCount / 24 * 100) },
            { label: 'Recovering', value: recoverCount, color: '#2C6E4F', pct: Math.round(recoverCount / 24 * 100) },
            { label: 'Stable', value: stableCount, color: '#4A8B6F', pct: Math.round(stableCount / 24 * 100) },
          ].map(({ label, value, color, pct }) => (
            <div
              key={label}
              className="p-4 border min-w-[200px]"
              style={{
                borderColor: c.cardBorder,
                backgroundColor: c.cardBg,
                transition: 'background-color 300ms ease, border-color 300ms ease',
              }}
            >
              <div className="font-mono text-3xl font-semibold mb-1" style={{ color }}>
                {value}
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ color: c.cardTextMuted, transition: 'color 300ms ease' }}
              >
                {label}
              </div>
              <div
                className="h-px mb-2"
                style={{ backgroundColor: c.cardBorder, transition: 'background-color 300ms ease' }}
              />
              <div
                className="font-mono text-lg font-medium"
                style={{ color: c.cardText, transition: 'color 300ms ease' }}
              >
                {pct}%
              </div>
            </div>
          ))}

          <div className="pt-4 space-y-2">
            {ALL_STATUSES.map(st => {
              const allCount = allStatuses.filter(s => s === st).length
              if (allCount === 0) return null
              return (
                <div key={st} className="flex items-center gap-3">
                  <StatusBadge status={st} size="sm" />
                  <span
                    className="font-mono text-xs ml-auto"
                    style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
                  >
                    {allCount}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
