// Shared UI primitives for Meridian pages — light theme, Waypoint style

export function Skeleton({ className = 'h-4 w-24' }) {
  return <div className={`rounded bg-gray-200 animate-pulse ${className}`} />
}

export function StatusChip({ days }) {
  if (days === null || days === undefined) return null
  const abs = Math.abs(days)
  if (days < 0) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-red-100 text-red-700">
      -{abs}d
    </span>
  )
  if (days <= 7) return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-100 text-amber-700">
      +{days}d
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 text-gray-600">
      +{days}d
    </span>
  )
}

const STATUS_STYLES = {
  overdue:        'bg-red-100 text-red-700',
  critical:       'bg-amber-100 text-amber-700',
  warning:        'bg-yellow-100 text-yellow-700',
  ok:             'bg-emerald-100 text-emerald-700',
  pending:        'bg-amber-100 text-amber-700',
  complete:       'bg-emerald-100 text-emerald-700',
  in_review:      'bg-blue-100 text-blue-700',
  not_required:   'bg-gray-100 text-gray-500',
  open:           'bg-blue-100 text-blue-700',
  in_progress:    'bg-amber-100 text-amber-700',
  submitted:      'bg-purple-100 text-purple-700',
  closed:         'bg-gray-100 text-gray-500',
  urgent:         'bg-red-100 text-red-700',
  'pending-tea':  'bg-blue-100 text-blue-700',
}

export function StatusBadge({ status }) {
  const classes = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase ${classes}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export function DocCheckItem({ doc }) {
  const icon = doc.status === 'yes' ? '✓' : doc.status === 'warn' ? '!' : '✕'
  const color = doc.status === 'yes' ? 'text-emerald-600' : doc.status === 'warn' ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className={`font-mono text-sm font-bold w-4 text-center ${color}`}>{icon}</span>
      <span className="text-sm text-gray-700 flex-1">{doc.name}</span>
    </div>
  )
}

export function ReadinessBar({ score }) {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-400' : 'bg-red-500'
  const text  = score >= 85 ? 'text-emerald-700' : score >= 65 ? 'text-amber-600' : 'text-red-600'
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-mono font-semibold ${text}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export function Card({ children, className = '', onClick }) {
  const base = 'bg-white border border-gray-200 rounded-xl'
  const hover = onClick ? 'cursor-pointer hover:border-gray-300 transition-colors' : ''
  return (
    <div className={`${base} ${hover} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {action && (
        <button onClick={onAction} className="text-xs text-purple-600 hover:text-purple-700 font-medium">
          {action}
        </button>
      )}
    </div>
  )
}

export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 px-5 py-2.5 border-b border-gray-100">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            active === t.key
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'text-gray-500 hover:text-gray-700 border border-transparent'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function StatCard({ label, value, sub, color, loading, onClick }) {
  const colorMap = {
    red:    'border-t-red-500 text-red-600',
    amber:  'border-t-amber-500 text-amber-600',
    green:  'border-t-emerald-500 text-emerald-600',
    blue:   'border-t-blue-500 text-blue-600',
    purple: 'border-t-purple-500 text-purple-600',
  }
  const [border, text] = (colorMap[color] || colorMap.purple).split(' ')
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl px-5 py-4 border-t-2 ${border} ${onClick ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}
    >
      <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-2">{label}</p>
      {loading
        ? <Skeleton className="h-8 w-16 mb-2" />
        : <p className={`font-mono text-3xl font-medium leading-none mb-1.5 ${text}`}>{value}</p>
      }
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  )
}
