import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function ThemeSwitch() {
  const { isDark, toggle } = useTheme()

  const trackBg = isDark ? '#1a2e3a' : '#C9BFA8'
  const thumbColor = isDark ? '#5DCAA5' : '#1B3A4B'
  const iconColor = isDark ? '#5a6a7a' : '#8A8A82'

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        position: 'relative',
        width: 56,
        height: 28,
        borderRadius: 14,
        backgroundColor: trackBg,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 300ms ease',
      }}
    >
      {/* Icons row */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 7px',
          pointerEvents: 'none',
        }}
      >
        <Sun
          size={14}
          color={iconColor}
          style={{ opacity: isDark ? 0.3 : 1, transition: 'opacity 300ms ease' }}
        />
        <Moon
          size={14}
          color={iconColor}
          style={{ opacity: isDark ? 1 : 0.3, transition: 'opacity 300ms ease' }}
        />
      </div>

      {/* Animated thumb */}
      <motion.div
        initial={false}
        animate={{ x: isDark ? 28 : 0, backgroundColor: thumbColor }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          left: 4,
          top: 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
        }}
      />
    </button>
  )
}
