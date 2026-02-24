// Shared UI primitives for Origins pages — teal/emerald accent

export function Skeleton({ className = 'h-4 w-24' }) {
  return <div className={`rounded bg-gray-200 animate-pulse ${className}`} />
}

export function StatCard({ label, value, sub, color = 'teal', loading, onClick }) {
  const colorMap = {
    teal:   'border-t-teal-500 text-teal-600',
    emerald:'border-t-emerald-500 text-emerald-600',
    amber:  'border-t-amber-500 text-amber-600',
    blue:   'border-t-blue-500 text-blue-600',
    red:    'border-t-red-500 text-red-600',
  }
  const [border, text] = (colorMap[color] || colorMap.teal).split(' ')
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

const PATHWAY_STYLES = {
  emotional_regulation:   { label: 'Emotional Regulation', color: 'bg-teal-100 text-teal-700' },
  conflict_deescalation:  { label: 'Conflict De-escalation', color: 'bg-emerald-100 text-emerald-700' },
  peer_pressure:          { label: 'Peer Pressure Resistance', color: 'bg-cyan-100 text-cyan-700' },
  rebuilding:             { label: 'Rebuilding After a Mistake', color: 'bg-sky-100 text-sky-700' },
  adult_communication:    { label: 'Communication with Adults', color: 'bg-indigo-100 text-indigo-700' },
}

export function SkillBadge({ pathway }) {
  const style = PATHWAY_STYLES[pathway] || { label: pathway, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style.color}`}>
      {style.label}
    </span>
  )
}

export function pathwayLabel(pathway) {
  return PATHWAY_STYLES[pathway]?.label || pathway
}

export const PATHWAYS = [
  { key: 'emotional_regulation',  label: 'Emotional Regulation & Impulse Control' },
  { key: 'conflict_deescalation', label: 'Conflict De-escalation' },
  { key: 'peer_pressure',         label: 'Peer Pressure Resistance' },
  { key: 'rebuilding',            label: 'Rebuilding After a Mistake' },
  { key: 'adult_communication',   label: 'Communication with Adults' },
]

export function ProgressBar({ value, max = 100, label, color = 'teal' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const barColor = color === 'teal' ? 'bg-teal-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-teal-500'
  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-mono text-gray-500">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {action && (
        <button onClick={onAction} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
          {action}
        </button>
      )}
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

export function StatusBadge({ status }) {
  const styles = {
    assigned:    'bg-gray-100 text-gray-600',
    in_progress: 'bg-amber-100 text-amber-700',
    completed:   'bg-teal-100 text-teal-700',
  }
  const cls = styles[status] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium uppercase ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  )
}

export function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mb-3">
        <svg className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
