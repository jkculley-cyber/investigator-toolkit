import { format } from 'date-fns'
import { useCAPs } from '../../hooks/useMeridian'
import { Skeleton, StatusBadge, Card } from './MeridianUI'

export default function MeridianCAPTrackerPage() {
  const { data: caps, loading } = useCAPs()

  const urgentCount     = caps?.filter(c => {
    const due = c.systemic_correction_due || c.child_correction_due
    if (!due) return false
    return Math.round((new Date(due) - new Date()) / 86400000) < 14
  }).length ?? 0

  const pendingTeaCount = caps?.filter(c => c.status === 'submitted').length ?? 0

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Corrective Action Plans</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track TEA findings and remediation progress</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
          + Log New Finding
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active CAPs',          value: caps?.length ?? 0, color: 'text-blue-600   border-t-blue-500'   },
          { label: 'Urgent (< 14 days)',   value: urgentCount,       color: 'text-red-600    border-t-red-500'    },
          { label: 'Awaiting TEA Closure', value: pendingTeaCount,   color: 'text-amber-600  border-t-amber-500'  },
        ].map(s => {
          const [textColor, borderColor] = s.color.split('  ')
          return (
            <div key={s.label} className={`bg-white border border-t-2 ${borderColor} border-gray-200 rounded-xl px-5 py-4`}>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-2">{s.label}</p>
              {loading ? <Skeleton className="h-8 w-16" /> : <p className={`font-mono text-3xl font-medium leading-none ${textColor}`}>{s.value}</p>}
            </div>
          )
        })}
      </div>

      {/* CAP cards */}
      {loading
        ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        : (caps ?? []).length === 0
          ? (
              <Card className="px-5 py-10 text-center">
                <p className="text-sm text-gray-400">No active corrective action plans.</p>
              </Card>
            )
          : (caps ?? []).map(cap => {
              const tasks     = cap.meridian_cap_tasks ?? []
              const doneTasks = tasks.filter(t => t.status === 'complete').length
              const pct       = tasks.length > 0 ? Math.round(doneTasks / tasks.length * 100) : 0
              const dueDate   = cap.systemic_correction_due || cap.child_correction_due
              const daysLeft  = dueDate ? Math.round((new Date(dueDate) - new Date()) / 86400000) : null
              const isUrgent  = daysLeft !== null && daysLeft < 14

              return (
                <Card key={cap.id} className="px-6 py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        {cap.finding_number} — {cap.description?.substring(0, 70)}{cap.description?.length > 70 ? '…' : ''}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {cap.legal_citation}
                        {cap.issued_date && ` • Issued ${format(new Date(cap.issued_date), 'MMM d, yyyy')}`}
                        {dueDate && ` • Due ${format(new Date(dueDate), 'MMM d, yyyy')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {daysLeft !== null && (
                        <span className={`text-xs font-mono px-2.5 py-1 rounded border ${isUrgent ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {daysLeft > 0 ? `${daysLeft}d remaining` : `${Math.abs(daysLeft)}d overdue`}
                        </span>
                      )}
                      <StatusBadge status={cap.status} />
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isUrgent ? 'bg-red-500' : cap.status === 'submitted' ? 'bg-blue-500' : 'bg-amber-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap font-mono">{pct}% ({doneTasks}/{tasks.length} tasks)</span>
                  </div>

                  {/* Task tags */}
                  {tasks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tasks.map(t => (
                        <span
                          key={t.id}
                          className={`text-xs px-2.5 py-1 rounded font-mono ${t.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 line-through opacity-75' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}
                        >
                          {t.status === 'complete' ? '✓ ' : '◦ '}{t.task_label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                      Generate TEA Docs
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                      Update Progress
                    </button>
                    <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200">
                      Escalate
                    </button>
                  </div>
                </Card>
              )
            })
      }
    </div>
  )
}
