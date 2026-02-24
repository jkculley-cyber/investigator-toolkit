import { useOriginsDashboardStats, useOriginsStudents } from '../../hooks/useOrigins'
import { StatCard, Card, SectionHeader, ProgressBar, EmptyState, PATHWAYS } from './OriginsUI'
import { useNavigate } from 'react-router-dom'

export default function OriginsProgressPage() {
  const { data: stats, loading: statsLoading } = useOriginsDashboardStats()
  const { data: enrollments, loading: studentsLoading } = useOriginsStudents()
  const navigate = useNavigate()

  const loading = statsLoading || studentsLoading
  const students = enrollments?.map(e => e.student).filter(Boolean) || []

  const completionRate = stats?.sessionsTotal > 0
    ? Math.round((stats.sessionsComplete / stats.sessionsTotal) * 100)
    : 0

  const familyEngagementRate = stats?.familyTotal > 0
    ? Math.round((stats.familyComplete / stats.familyTotal) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Progress Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Campus and district-level skill gain and family engagement reporting</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Students"
          value={loading ? '—' : stats?.activeStudents ?? 0}
          sub="enrolled in Origins"
          color="teal"
          loading={loading}
        />
        <StatCard
          label="Completion Rate"
          value={loading ? '—' : `${completionRate}%`}
          sub={`${stats?.sessionsComplete ?? 0} of ${stats?.sessionsTotal ?? 0} sessions`}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Family Engagement"
          value={loading ? '—' : `${familyEngagementRate}%`}
          sub={`${stats?.familyComplete ?? 0} of ${stats?.familyTotal ?? 0} activities`}
          color="teal"
          loading={loading}
        />
        <StatCard
          label="Replay Reflections"
          value={loading ? '—' : stats?.replayComplete ?? 0}
          sub="completed reflections"
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Pathway breakdown */}
      <Card>
        <SectionHeader title="Pathway Completion Overview" />
        <div className="p-5 space-y-5">
          {PATHWAYS.map(p => (
            <div key={p.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-gray-700">{p.label}</span>
                <span className="text-xs font-mono text-gray-400">—% complete</span>
              </div>
              <ProgressBar value={0} max={100} color="teal" />
            </div>
          ))}
        </div>
      </Card>

      {/* Student progress table */}
      <Card>
        <SectionHeader title="Student Progress" />
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-100 rounded w-20" />
                <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : !students.length ? (
          <EmptyState title="No students enrolled" description="Enroll students in Origins to track progress." />
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Header row */}
            <div className="flex items-center gap-4 px-5 py-2 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 flex-1">Student</span>
              <span className="text-xs font-semibold text-gray-500 w-24 text-center">Grade</span>
              <span className="text-xs font-semibold text-gray-500 w-32 text-center">Campus</span>
              <span className="text-xs font-semibold text-gray-500 w-24 text-center">Sessions</span>
            </div>
            {students.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/origins/students/${s.id}`)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {s.first_name} {s.last_name}
                  </span>
                </div>
                <span className="text-sm text-gray-500 w-24 text-center">{s.grade}</span>
                <span className="text-sm text-gray-500 w-32 text-center truncate">{s.campus?.name}</span>
                <span className="text-sm text-gray-400 w-24 text-center font-mono">—</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
