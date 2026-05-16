import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { lightColors, darkColors, ThemeColors } from '../utils/themeColors'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggle: () => void
  isDark: boolean
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggle: () => {},
  isDark: false,
  colors: lightColors,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const isDark = theme === 'dark'
  const colors = isDark ? darkColors : lightColors

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-bg', colors.bg)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-border-defined', colors.borderDefined)
    root.style.setProperty('--color-text-primary', colors.textPrimary)
    root.style.setProperty('--color-text-muted', colors.textMuted)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-section-line', colors.sectionLineColor)
  }, [colors])

  return (
    <ThemeContext.Provider value={{
      theme,
      toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
      isDark,
      colors,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
