import { useTheme } from '../context/ThemeContext'
import ThemeSwitch from './ThemeSwitch'

export default function Navbar() {
  const { colors: c } = useTheme()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 md:px-16 lg:px-24"
      style={{
        height: '56px',
        backgroundColor: c.bg,
        borderBottom: `1px solid ${c.borderDefined}`,
        transition: 'background-color 300ms ease, border-color 300ms ease',
      }}
    >
      <div
        className="font-mono text-[10px] tracking-[0.3em] uppercase"
        style={{ color: c.accent, transition: 'color 300ms ease' }}
      >
        Fisheries · Assessment
      </div>

      <ThemeSwitch />
    </header>
  )
}
