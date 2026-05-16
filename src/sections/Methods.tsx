import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SectionLabel from '../components/SectionLabel'
import { useTheme } from '../context/ThemeContext'

gsap.registerPlugin(ScrollTrigger)

const references = [
  {
    id: 'ICES2023a',
    text: 'ICES Stock Assessment Database. Copenhagen, Denmark. ICES. Accessed May 2026. https://standardgraphs.ices.dk',
    url: 'https://standardgraphs.ices.dk',
  },
  {
    id: 'FAO2024',
    text: 'FAO (2024). FishStat: Global Capture Production. FAO Fisheries Division [online]. Rome.',
    url: 'https://www.fao.org/fishery/statistics-query/en/capture/capture_quantity',
  },
  {
    id: 'Hilborn2020',
    text: 'Hilborn R, et al. (2020). Effective fisheries management instrumental in improving fish stock status. PNAS 117(4): 2218–2224.',
    url: 'https://doi.org/10.1073/pnas.1909726116',
  },
  {
    id: 'Froese2018',
    text: 'Froese R, Winker H, Coro G, Demirel N, Tsikliras AC, Dimarchopoulou D, Scarcella G, Quaas M, Matz-Lück N (2018). Status and rebuilding of European fisheries. Mar Policy 93: 159–170.',
    url: 'https://doi.org/10.1016/j.marpol.2018.04.018',
  },
  {
    id: 'Mann1945',
    text: 'Mann HB (1945). Nonparametric tests against trend. Econometrica 13(3): 245–259.',
    url: 'https://doi.org/10.2307/1907187',
  },
  {
    id: 'Garcia2018',
    text: 'Garcia, S.M. & Ye, Y., eds. (2018). Rebuilding of marine fisheries. Part 2: Case studies. FAO Fisheries and Aquaculture Technical Paper No. 630/2. Rome, FAO.',
    url: 'https://www.fao.org/3/ca0161en/CA0161EN.pdf',
  },
]

interface MethodBlock {
  track: string
  color: string
  body: string
  items?: string[]
}

const methodBlocks: MethodBlock[] = [
  {
    track: 'ICES Direct Assessment Track',
    color: '#4A8B6F',
    body: `Stock status was classified using ICES reference points from the 2023 Stock Assessment Graph (SAG) database. Two dimensionless ratios were computed per stock: F/F_MSY (fishing mortality relative to maximum sustainable yield proxy) and SSB/MSY B_trigger (spawning stock biomass relative to the biomass trigger reference point).

Classification followed the ICES precautionary approach framework. Stocks with SSB below MSY B_trigger are considered to be in the danger zone; stocks with F exceeding F_MSY are considered to be subject to overfishing. The six-category status scheme (Collapsed → Recovering) was applied hierarchically: Collapsed takes precedence over Overexploited, which takes precedence over Depleted, and so on.`,
  },
  {
    track: 'FAO Catch-Based Proxy Track',
    color: '#2C6E4F',
    body: `For stocks lacking ICES assessments, FAO FishStat annual catch series (1950–2023) were used to derive two proxy indicators. The depletion ratio (C/C_max) is computed as the ratio of the most recent three-year mean catch to the historical maximum three-year mean catch. Values below 0.5 indicate that current removals are less than half of the peak exploitation level.

Temporal trend was quantified using the Mann-Kendall (1945) non-parametric test applied to the 1990–2023 subseries. The statistic τ (Kendall's tau, –1 to +1) measures monotonic trend direction and strength; p-values below 0.05 indicate a significant trend. This approach is consistent with FAO (2022) methods for data-limited stock evaluation.`,
  },
  {
    track: 'Important Limitations',
    color: '#C77D2E',
    body: '',
    items: [
      'Catch ≠ biomass. Catch trends reflect fishing effort, quota management, and market demand — not stock abundance. A declining catch may indicate depletion or simply reduced fishing pressure.',
      'Mann-Kendall detects monotonic trends only. Stocks that collapsed and partially recovered within 1990–2023 may show near-zero τ and be misclassified as Stable.',
      'Proxy "Stable" ≠ healthy. A flat catch trend at persistently low absolute levels may indicate a depleted stock, not a well-managed one.',
      'Spatial aggregation. FAO Areas 21 and 27 are large statistical regions; aggregated catch data may mask local depletions or recoveries within the same area.',
      'ICES assessments are authoritative and supersede any proxy classification. The proxy method is a first-order screen for data-limited stocks only.',
    ],
  },
]

export default function Methods() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { isDark, colors: c } = useTheme()

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => {
        gsap.from('.methods-block', {
          opacity: 0,
          y: 24,
          stagger: 0.15,
          duration: 0.7,
          ease: 'power2.out',
        })
        gsap.from('.methods-ref', {
          opacity: 0,
          x: 20,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out',
          delay: 0.2,
        })
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
      <SectionLabel number="07" title="METHODS & CITATIONS" />

      <div className="grid lg:grid-cols-[1fr_380px] gap-16">
        {/* Left: methodology */}
        <div>
          <h2
            className="font-mono text-3xl md:text-4xl font-semibold mb-10"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Analytical<br />Framework
          </h2>

          <div className="space-y-8">
            {methodBlocks.map(block => (
              <div
                key={block.track}
                className="methods-block border p-6"
                style={{ borderColor: c.border, transition: 'border-color 300ms ease' }}
              >
                <div
                  className="tracking-[0.25em] uppercase mb-4 pb-4"
                  style={{
                    color: isDark ? '#5DCAA5' : '#1B3A4B',
                    borderBottom: `1px solid ${block.color}40`,
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  {block.track}
                </div>
                <div
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: c.textMuted, transition: 'color 300ms ease' }}
                >
                  {block.items ? (
                    <ol className="list-decimal list-outside space-y-2 pl-5">
                      {block.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="space-y-3">
                      {block.body.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: references */}
        <div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] uppercase mb-8"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            Data Sources & References
          </div>
          <div className="space-y-3">
            {references.map(ref => (
              <div
                key={ref.id}
                className="methods-ref border p-4"
                style={{
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  transition: 'background-color 300ms ease, border-color 300ms ease',
                }}
              >
                <div
                  className="font-mono text-[10px] mb-2"
                  style={{ color: c.accent, transition: 'color 300ms ease' }}
                >
                  [{ref.id}]
                </div>
                <p
                  className="font-sans text-xs leading-relaxed mb-2"
                  style={{ color: c.textMuted, transition: 'color 300ms ease' }}
                >
                  {ref.text}
                </p>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] break-all transition-colors duration-150"
                  style={{ color: c.textSubtle }}
                  onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
                  onMouseLeave={e => (e.currentTarget.style.color = c.textSubtle)}
                >
                  {ref.url}
                </a>
              </div>
            ))}
          </div>

          {/* Data note */}
          <div
            className="mt-6 border p-4"
            style={{
              borderColor: c.border,
              backgroundColor: c.surfaceElevated,
              transition: 'background-color 300ms ease, border-color 300ms ease',
            }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2"
              style={{ color: c.textMuted, transition: 'color 300ms ease' }}
            >
              Data note
            </div>
            <p
              className="font-sans text-xs leading-relaxed"
              style={{ color: c.textMuted, transition: 'color 300ms ease' }}
            >
              All values were manually transcribed from ICES SAG (2023) and FAO FishStat (2024)
              at time of writing. Values are static; this tool does not query live APIs.
              Verify against primary sources before citing.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
