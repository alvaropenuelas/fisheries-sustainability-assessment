import { Status, STATUS_COLORS } from '../data/stocks'

interface Props {
  status: Status
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: Props) {
  const color = STATUS_COLORS[status]
  const px = size === 'sm' ? 'px-2 py-0.5' : 'px-2 py-0.5'

  return (
    <span
      className={`font-mono uppercase border inline-flex items-center gap-1.5 ${px}`}
      style={{
        color,
        borderColor: `${color}66`,
        backgroundColor: `${color}1F`,
        borderRadius: '2px',
        fontSize: '10px',
        letterSpacing: '0.06em',
        fontWeight: 500,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {status}
    </span>
  )
}
