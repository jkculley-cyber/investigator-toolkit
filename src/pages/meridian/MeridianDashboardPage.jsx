import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useDashboardStats, useDeadlines, useCampusReadinessScores } from '../../hooks/useMeridian'
import { useAuth } from '../../contexts/AuthContext'
import { Skeleton, StatusChip, StatCard, Card, SectionHeader, ReadinessBar } from './MeridianUI'

export default function MeridianDashboardPage() {
  const navigate = useNavigate()
  const { district } = useAuth()
  const today = new Date()

  const { data: stats,    loading: statsLoading }    = useDashboardStats()
  const { data: deadlines, loading: deadlinesLoading } = useDeadlines(null)
  const { data: campuses,  loading: campusesLoading }  = useCampusReadinessScores()

  const overdueCount    = stats?.overdueCount    ?? 0
  const criticalCount   = stats?.criticalCount   ?? 0
  const dyslexiaPending = stats?.dyslexiaPending ?? 0
  const activeCaps      = stats?.activeCaps      ?? 0
  const avgReadiness    = campuses?.length
    ? Math.round(campuses.reduce((s, c) => s + c.readiness, 0) / campuses.length)
    : 0
  const lowCampuses     = campuses?.filter(c => c.readiness < 70).length ?? 0
  const riskScore       = Math.min(99, overdueCount * 15 + criticalCount * 7 + (dyslexiaPending > 5 ? 10 : 5))

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SPED Compliance Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(today, 'EEEE, MMM d yyyy')} — {district?.name}</p>
        </div>
        {overdueCount > 0 && (
          <button
            onClick={() => navigate('/meridian/timelines')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {overdueCount} Overdue Timeline{overdueCount !== 1 ? 's' : ''} →
          </button>
        )}
      </div>

      {/* Risk banner */}
      <div className="flex items-center gap-5 px-6 py-5 bg-red-50 border border-red-200 rounded-xl">
        <div className="w-16 h-16 rounded-full border-2 border-red-500 flex flex-col items-center justify-center flex-shrink-0">
          {statsLoading
            ? <Skeleton className="h-7 w-10" />
            : <>
                <span className="font-mono text-2xl font-semibold text-red-600 leading-none">{riskScore}</span>
                <span className="font-mono text-[9px] uppercase tracking-wide text-red-400">RISK</span>
              </>
          }
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Compliance Risk Score — {district?.name}</h2>
          <p className="text-sm text-gray-600">
            {statsLoading ? <Skeleton className="h-4 w-80" /> : (
              <>
                {overdueCount > 0 && <span className="font-semibold text-red-600">{overdueCount} student{overdueCount !== 1 ? 's' : ''} have exceeded ARD evaluation windows. </span>}
                {criticalCount > 0 && `${criticalCount} additional deadline${criticalCount !== 1 ? 's' : ''} breach in <7 days. `}
                {dyslexiaPending > 0 && `${dyslexiaPending} HB 3928 dyslexia reviews pending. `}
                {lowCampuses > 0 && `${lowCampuses} campus${lowCampuses !== 1 ? 'es' : ''} below 70% folder readiness.`}
                {overdueCount === 0 && criticalCount === 0 && dyslexiaPending === 0 && lowCampuses === 0 && 'All timelines are current. No urgent issues.'}
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => navigate('/meridian/timelines')}
          className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          View All →
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Overdue Timelines"       value={overdueCount}      sub={`+${criticalCount} breach in 7d`}                    color="red"    loading={statsLoading}    onClick={() => navigate('/meridian/timelines')} />
        <StatCard label="HB 3928 Pending Reviews" value={dyslexiaPending}   sub="Dyslexia 504 students"                               color="amber"  loading={statsLoading}    onClick={() => navigate('/meridian/dyslexia')} />
        <StatCard label="Avg Folder Readiness"    value={`${avgReadiness}%`} sub={`${lowCampuses} campus${lowCampuses!==1?'es':''} below 70%`} color="blue" loading={campusesLoading} onClick={() => navigate('/meridian/folders')} />
        <StatCard label="Active CAPs"             value={activeCaps}        sub="TEA corrective actions"                              color="purple" loading={statsLoading}    onClick={() => navigate('/meridian/cap')} />
      </div>

      {/* ARD Timelines + Escalations */}
      <div className="grid grid-cols-[1fr_320px] gap-5">
        <Card>
          <SectionHeader title="ARD & Evaluation Timelines" action="View All →" onAction={() => navigate('/meridian/timelines')} />
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Student', 'Deadline', 'Days', 'Campus', ''].map(h => (
                  <th key={h} className="px-5 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deadlinesLoading
                ? Array(6).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array(5).fill(0).map((_, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>)}
                    </tr>
                  ))
                : (deadlines ?? []).slice(0, 8).map(d => (
                    <tr
                      key={d.record_id}
                      onClick={() => navigate(`/meridian/students/${d.student_id}`)}
                      className="border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-semibold text-gray-900">{d.student_name}</div>
                        <div className="text-xs text-gray-400">Gr. {d.grade} • {d.window_label}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className={`text-xs font-mono font-medium ${d.status === 'overdue' ? 'text-red-600' : d.status === 'critical' ? 'text-amber-600' : 'text-gray-600'}`}>
                          {format(new Date(d.deadline_date), 'MMM d')}
                        </div>
                        <div className="text-xs text-gray-400">{d.deadline_type?.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-5 py-3.5"><StatusChip days={d.days_remaining} /></td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{d.campus_name?.split(' ')[0]}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/meridian/students/${d.student_id}`) }}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 rounded hover:bg-purple-50"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {!deadlinesLoading && (deadlines ?? []).length === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No active compliance deadlines.</p>
          )}
        </Card>

        {/* Escalations */}
        <Card>
          <SectionHeader title="Escalations" />
          {overdueCount > 0 && (
            <div className="flex gap-3 px-5 py-3.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/meridian/timelines')}>
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 text-sm">🔴</div>
              <div>
                <p className="text-xs font-semibold text-gray-900">ARD evaluation window{overdueCount > 1 ? 's' : ''} exceeded</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">AUTO-ESCALATED — {overdueCount} student{overdueCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
          {dyslexiaPending > 0 && (
            <div className="flex gap-3 px-5 py-3.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/meridian/dyslexia')}>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-sm">⚠️</div>
              <div>
                <p className="text-xs font-semibold text-gray-900">HB 3928 dyslexia reviews pending</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{dyslexiaPending} student{dyslexiaPending !== 1 ? 's' : ''} awaiting review</p>
              </div>
            </div>
          )}
          {activeCaps > 0 && (
            <div className="flex gap-3 px-5 py-3.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/meridian/cap')}>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm">📋</div>
              <div>
                <p className="text-xs font-semibold text-gray-900">{activeCaps} active TEA corrective action plan{activeCaps !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Review required</p>
              </div>
            </div>
          )}
          {overdueCount === 0 && dyslexiaPending === 0 && activeCaps === 0 && (
            <p className="px-5 py-8 text-sm text-gray-400 text-center">No active escalations.</p>
          )}
        </Card>
      </div>

      {/* Campus Folder Readiness */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Campus Folder Readiness</h3>
          <button onClick={() => navigate('/meridian/folders')} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Full Report →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {campusesLoading
            ? Array(6).fill(0).map((_, i) => (
                <Card key={i} className="px-5 py-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-4" />
                  <Skeleton className="h-2 w-full" />
                </Card>
              ))
            : (campuses ?? []).map(c => (
                <Card key={c.campus_id} className="px-5 py-4" onClick={() => navigate('/meridian/folders')}>
                  <p className="text-sm font-semibold text-gray-900 mb-0.5">{c.campus_name}</p>
                  <p className="text-xs text-gray-400 mb-4">{c.spedCount} SPED students</p>
                  <ReadinessBar score={c.readiness} />
                </Card>
              ))
          }
          {!campusesLoading && (campuses ?? []).length === 0 && (
            <div className="col-span-3 text-sm text-gray-400 text-center py-8">
              No SPED students enrolled. Import data via Data Integration.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
