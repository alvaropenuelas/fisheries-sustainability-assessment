import { useTheme } from '../context/ThemeContext'

interface Props {
  number: string
  title: string
}

export default function SectionLabel({ number, title }: Props) {
  const { colors: c } = useTheme()
  return (
    <div className="flex items-center gap-4 mb-12">
      <span
        className="font-mono uppercase flex-shrink-0"
        style={{
          color: c.sectionLabelColor,
          fontSize: '11px',
          letterSpacing: '0.12em',
          transition: 'color 300ms ease',
        }}
      >
        {number}
      </span>
      <div
        className="flex-1 h-px"
        style={{ backgroundColor: c.sectionLineColor, transition: 'background-color 300ms ease' }}
      />
      <span
        className="font-mono uppercase flex-shrink-0"
        style={{
          color: c.sectionLabelColor,
          fontSize: '11px',
          letterSpacing: '0.12em',
          transition: 'color 300ms ease',
        }}
      >
        {title}
      </span>
    </div>
  )
}
