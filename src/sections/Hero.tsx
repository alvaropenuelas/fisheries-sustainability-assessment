import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { icesStocks, proxyStocks, classifyIces, classifyProxy } from '../data/stocks'
import { useTheme } from '../context/ThemeContext'

function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return value
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [countStarted, setCountStarted] = useState(false)
  const { isDark, colors: c } = useTheme()

  const totalStocks = icesStocks.length + proxyStocks.length

  const icesUnderStress = icesStocks.filter(s => {
    const st = classifyIces(s)
    return ['Collapsed', 'Overexploited', 'Depleted', 'Declining'].includes(st)
  }).length
  const proxyUnderStress = proxyStocks.filter(s => {
    const st = classifyProxy(s)
    return ['Collapsed', 'Overexploited', 'Depleted', 'Declining'].includes(st)
  }).length
  const underStressPct = Math.round(((icesUnderStress + proxyUnderStress) / totalStocks) * 100)

  const recoveringCount = [
    ...icesStocks.filter(s => classifyIces(s) === 'Recovering'),
    ...proxyStocks.filter(s => classifyProxy(s) === 'Recovering'),
  ].length

  const totalVal = useCountUp(totalStocks, 1.2, countStarted)
  const stressVal = useCountUp(underStressPct, 1.6, countStarted)
  const recoverVal = useCountUp(recoveringCount, 1.4, countStarted)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-tag', {
        opacity: 0,
        y: -8,
        stagger: 0.08,
        duration: 0.5,
        ease: 'power2.out',
        delay: 0.2,
      })
      gsap.from('.hero-title', {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.4,
      })
      gsap.from('.hero-subtitle', {
        opacity: 0,
        y: 16,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.65,
      })
      gsap.from('.hero-desc', {
        opacity: 0,
        y: 12,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.85,
      })
      gsap.from('.hero-kpi', {
        opacity: 0,
        y: 20,
        stagger: 0.12,
        duration: 0.6,
        ease: 'power2.out',
        delay: 1.0,
        onComplete: () => setCountStarted(true),
      })
      gsap.from('.hero-scroll', {
        opacity: 0,
        duration: 0.6,
        delay: 1.6,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col justify-between px-8 md:px-16 lg:px-24 py-8"
      style={{
        borderBottom: `1px solid ${c.borderDefined}`,
        backgroundColor: c.bg,
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      {/* Top tags */}
      <div className="flex flex-wrap gap-3 pt-4">
        {['ICES SAG 2023', 'FAO FishStat 2025', 'Areas 21 & 27', 'N=24 stocks'].map(tag => (
          <span
            key={tag}
            className="hero-tag font-mono text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 border"
            style={{
              borderColor: c.border,
              color: c.textMuted,
              transition: 'color 300ms ease, border-color 300ms ease',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center py-16">
        <div className="max-w-5xl">
          <p
            className="font-mono text-xs tracking-[0.4em] uppercase mb-6"
            style={{ color: c.sectionLabelColor, transition: 'color 300ms ease' }}
          >
            01 / ASSESSMENT REPORT
          </p>

          <h1
            className="hero-title font-mono text-5xl md:text-7xl lg:text-8xl font-semibold leading-none tracking-tight mb-4"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            North Atlantic
            <br />
            Fisheries
          </h1>

          <h2
            className="hero-subtitle font-mono text-2xl md:text-4xl lg:text-5xl font-medium leading-none tracking-tight mb-10"
            style={{ color: c.accent, transition: 'color 300ms ease' }}
          >
            Sustainability Assessment
            <br />
            <span
              className="text-xl md:text-3xl lg:text-4xl"
              style={{ color: c.accentHover, transition: 'color 300ms ease' }}
            >
              1990 – 2023
            </span>
          </h2>

          <p
            className="hero-desc font-sans text-sm md:text-base max-w-xl leading-relaxed mb-16"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Dual-track analysis combining ICES stock assessment indices with
            FAO FishStat catch-based proxy indicators across ICES Areas 21 & 27.
          </p>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl">
            <div className="hero-kpi">
              <div
                className="font-mono text-5xl md:text-6xl font-semibold mb-2"
                style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
              >
                {totalVal}
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: c.sectionLabelColor, transition: 'color 300ms ease' }}
              >
                Stocks assessed
              </div>
            </div>
            <div className="hero-kpi">
              <div
                className="font-mono text-5xl md:text-6xl font-semibold mb-2"
                style={{ color: isDark ? '#C77D2E' : c.textPrimary, transition: 'color 300ms ease' }}
              >
                {stressVal}%
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: c.sectionLabelColor, transition: 'color 300ms ease' }}
              >
                Under stress
              </div>
            </div>
            <div className="hero-kpi">
              <div
                className="font-mono text-5xl md:text-6xl font-semibold mb-2"
                style={{ color: isDark ? '#2C6E4F' : c.textPrimary, transition: 'color 300ms ease' }}
              >
                {recoverVal}
              </div>
              <div
                className="font-mono text-[10px] tracking-[0.25em] uppercase"
                style={{ color: c.sectionLabelColor, transition: 'color 300ms ease' }}
              >
                Recovering
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll flex items-center gap-3 pb-4">
        <div
          className="w-px h-8"
          style={{ backgroundColor: c.border, transition: 'background-color 300ms ease' }}
        />
        <span
          className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: c.textMuted, transition: 'color 300ms ease' }}
        >
          Scroll to explore
        </span>
      </div>
    </section>
  )
}
