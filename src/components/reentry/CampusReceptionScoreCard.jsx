import { useCampusReceptionScore } from '../../hooks/useReentry'

const GRADE_STYLES = {
  green:  { badge: 'bg-green-900/40 text-green-300 border border-green-700/50',  bar: 'bg-green-500' },
  blue:   { badge: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',     bar: 'bg-blue-500'  },
  yellow: { badge: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50', bar: 'bg-yellow-500' },
  red:    { badge: 'bg-red-900/40 text-red-300 border border-red-700/50',        bar: 'bg-red-500'   },
}

export default function CampusReceptionScoreCard() {
  const { scores, loading } = useCampusReceptionScore()

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-white">Campus Reception Score</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            How well each campus retains students after DAEP return — last 6 months
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
          90-day window
        </span>
      </div>

      <div className="mt-1 mb-4 text-xs text-gray-500 flex gap-4 flex-wrap">
        <span><span className="text-green-400 font-semibold">A</span> 90–100 &nbsp;·&nbsp; <span className="text-blue-400 font-semibold">B</span> 75–89 &nbsp;·&nbsp; <span className="text-yellow-400 font-semibold">C</span> 60–74 &nbsp;·&nbsp; <span className="text-red-400 font-semibold">D</span> &lt;60</span>
        <span className="text-gray-600">Score = 70% retention + 30% check-in positivity</span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-500">Analyzing campus data…</div>
      ) : scores.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-500">
          No returned students in the last 6 months. Scores will appear once students complete DAEP exit plans.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Campus</th>
                <th className="text-center pb-2 font-medium">Returned</th>
                <th className="text-center pb-2 font-medium">Re-referred</th>
                <th className="text-center pb-2 font-medium">Check-ins</th>
                <th className="text-right pb-2 font-medium pr-2">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {scores.map(c => {
                const style = GRADE_STYLES[c.gradeColor]
                return (
                  <tr key={c.campusId} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <span className="text-gray-200 font-medium text-xs">{c.campusName}</span>
                    </td>
                    <td className="py-3 text-center text-xs text-gray-300">{c.total}</td>
                    <td className="py-3 text-center">
                      <span className={`text-xs font-medium ${c.reReferred > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {c.reReferred > 0
                          ? `${c.reReferred} (${100 - c.retentionRate}%)`
                          : 'None'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {c.checkinsTotal === 0 ? (
                        <span className="text-xs text-gray-600">—</span>
                      ) : (
                        <span className={`text-xs ${c.checkinRate >= 70 ? 'text-green-400' : c.checkinRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {c.checkinRate}% positive
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        {/* Score bar */}
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${style.bar}`}
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${style.badge}`}>
                          {c.grade}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4 border-t border-gray-800 pt-3">
        Re-referral = new DAEP or OSS incident within 90 days of return date. Higher scores indicate stronger campus re-integration support.
      </p>
    </div>
  )
}
