import { useParams, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import Topbar from '../../components/layout/Topbar'
import { useNavigatorStudentHistory } from '../../hooks/useNavigator'

const SUPPORT_TYPE_LABELS = {
  cico: 'CICO',
  behavior_contract: 'Behavior Contract',
  counseling_referral: 'Counseling Referral',
  parent_contact: 'Parent Contact',
  mentoring: 'Mentoring',
  other: 'Other',
}

export default function NavigatorStudentPage() {
  const { id } = useParams()
  const { student, referrals, placements, supports, riskScore, loading } = useNavigatorStudentHistory(id)

  if (loading) {
    return (
      <div>
        <Topbar title="Navigator — Student History" />
        <div className="p-6 text-center text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div>
        <Topbar title="Navigator — Student History" />
        <div className="p-6 text-center text-gray-400">Student not found.</div>
      </div>
    )
  }

  const activeSupports = supports.filter(s => s.status === 'active')
  const riskColor = riskScore >= 7 ? 'text-red-600 bg-red-50 border-red-200' : riskScore >= 4 ? 'text-yellow-600 bg-yellow-50 border-yellow-200' : 'text-green-600 bg-green-50 border-green-200'

  return (
    <div>
      <Topbar
        title="Navigator — Student History"
        subtitle={student.first_name + ' ' + student.last_name}
        actions={
          <Link
            to={`/incidents/new?student=${id}`}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            Escalate to Waypoint DAEP →
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Student Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-500 shrink-0">
            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{student.first_name} {student.last_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Grade {student.grade_level || '—'} · {student.campuses?.name || '—'}
            </p>
            {student.student_id && (
              <p className="text-xs text-gray-400 mt-1 font-mono">{student.student_id}</p>
            )}
          </div>
          <div className={`px-4 py-3 rounded-xl border text-center ${riskColor}`}>
            <p className="text-2xl font-bold">{riskScore}/10</p>
            <p className="text-xs font-medium mt-0.5">Behavior Risk</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{referrals.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{placements.length}</p>
            <p className="text-xs text-gray-500 mt-1">Placements (ISS/OSS)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{activeSupports.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active Supports</p>
          </div>
        </div>

        {/* Active Supports */}
        {activeSupports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Active Supports</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {activeSupports.map(s => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{SUPPORT_TYPE_LABELS[s.support_type] || s.support_type}</p>
                    <p className="text-xs text-gray-400">
                      Assigned to {s.assignee?.full_name || 'Unassigned'} · Started {s.start_date ? format(parseISO(s.start_date), 'MMM d, yyyy') : '—'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Behavior Timeline</h3>
          </div>
          <div className="p-5">
            {referrals.length === 0 && placements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No behavior history on record.</p>
            ) : (
              <div className="relative space-y-4">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />

                {/* Merge referrals and placements into chronological timeline */}
                {[
                  ...referrals.map(r => ({ type: 'referral', date: r.referral_date, data: r })),
                  ...placements.map(p => ({ type: 'placement', date: p.start_date, data: p })),
                ]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((item, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-8">
                      <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.type === 'referral' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {item.type === 'referral' ? 'R' : 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {item.type === 'referral'
                              ? `Referral — ${item.data.offense_codes?.code || 'No code'}`
                              : `${item.data.placement_type?.toUpperCase()} Placement`}
                          </p>
                          <span className="text-xs text-gray-400 shrink-0">
                            {item.date ? format(parseISO(item.date), 'MMM d, yyyy') : '—'}
                          </span>
                        </div>
                        {item.type === 'referral' && item.data.description && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.data.description}</p>
                        )}
                        {item.type === 'placement' && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.data.days ? `${item.data.days} day${item.data.days !== 1 ? 's' : ''}` : ''}
                            {item.data.end_date ? ` · Ended ${format(parseISO(item.data.end_date), 'MMM d')}` : ' · Active'}
                          </p>
                        )}
                        {item.type === 'referral' && item.data.status && (
                          <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded capitalize ${
                            item.data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.data.status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
