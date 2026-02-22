import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useDeadlines } from '../../hooks/useMeridian'
import { Skeleton, StatusChip, StatusBadge, Card, FilterTabs } from './MeridianUI'

const FILTERS = [
  { key: 'all',      label: 'All Active' },
  { key: 'overdue',  label: 'Overdue' },
  { key: 'critical', label: 'Critical (<7d)' },
  { key: 'warning',  label: 'Warning' },
]

export default function MeridianTimelinesPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: deadlines, loading } = useDeadlines(filter === 'all' ? null : filter)
  const { data: allDeadlines }       = useDeadlines(null)

  const overdueCount  = allDeadlines?.filter(d => d.status === 'overdue').length  ?? 0
  const criticalCount = allDeadlines?.filter(d => d.status === 'critical').length ?? 0
  const warningCount  = allDeadlines?.filter(d => d.status === 'warning').length  ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ARD & Evaluation Timelines</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor 60-day eval windows, 30-day ARD windows, and annual IEP reviews</p>
        </div>
      </div>

      {/* Count chips */}
      <div className="flex gap-3">
        {[
          { label: 'Overdue',  count: overdueCount,  color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Critical', count: criticalCount, color: 'text-amber-600 bg-amber-50 border-amber-200' },
          { label: 'Warning',  count: warningCount,  color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
        ].map(c => (
          <div key={c.label} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${c.color}`}>
            <span className="font-mono text-lg font-semibold">{c.count}</span>
            <span className="text-xs font-medium">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <Card>
        <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Student', 'Type', 'Deadline', 'Days', 'Campus', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(6).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              : (deadlines ?? []).map(d => (
                  <tr
                    key={d.record_id}
                    onClick={() => navigate(`/meridian/students/${d.student_id}`)}
                    className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-gray-900">{d.student_name}</div>
                      <div className="text-xs text-gray-400">Grade {d.grade}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-medium text-gray-700">{d.window_label}</div>
                      <div className="text-xs text-gray-400">{d.deadline_type?.replace(/_/g, ' ')}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`text-xs font-mono font-semibold ${d.status === 'overdue' ? 'text-red-600' : d.status === 'critical' ? 'text-amber-600' : 'text-gray-700'}`}>
                        {format(new Date(d.deadline_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-5 py-4"><StatusChip days={d.days_remaining} /></td>
                    <td className="px-5 py-4"><span className="text-sm text-gray-600">{d.campus_name}</span></td>
                    <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-4">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/meridian/students/${d.student_id}`) }}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 rounded hover:bg-purple-50"
                      >
                        Open →
                      </button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {!loading && (deadlines ?? []).length === 0 && (
          <p className="px-5 py-10 text-sm text-gray-400 text-center">
            {filter === 'all' ? 'No active compliance deadlines.' : `No ${filter} deadlines.`}
          </p>
        )}
      </Card>
    </div>
  )
}
