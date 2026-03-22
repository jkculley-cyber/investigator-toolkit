import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Topbar from '../components/layout/Topbar'

export default function QuickIncidentPage() {
  const { profile, districtId, campusIds } = useAuth()
  const descRef = useRef(null)

  // Student search
  const [studentSearch, setStudentSearch] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Form fields
  const now = new Date()
  const [description, setDescription] = useState('')
  const [incidentDate, setIncidentDate] = useState(now.toISOString().split('T')[0])
  const [incidentTime, setIncidentTime] = useState(
    now.toTimeString().slice(0, 5)
  )
  const [location, setLocation] = useState('')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Student search with debounce
  useEffect(() => {
    if (!districtId || studentSearch.trim().length < 2) {
      setStudentResults([])
      return
    }
    const q = studentSearch.trim().toLowerCase()
    const timeout = setTimeout(async () => {
      setSearchLoading(true)
      let query = supabase
        .from('students')
        .select('id, first_name, last_name, student_id_number, grade_level, campus_id')
        .eq('district_id', districtId)
        .eq('is_active', true)
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,student_id_number.ilike.%${q}%`)
        .limit(8)
      // Scope to teacher's campuses if assigned
      if (campusIds?.length > 0) {
        query = query.in('campus_id', campusIds)
      }
      const { data } = await query
      setStudentResults(data || [])
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(timeout)
  }, [studentSearch, districtId, campusIds])

  function selectStudent(student) {
    setSelectedStudent(student)
    setStudentSearch(`${student.first_name} ${student.last_name}`)
    setShowDropdown(false)
    // Auto-focus description after selecting student
    setTimeout(() => descRef.current?.focus(), 100)
  }

  function clearStudent() {
    setSelectedStudent(null)
    setStudentSearch('')
    setStudentResults([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedStudent || !description.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from('incidents').insert({
        student_id: selectedStudent.id,
        description: description.trim(),
        incident_date: incidentDate,
        incident_time: incidentTime || null,
        location: location.trim() || null,
        district_id: districtId,
        campus_id: selectedStudent.campus_id || (campusIds?.[0] || null),
        reported_by: profile.id,
        status: 'draft',
        consequence_type: null,
        referred_by_teacher: true,
      })

      if (error) throw error
      setSubmitted(true)
      toast.success('Incident reported')
    } catch (err) {
      console.error('Quick incident submit failed:', err)
      toast.error('Failed to submit incident. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    const n = new Date()
    setSelectedStudent(null)
    setStudentSearch('')
    setStudentResults([])
    setDescription('')
    setIncidentDate(n.toISOString().split('T')[0])
    setIncidentTime(n.toTimeString().slice(0, 5))
    setLocation('')
    setSubmitted(false)
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div>
        <Topbar title="Quick Report" subtitle="Incident submitted" />
        <div className="max-w-lg mx-auto p-4 md:p-6 mt-8">
          <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Incident Reported</h2>
            <p className="text-sm text-gray-600 mb-6">
              An administrator will review and assign the appropriate action.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors min-h-[48px]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report Another
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors min-h-[48px]"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div>
      <Topbar title="Quick Report" subtitle="Report an incident in 30 seconds" />

      <div className="max-w-lg mx-auto p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Student Search */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Student <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {selectedStudent ? (
                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 min-h-[48px]">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedStudent.student_id_number ? `ID: ${selectedStudent.student_id_number}` : ''}
                      {selectedStudent.grade_level != null ? ` | Grade ${selectedStudent.grade_level}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearStudent}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Clear student"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true) }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by name or ID..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm min-h-[48px] transition-colors"
                    autoComplete="off"
                  />
                  {showDropdown && (studentResults.length > 0 || searchLoading) && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {searchLoading ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
                      ) : (
                        studentResults.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => selectStudent(s)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0 min-h-[48px]"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {s.first_name} {s.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {s.student_id_number || 'No ID'} | Grade {s.grade_level ?? '--'}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              What happened <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={descRef}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what you observed..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm transition-colors resize-none"
              required
            />
          </div>

          {/* Date & Time — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={incidentDate}
                onChange={e => setIncidentDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm min-h-[48px] transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Time</label>
              <input
                type="time"
                value={incidentTime}
                onChange={e => setIncidentTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm min-h-[48px] transition-colors"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Where</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Hallway, Cafeteria, Room 204..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-sm min-h-[48px] transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!selectedStudent || !description.trim() || submitting}
            className="w-full px-6 py-4 text-base font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors min-h-[56px]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Report'
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            This creates a draft incident. An administrator will review and assign consequences.
          </p>
        </form>
      </div>
    </div>
  )
}
