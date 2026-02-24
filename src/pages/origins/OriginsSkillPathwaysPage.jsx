import { useOriginsDashboardStats, useOriginsStudents } from '../../hooks/useOrigins'
import { Card, SectionHeader, SkillBadge, ProgressBar, EmptyState, PATHWAYS } from './OriginsUI'
import { useNavigate } from 'react-router-dom'

export default function OriginsSkillPathwaysPage() {
  const { data: stats, loading: statsLoading } = useOriginsDashboardStats()
  const { data: enrollments, loading: studentsLoading } = useOriginsStudents()
  const navigate = useNavigate()

  const loading = statsLoading || studentsLoading

  // Count sessions per pathway from enrollments (placeholder — real data from sessions hook)
  const students = enrollments?.map(e => e.student).filter(Boolean) || []

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Skill Pathways</h1>
          <p className="text-sm text-gray-500 mt-1">5 evidence-informed pathways — enrollment and completion overview</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-medium text-teal-600">{stats?.activeStudents ?? '—'}</p>
          <p className="text-xs text-gray-400">students enrolled</p>
        </div>
      </div>

      {/* Pathway cards */}
      <div className="space-y-4">
        {PATHWAYS.map((pathway, idx) => (
          <PathwayCard key={pathway.key} pathway={pathway} index={idx + 1} loading={loading} />
        ))}
      </div>

      {/* Enrolled students quick list */}
      <Card>
        <SectionHeader
          title="Enrolled Students"
          action="View All →"
          onAction={() => navigate('/origins/progress')}
        />
        {loading ? (
          <div className="p-4 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !students.length ? (
          <EmptyState title="No students enrolled" description="Enroll students by using the enroll action on a student's Origins profile." />
        ) : (
          <div className="divide-y divide-gray-100">
            {students.slice(0, 8).map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/origins/students/${s.id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {s.first_name?.charAt(0)}{s.last_name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-gray-400">Grade {s.grade} · {s.campus?.name}</p>
                </div>
              </div>
            ))}
            {students.length > 8 && (
              <div className="px-5 py-3 text-xs text-gray-400 text-center">
                +{students.length - 8} more students
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function PathwayCard({ pathway, index, loading }) {
  const pathwayColors = {
    emotional_regulation:   { ring: 'ring-teal-200',    bg: 'bg-teal-50',    text: 'text-teal-700',    bar: 'teal' },
    conflict_deescalation:  { ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'emerald' },
    peer_pressure:          { ring: 'ring-cyan-200',    bg: 'bg-cyan-50',    text: 'text-cyan-700',    bar: 'teal' },
    rebuilding:             { ring: 'ring-sky-200',     bg: 'bg-sky-50',     text: 'text-sky-700',     bar: 'teal' },
    adult_communication:    { ring: 'ring-indigo-200',  bg: 'bg-indigo-50',  text: 'text-indigo-700',  bar: 'teal' },
  }
  const c = pathwayColors[pathway.key] || pathwayColors.emotional_regulation

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-5 ring-1 ${c.ring}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-full ${c.bg} ${c.text} flex items-center justify-center text-sm font-bold shrink-0`}>
            {index}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{pathway.label}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Skill pathway {index} of 5</p>
          </div>
        </div>
        <SkillBadge pathway={pathway.key} />
      </div>
      <div className="mt-4">
        <ProgressBar value={0} max={100} label="Completion rate" color={c.bar} />
      </div>
    </div>
  )
}
