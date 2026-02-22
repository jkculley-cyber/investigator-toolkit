import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── Referrals ─────────────────────────────────────────────────────────────────

export function useNavigatorReferrals(filters = {}) {
  const { districtId } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!districtId) return
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('navigator_referrals')
        .select(`
          *,
          students(id, first_name, last_name, grade_level),
          campuses(id, name),
          reporter:profiles!navigator_referrals_reported_by_fkey(id, full_name),
          reviewer:profiles!navigator_referrals_reviewed_by_fkey(id, full_name),
          offense_codes(id, code, description, category)
        `)
        .eq('district_id', districtId)
        .order('referral_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters.status) q = q.eq('status', filters.status)
      if (filters.campus_id) q = q.eq('campus_id', filters.campus_id)
      if (filters.date_from) q = q.gte('referral_date', filters.date_from)
      if (filters.date_to) q = q.lte('referral_date', filters.date_to)

      const { data, error: err } = await q
      if (err) throw err
      setReferrals(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [districtId, filters.status, filters.campus_id, filters.date_from, filters.date_to])

  useEffect(() => { fetch() }, [fetch])

  return { referrals, loading, error, refetch: fetch }
}

// ─── Placements ────────────────────────────────────────────────────────────────

export function useNavigatorPlacements(filters = {}) {
  const { districtId } = useAuth()
  const [placements, setPlacements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!districtId) return
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('navigator_placements')
        .select(`
          *,
          students(id, first_name, last_name, grade_level),
          campuses(id, name),
          assigner:profiles!navigator_placements_assigned_by_fkey(id, full_name),
          notifier:profiles!navigator_placements_parent_notified_by_fkey(id, full_name),
          navigator_referrals(id, referral_date, description)
        `)
        .eq('district_id', districtId)
        .order('start_date', { ascending: false })

      if (filters.placement_type) q = q.eq('placement_type', filters.placement_type)
      if (filters.campus_id) q = q.eq('campus_id', filters.campus_id)
      if (filters.active_only) q = q.is('end_date', null).lte('start_date', 'now()')

      const { data, error: err } = await q
      if (err) throw err
      setPlacements(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [districtId, filters.placement_type, filters.campus_id, filters.active_only])

  useEffect(() => { fetch() }, [fetch])

  return { placements, loading, error, refetch: fetch }
}

// ─── Supports ──────────────────────────────────────────────────────────────────

export function useNavigatorSupports(studentId = null) {
  const { districtId } = useAuth()
  const [supports, setSupports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!districtId) return
    setLoading(true)
    setError(null)
    try {
      let q = supabase
        .from('navigator_supports')
        .select(`
          *,
          students(id, first_name, last_name, grade_level),
          campuses(id, name),
          assigner:profiles!navigator_supports_assigned_by_fkey(id, full_name),
          assignee:profiles!navigator_supports_assigned_to_fkey(id, full_name)
        `)
        .eq('district_id', districtId)
        .order('start_date', { ascending: false })

      if (studentId) q = q.eq('student_id', studentId)

      const { data, error: err } = await q
      if (err) throw err
      setSupports(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [districtId, studentId])

  useEffect(() => { fetch() }, [fetch])

  return { supports, loading, error, refetch: fetch }
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────────

export function useNavigatorDashboardStats() {
  const { districtId } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentReferrals, setRecentReferrals] = useState([])
  const [escalationAlerts, setEscalationAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!districtId) return
    setLoading(true)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [referralsThisMonth, activeISS, activeOSS, recentRes, ossStudents] = await Promise.all([
      supabase
        .from('navigator_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('district_id', districtId)
        .gte('referral_date', monthStart),

      supabase
        .from('navigator_placements')
        .select('id', { count: 'exact', head: true })
        .eq('district_id', districtId)
        .eq('placement_type', 'iss')
        .is('end_date', null),

      supabase
        .from('navigator_placements')
        .select('id', { count: 'exact', head: true })
        .eq('district_id', districtId)
        .eq('placement_type', 'oss')
        .is('end_date', null),

      supabase
        .from('navigator_referrals')
        .select(`
          id, referral_date, description, status,
          students(first_name, last_name),
          campuses(name),
          offense_codes(code, description)
        `)
        .eq('district_id', districtId)
        .order('created_at', { ascending: false })
        .limit(10),

      // Students with 3+ OSS in rolling 90 days — escalation alert
      supabase
        .from('navigator_placements')
        .select('student_id, students(first_name, last_name)')
        .eq('district_id', districtId)
        .eq('placement_type', 'oss')
        .gte('start_date', ninetyDaysAgo),
    ])

    // Count OSS per student for escalation
    const ossCounts = {}
    const ossStudentNames = {}
    ;(ossStudents.data || []).forEach(p => {
      const sid = p.student_id
      ossCounts[sid] = (ossCounts[sid] || 0) + 1
      if (p.students) ossStudentNames[sid] = p.students
    })
    const escalations = Object.entries(ossCounts)
      .filter(([, count]) => count >= 3)
      .map(([sid, count]) => ({ student_id: sid, oss_count: count, student: ossStudentNames[sid] }))

    setStats({
      referralsThisMonth: referralsThisMonth.count || 0,
      activeISS: activeISS.count || 0,
      activeOSS: activeOSS.count || 0,
    })
    setRecentReferrals(recentRes.data || [])
    setEscalationAlerts(escalations)
    setLoading(false)
  }, [districtId])

  useEffect(() => { fetch() }, [fetch])

  return { stats, recentReferrals, escalationAlerts, loading, refetch: fetch }
}

// ─── Student History ───────────────────────────────────────────────────────────

export function useNavigatorStudentHistory(studentId) {
  const { districtId } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [placements, setPlacements] = useState([])
  const [supports, setSupports] = useState([])
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!districtId || !studentId) return
    setLoading(true)

    const [studentRes, referralRes, placementRes, supportRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, campuses(name)')
        .eq('id', studentId)
        .single(),

      supabase
        .from('navigator_referrals')
        .select(`*, offense_codes(code, description), reporter:profiles!navigator_referrals_reported_by_fkey(full_name)`)
        .eq('student_id', studentId)
        .eq('district_id', districtId)
        .order('referral_date', { ascending: false }),

      supabase
        .from('navigator_placements')
        .select(`*, assigner:profiles!navigator_placements_assigned_by_fkey(full_name)`)
        .eq('student_id', studentId)
        .eq('district_id', districtId)
        .order('start_date', { ascending: false }),

      supabase
        .from('navigator_supports')
        .select(`*, assigner:profiles!navigator_supports_assigned_by_fkey(full_name), assignee:profiles!navigator_supports_assigned_to_fkey(full_name)`)
        .eq('student_id', studentId)
        .eq('district_id', districtId)
        .order('start_date', { ascending: false }),
    ])

    setStudent(studentRes.data)
    setReferrals(referralRes.data || [])
    setPlacements(placementRes.data || [])
    setSupports(supportRes.data || [])
    setLoading(false)
  }, [districtId, studentId])

  useEffect(() => { fetch() }, [fetch])

  // Simple risk score: 0–10 based on referral + placement count
  const riskScore = Math.min(10, (referrals.length * 1) + (placements.length * 2))

  return { student, referrals, placements, supports, riskScore, loading, refetch: fetch }
}
