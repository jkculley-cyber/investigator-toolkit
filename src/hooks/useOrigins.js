import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Generic hook factory
function useQuery(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    queryFn().then(({ data, error }) => {
      if (!cancelled) {
        if (error) setError(error)
        else setData(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export function useOriginsDashboardStats() {
  const { districtId } = useAuth()
  return useQuery(async () => {
    const [enrollments, sessions, replay, family] = await Promise.all([
      supabase.from('origins_enrollments').select('id', { count: 'exact', head: true }).eq('district_id', districtId),
      supabase.from('origins_sessions').select('id, status').eq('district_id', districtId),
      supabase.from('origins_replay_sessions').select('id, status').eq('district_id', districtId),
      supabase.from('origins_family_activities').select('id, completed_at').eq('district_id', districtId),
    ])

    const activeStudents   = enrollments.count ?? 0
    const sessionsTotal    = sessions.data?.length ?? 0
    const sessionsComplete = sessions.data?.filter(s => s.status === 'completed').length ?? 0
    const replayComplete   = replay.data?.filter(s => s.status === 'completed').length ?? 0
    const familyComplete   = family.data?.filter(f => f.completed_at).length ?? 0
    const familyTotal      = family.data?.length ?? 0

    return {
      data: { activeStudents, sessionsTotal, sessionsComplete, replayComplete, familyComplete, familyTotal },
      error: enrollments.error || sessions.error || replay.error || family.error,
    }
  }, [districtId])
}

// ── Students enrolled in Origins ──────────────────────────────────────────────
export function useOriginsStudents(campusId = null) {
  const { districtId } = useAuth()
  return useQuery(() => {
    let q = supabase
      .from('origins_enrollments')
      .select(`
        *,
        student:students(id, first_name, last_name, grade, campus_id,
          campus:campuses(name))
      `)
      .eq('district_id', districtId)
      .order('enrolled_at', { ascending: false })

    if (campusId) q = q.eq('student.campus_id', campusId)
    return q
  }, [districtId, campusId])
}

// ── Single student detail ─────────────────────────────────────────────────────
export function useOriginsStudent(studentId) {
  const { districtId } = useAuth()
  return useQuery(async () => {
    const [enrollment, sessions, replay, family] = await Promise.all([
      supabase
        .from('origins_enrollments')
        .select(`*, student:students(id, first_name, last_name, grade, campus:campuses(name))`)
        .eq('district_id', districtId)
        .eq('student_id', studentId)
        .single(),
      supabase
        .from('origins_sessions')
        .select(`*, scenario:origins_scenarios(title, skill_pathway)`)
        .eq('district_id', districtId)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('origins_replay_sessions')
        .select('*')
        .eq('district_id', districtId)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('origins_family_activities')
        .select('*')
        .eq('district_id', districtId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
    ])

    if (enrollment.error) return { data: null, error: enrollment.error }

    return {
      data: {
        ...enrollment.data,
        sessions: sessions.data || [],
        replay_sessions: replay.data || [],
        family_activities: family.data || [],
      },
      error: sessions.error || replay.error || family.error,
    }
  }, [districtId, studentId])
}

// ── Scenario library ──────────────────────────────────────────────────────────
export function useOriginsScenarios(pathway = null) {
  const { districtId } = useAuth()
  return useQuery(() => {
    let q = supabase
      .from('origins_scenarios')
      .select('*')
      .or(`district_id.is.null,district_id.eq.${districtId}`)
      .eq('is_active', true)
      .order('title')

    if (pathway) q = q.eq('skill_pathway', pathway)
    return q
  }, [districtId, pathway])
}

// ── Replay sessions ───────────────────────────────────────────────────────────
export function useOriginsReplaySessions(filters = {}) {
  const { districtId } = useAuth()
  const { studentId, status } = filters
  return useQuery(() => {
    let q = supabase
      .from('origins_replay_sessions')
      .select(`
        *,
        student:students(first_name, last_name, grade),
        assigned_staff:profiles!origins_replay_sessions_assigned_by_fkey(full_name)
      `)
      .eq('district_id', districtId)
      .order('assigned_at', { ascending: false })

    if (studentId) q = q.eq('student_id', studentId)
    if (status)    q = q.eq('status', status)
    return q
  }, [districtId, studentId, status])
}

// ── Family workspace ──────────────────────────────────────────────────────────
export function useOriginsFamilyWorkspace(studentId) {
  const { districtId } = useAuth()
  return useQuery(() =>
    supabase
      .from('origins_family_activities')
      .select('*')
      .eq('district_id', districtId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
  , [districtId, studentId])
}
