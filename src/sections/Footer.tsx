import { useTheme } from '../context/ThemeContext'

export default function Footer() {
  const { colors: c } = useTheme()

  return (
    <footer
      className="px-8 md:px-16 lg:px-24 py-12 section-divider"
      style={{ backgroundColor: c.bg, transition: 'background-color 300ms ease' }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div
            className="font-mono text-xs mb-1"
            style={{ color: c.textPrimary, transition: 'color 300ms ease' }}
          >
            Fisheries Sustainability Assessment
          </div>
          <div
            className="font-mono text-[10px]"
            style={{ color: c.textMuted, transition: 'color 300ms ease' }}
          >
            ICES SAG 2023 · FAO FishStat 2025 · Areas 21 & 27
          </div>
        </div>

        <div className="flex flex-wrap gap-6 font-mono text-[10px]">
          {[
            { label: 'GitHub →', href: 'https://github.com/gemange2' },
            { label: 'ICES SAG →', href: 'https://www.ices.dk/data/assessment-tools/Pages/stock-assessment-graphs.aspx' },
            { label: 'FAO FishStat →', href: 'https://www.fao.org/fishery/statistics-query/en/capture' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-150"
              style={{ color: c.textMuted }}
              onMouseEnter={e => (e.currentTarget.style.color = c.accent)}
              onMouseLeave={e => (e.currentTarget.style.color = c.textMuted)}
            >
              {label}
            </a>
          ))}
        </div>

        <div
          className="font-mono text-[10px]"
          style={{ color: c.textMuted, transition: 'color 300ms ease' }}
        >
          © 2025 · Built with ICES public data
        </div>
      </div>
    </footer>
  )
}
