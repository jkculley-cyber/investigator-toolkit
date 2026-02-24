import { useOriginsDashboardStats } from '../../hooks/useOrigins'
import { StatCard, Card, SectionHeader, PATHWAYS } from './OriginsUI'

export default function OriginsDashboardPage() {
  const { data, loading } = useOriginsDashboardStats()

  const completionRate = data?.sessionsTotal > 0
    ? Math.round((data.sessionsComplete / data.sessionsTotal) * 100)
    : 0

  const familyEngagementRate = data?.familyTotal > 0
    ? Math.round((data.familyComplete / data.familyTotal) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Origins Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Family skill-building — program overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Students"
          value={loading ? '—' : data?.activeStudents ?? 0}
          sub="enrolled in Origins"
          color="teal"
          loading={loading}
        />
        <StatCard
          label="Sessions Completed"
          value={loading ? '—' : data?.sessionsComplete ?? 0}
          sub={`of ${data?.sessionsTotal ?? 0} assigned`}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Replay Sessions"
          value={loading ? '—' : data?.replayComplete ?? 0}
          sub="reflections completed"
          color="teal"
          loading={loading}
        />
        <StatCard
          label="Family Engagement"
          value={loading ? '—' : `${familyEngagementRate}%`}
          sub={`${data?.familyComplete ?? 0} of ${data?.familyTotal ?? 0} activities done`}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Skill Pathways summary */}
      <Card>
        <SectionHeader title="Skill Pathways" action="View All" onAction={() => window.location.href = '/origins/pathways'} />
        <div className="divide-y divide-gray-100">
          {PATHWAYS.map(p => (
            <div key={p.key} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-700">{p.label}</span>
              <span className="text-xs text-gray-400 font-mono">—</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Session Completion Rate</h3>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-mono font-medium text-teal-600">{completionRate}%</span>
            <span className="text-sm text-gray-400 mb-1">of assigned sessions completed</span>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Getting Started</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">1</span>
              Enroll students via Skill Pathways
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">2</span>
              Assign Response Moment scenarios
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">3</span>
              Use Replay Tool after incidents
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold">4</span>
              Assign Family Workspace activities
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
