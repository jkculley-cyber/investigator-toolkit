import { useState } from 'react'
import { useDyslexiaStudents } from '../../hooks/useMeridian'
import { Skeleton, StatusBadge, Card, FilterTabs } from './MeridianUI'

const FILTERS = [
  { key: 'all',          label: 'All Students' },
  { key: 'needs-review', label: 'Needs HB 3928 Review' },
  { key: 'progress-due', label: 'Progress Report Due' },
  { key: 'mdt-gap',      label: 'MDT Gaps' },
]

export default function MeridianDyslexiaPage() {
  const [filter, setFilter] = useState('all')
  const { data: students, loading } = useDyslexiaStudents()

  const pending      = students?.filter(s => s.hb3928_review_status === 'pending').length ?? 0
  const progressDue  = students?.filter(s => s.meridian_plan_504_progress_reports?.some(r => r.status === 'pending')).length ?? 0
  const mdtGaps      = students?.filter(s => s.meridian_plans_504?.some(p => p.is_dyslexia_plan && !p.mdt_composition_verified)).length ?? 0
  const complete     = students?.filter(s => s.hb3928_review_status === 'complete').length ?? 0

  const filtered = (students ?? []).filter(s => {
    if (filter === 'needs-review') return s.hb3928_review_status === 'pending'
    if (filter === 'progress-due') return s.meridian_plan_504_progress_reports?.some(r => r.status === 'pending')
    if (filter === 'mdt-gap')      return s.meridian_plans_504?.some(p => p.is_dyslexia_plan && !p.mdt_composition_verified)
    return true
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">Dyslexia Compliance</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200">HB 3928</span>
          </div>
          <p className="text-sm text-gray-500">Track Section 504 plans with dyslexia designation and HB 3928 review status</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '504 Reviews Pending',  value: pending,     desc: 'Not yet reviewed under HB 3928',   color: 'red',    key: 'needs-review' },
          { label: 'Progress Reports Due', value: progressDue, desc: 'Due end of grading period',        color: 'amber',  key: 'progress-due' },
          { label: 'MDT Credential Gaps',  value: mdtGaps,     desc: 'Team qualifications unverified',   color: 'purple', key: 'mdt-gap'      },
          { label: 'Fully Compliant',      value: complete,    desc: 'Reviewed, current, documented',    color: 'green',  key: null           },
        ].map(c => {
          const borderColors = { red: 'border-t-red-500', amber: 'border-t-amber-500', purple: 'border-t-purple-500', green: 'border-t-emerald-500' }
          const textColors   = { red: 'text-red-600', amber: 'text-amber-600', purple: 'text-purple-600', green: 'text-emerald-600' }
          const isActive = filter === c.key
          return (
            <div
              key={c.key || c.label}
              onClick={() => c.key && setFilter(filter === c.key ? 'all' : c.key)}
              className={`bg-white border border-t-2 ${borderColors[c.color]} rounded-xl px-5 py-4 ${c.key ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''} ${isActive ? 'ring-1 ring-purple-300' : ''}`}
            >
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-2">{c.label}</p>
              {loading ? <Skeleton className="h-7 w-12 mb-1.5" /> : <p className={`font-mono text-3xl font-medium leading-none mb-1.5 ${textColors[c.color]}`}>{c.value}</p>}
              <p className="text-xs text-gray-400 leading-snug">{c.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Progress report alert */}
      {progressDue > 0 && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-lg">⏰</span>
          <p className="text-sm text-amber-800 flex-1">
            <strong>Grading period ending</strong> — HB 3928 requires progress reports every grading period for all dyslexia plans.
            {' '}{progressDue} report{progressDue !== 1 ? 's' : ''} outstanding.
          </p>
          <button className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap">
            Send Reminders
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Student', 'Campus', 'Plan', 'HB 3928 Review', 'Progress Report', 'MDT Verified', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              : filtered.map(s => {
                  const dysPlan      = s.meridian_plans_504?.find(p => p.is_dyslexia_plan) || s.meridian_plans_504?.[0]
                  const hasProgressDue = s.meridian_plan_504_progress_reports?.some(r => r.status === 'pending')
                  const mdtVerified  = dysPlan?.mdt_composition_verified ?? false
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-900">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-gray-400">Grade {s.grade}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{s.campus?.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${s.plan_type === 'IEP' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {s.plan_type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={s.hb3928_review_status} /></td>
                      <td className="px-5 py-3.5">
                        {hasProgressDue
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-amber-100 text-amber-700">DUE</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-emerald-100 text-emerald-700">CURRENT</span>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        {mdtVerified
                          ? <span className="text-xs font-mono text-emerald-600">✓ Verified</span>
                          : <span className="text-xs font-mono text-red-500">⚠ Unverified</span>
                        }
                      </td>
                      <td className="px-5 py-3.5">
                        <button className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2 py-1 rounded hover:bg-purple-50">
                          View Plan →
                        </button>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">
            {filter === 'all' ? 'No students with dyslexia identified.' : `No students matching this filter.`}
          </p>
        )}
      </Card>
    </div>
  )
}
