import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { exportToPdf, exportToExcel } from '../../lib/exportUtils'

const CHART_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b']

export default function NavigatorReportsPage() {
  const { districtId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [trendData, setTrendData] = useState([])
  const [issOssData, setIssOssData] = useState([])
  const [offenseData, setOffenseData] = useState([])
  const [campusData, setCampusData] = useState([])

  useEffect(() => {
    if (!districtId) return
    loadReportData()
  }, [districtId])

  async function loadReportData() {
    setLoading(true)

    // Build 6-month date range
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i)
      return { label: format(d, 'MMM yy'), start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd') }
    })

    const [referralsRes, placementsRes, offenseRes, campusRes] = await Promise.all([
      supabase.from('navigator_referrals').select('referral_date').eq('district_id', districtId),
      supabase.from('navigator_placements').select('start_date, placement_type').eq('district_id', districtId),
      supabase.from('navigator_referrals').select('offense_codes(code, description)').eq('district_id', districtId).not('offense_code_id', 'is', null),
      supabase.from('navigator_referrals').select('campus_id, campuses(name)').eq('district_id', districtId),
    ])

    // Trend: referrals by month
    const trend = months.map(m => {
      const count = (referralsRes.data || []).filter(r => r.referral_date >= m.start && r.referral_date <= m.end).length
      return { month: m.label, referrals: count }
    })
    setTrendData(trend)

    // ISS vs OSS breakdown
    const issCount = (placementsRes.data || []).filter(p => p.placement_type === 'iss').length
    const ossCount = (placementsRes.data || []).filter(p => p.placement_type === 'oss').length
    setIssOssData([
      { name: 'ISS', value: issCount },
      { name: 'OSS', value: ossCount },
    ])

    // Top 10 offense codes
    const offenseMap = {}
    ;(offenseRes.data || []).forEach(r => {
      if (r.offense_codes) {
        const key = r.offense_codes.code
        offenseMap[key] = offenseMap[key] || { code: key, description: r.offense_codes.description, count: 0 }
        offenseMap[key].count++
      }
    })
    const offenses = Object.values(offenseMap).sort((a, b) => b.count - a.count).slice(0, 10)
    setOffenseData(offenses)

    // By campus
    const campusMap = {}
    ;(campusRes.data || []).forEach(r => {
      if (r.campuses) {
        const name = r.campuses.name
        campusMap[name] = (campusMap[name] || 0) + 1
      }
    })
    const campusList = Object.entries(campusMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
    setCampusData(campusList)

    setLoading(false)
  }

  const handleExportPdf = () => {
    const headers = ['Month', 'Referrals']
    const rows = trendData.map(d => [d.month, d.referrals])
    exportToPdf('Navigator — Referral Trend Report', headers, rows, { subtitle: 'Last 6 months', filename: 'navigator_trend_report' })
  }

  const handleExportExcel = () => {
    const headers = ['Month', 'Referrals']
    const rows = trendData.map(d => [d.month, d.referrals])
    exportToExcel('Navigator Trend', headers, rows, { filename: 'navigator_trend_report' })
  }

  if (loading) {
    return (
      <div>
        <Topbar title="Navigator — Reports" />
        <div className="p-6 text-center text-gray-400">Loading reports...</div>
      </div>
    )
  }

  return (
    <div>
      <Topbar
        title="Navigator — Reports"
        subtitle="Discipline trends and behavioral analytics"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleExportPdf} className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Export PDF</button>
            <button onClick={handleExportExcel} className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Export Excel</button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Referral Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Referral Trend (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="referrals" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ISS vs OSS Donut */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">ISS vs OSS Ratio</h2>
            {issOssData[0]?.value === 0 && issOssData[1]?.value === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No placement data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={issOssData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {issOssData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* By Campus */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Referrals by Campus</h2>
            {campusData.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {campusData.map((c, i) => {
                  const max = campusData[0]?.count || 1
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-32 truncate shrink-0" title={c.name}>{c.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-orange-400 h-2 rounded-full transition-all"
                          style={{ width: `${(c.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-6 text-right">{c.count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top Offense Codes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Top 10 Offense Codes</h2>
          {offenseData.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No offense code data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={offenseData} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11 }} width={75} />
                <Tooltip formatter={(v, n, p) => [v, p.payload.description || p.payload.code]} />
                <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
