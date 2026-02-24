import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import Topbar from '../../components/layout/Topbar'
import { useNavigatorPlacements } from '../../hooks/useNavigator'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { exportToExcel } from '../../lib/exportUtils'

const TABS = [
  { key: 'active_iss', label: 'Active ISS' },
  { key: 'active_oss', label: 'Active OSS' },
  { key: 'history', label: 'History' },
]

export default function NavigatorPlacementsPage() {
  const [activeTab, setActiveTab] = useState('active_iss')
  const [showDrawer, setShowDrawer] = useState(false)

  const filters = {
    placement_type: activeTab === 'history' ? '' : activeTab === 'active_iss' ? 'iss' : 'oss',
    active_only: activeTab !== 'history',
  }
  const { placements, loading, refetch } = useNavigatorPlacements(filters)

  const handleExport = () => {
    const headers = ['Student', 'Campus', 'Type', 'Start', 'End', 'Days', 'Assigned By', 'Parent Notified']
    const rows = placements.map(p => [
      p.students ? `${p.students.first_name} ${p.students.last_name}` : '—',
      p.campuses?.name || '—',
      p.placement_type?.toUpperCase(),
      p.start_date || '—',
      p.end_date || '—',
      p.days ?? '—',
      p.assigner?.full_name || '—',
      p.parent_notified ? 'Yes' : 'No',
    ])
    exportToExcel(`Navigator ${activeTab.replace('_', ' ')}`, headers, rows, { filename: `navigator_placements_${activeTab}` })
  }

  return (
    <div>
      <Topbar
        title="Navigator — Placements"
        subtitle="ISS and OSS placement tracking"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export Excel
            </button>
            <button
              onClick={() => setShowDrawer(true)}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              + New Placement
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading placements...</div>
          ) : placements.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No placements found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Campus</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Start</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">End</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Days</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned By</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Parent Notified</th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Re-entry Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {placements.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/navigator/students/${p.student_id}`} className="font-medium text-gray-900 hover:text-orange-600">
                          {p.students ? `${p.students.first_name} ${p.students.last_name}` : '—'}
                        </Link>
                        <p className="text-xs text-gray-400">{p.students?.grade_level || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.campuses?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          p.placement_type === 'iss' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {p.placement_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.start_date ? format(parseISO(p.start_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {p.end_date ? format(parseISO(p.end_date), 'MMM d, yyyy') : <span className="text-orange-500 font-medium">Active</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.days ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.assigner?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        {p.parent_notified
                          ? <span className="text-green-600 font-medium text-xs">Yes</span>
                          : <span className="text-red-500 text-xs">No</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={p.reentry_plan || ''}>
                        {p.reentry_plan || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showDrawer && (
        <NewPlacementDrawer
          onClose={() => setShowDrawer(false)}
          onSaved={() => { setShowDrawer(false); refetch() }}
        />
      )}
    </div>
  )
}

// ─── New Placement Drawer ─────────────────────────────────────────────────────

function NewPlacementDrawer({ onClose, onSaved }) {
  const { districtId, profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [campuses, setCampuses] = useState([])
  const [form, setForm] = useState({
    campus_id: '',
    placement_type: 'iss',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    days: '',
    location: '',
    reason: '',
    reentry_plan: '',
    parent_notified: false,
  })

  useEffect(() => {
    if (!districtId) return
    supabase.from('campuses').select('id, name').eq('district_id', districtId).order('name')
      .then(({ data }) => setCampuses(data || []))
  }, [districtId])

  const searchStudents = async (q) => {
    if (q.length < 2) { setStudents([]); return }
    const { data } = await supabase
      .from('students')
      .select('id, first_name, last_name, grade_level')
      .eq('district_id', districtId)
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(8)
    setStudents(data || [])
  }

  const handleSave = async () => {
    if (!selectedStudent || !form.campus_id || !form.placement_type || !form.start_date) {
      setError('Student, campus, type, and start date are required.')
      return
    }
    setSaving(true); setError(null)
    const { error: err } = await supabase.from('navigator_placements').insert({
      district_id: districtId,
      campus_id: form.campus_id,
      student_id: selectedStudent.id,
      assigned_by: profile.id,
      placement_type: form.placement_type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      days: form.days ? parseInt(form.days) : null,
      location: form.location || null,
      reason: form.reason || null,
      reentry_plan: form.reentry_plan || null,
      parent_notified: form.parent_notified,
      parent_notified_at: form.parent_notified ? new Date().toISOString() : null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">New Placement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Student search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Student *</label>
            {selectedStudent ? (
              <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                <button onClick={() => { setSelectedStudent(null); setStudents([]) }} className="text-xs text-gray-400">Change</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400"
                  placeholder="Search by name..."
                  value={studentSearch}
                  onChange={e => { setStudentSearch(e.target.value); searchStudents(e.target.value) }}
                />
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {students.map(s => (
                      <button key={s.id} className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50" onClick={() => { setSelectedStudent(s); setStudents([]) }}>
                        {s.first_name} {s.last_name} <span className="text-gray-400 text-xs">(Grade {s.grade_level})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Campus *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.campus_id} onChange={e => setForm(f => ({ ...f, campus_id: e.target.value }))}>
                <option value="">Select...</option>
                {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.placement_type} onChange={e => setForm(f => ({ ...f, placement_type: e.target.value }))}>
                <option value="iss">ISS</option>
                <option value="oss">OSS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date *</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Days</label>
              <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Reason</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none" rows={2} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Re-entry Plan</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 resize-none" rows={2} value={form.reentry_plan} onChange={e => setForm(f => ({ ...f, reentry_plan: e.target.value }))} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.parent_notified} onChange={e => setForm(f => ({ ...f, parent_notified: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
            <span className="text-sm text-gray-700">Parent/Guardian Notified</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg">
            {saving ? 'Saving…' : 'Save Placement'}
          </button>
        </div>
      </div>
    </div>
  )
}
