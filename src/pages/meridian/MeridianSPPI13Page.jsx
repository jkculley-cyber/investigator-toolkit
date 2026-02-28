import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import toast from 'react-hot-toast'
import { useSPPI13Students, upsertTransitionPlan } from '../../hooks/useMeridian'
import { useAuth } from '../../contexts/AuthContext'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Skeleton, StatusBadge, Card, FilterTabs, StatCard } from './MeridianUI'

// Current school year helper (matches hook)
function currentSchoolYear() {
  const now = new Date()
  const y = now.getFullYear()
  return now.getMonth() >= 7 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
}

// Derive transition record for the current school year from the student's embedded array
function getTransition(student) {
  const sy = currentSchoolYear()
  return student.meridian_secondary_transitions?.find(t => t.school_year === sy) ?? null
}

// All 5 SPPI-13 elements present → compliant
function isCompliant(t) {
  if (!t) return false
  return !!(
    t.has_postsecondary_goals &&
    t.has_transition_assessments &&
    t.has_transition_services &&
    t.student_participated &&
    t.agency_invited
  )
}

// Determine status label
function statusLabel(student, t) {
  if (!t) return 'missing'
  if (isCompliant(t)) return 'complete'
  const g = parseInt(student.grade, 10)
  if (g >= 12) return 'overdue'
  return 'pending'
}

// Check icon cell
function CheckCell({ value }) {
  if (value === null || value === undefined)
    return <span className="text-gray-300 font-mono text-sm">—</span>
  return value
    ? <span className="text-emerald-600 font-bold text-sm">✓</span>
    : <span className="text-red-500 font-bold text-sm">✕</span>
}

export default function MeridianSPPI13Page() {
  const { districtId, profile } = useAuth()
  const { data: students, loading, refetch } = useSPPI13Students()
  const [activeFilter, setActiveFilter] = useState('all')
  const [modalStudent, setModalStudent] = useState(null)
  const sy = currentSchoolYear()

  const enriched = useMemo(() => {
    if (!students) return []
    return students.map(s => {
      const t = getTransition(s)
      return { ...s, _transition: t, _compliant: isCompliant(t), _status: statusLabel(s, t) }
    })
  }, [students])

  const total        = enriched.length
  const compliant    = enriched.filter(s => s._compliant).length
  const needsAttn    = enriched.filter(s => !s._compliant && s._transition).length
  const missingPlan  = enriched.filter(s => !s._transition).length
  const compliancePct = total > 0 ? Math.round((compliant / total) * 100) : 0

  const filtered = useMemo(() => {
    if (activeFilter === 'compliant')    return enriched.filter(s => s._compliant)
    if (activeFilter === 'needs_attn')   return enriched.filter(s => !s._compliant && s._transition)
    if (activeFilter === 'missing_plan') return enriched.filter(s => !s._transition)
    return enriched
  }, [enriched, activeFilter])

  const handleGenerateReport = () => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(16)
    doc.setTextColor(88, 28, 135)
    doc.text('Secondary Transition Compliance — SPPI-13', 14, 20)

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Generated ${format(new Date(), 'MMMM d, yyyy')}  |  School Year ${sy}`, 14, 27)
    doc.text(`Compliance Rate: ${compliancePct}%  (${compliant} of ${total} eligible students)`, 14, 33)

    doc.autoTable({
      startY: 40,
      head: [['Student', 'Grade', 'Campus', 'Goals', 'Assessments', 'Services', 'Participated', 'Agency', 'Compliant']],
      body: enriched.map(s => {
        const t = s._transition
        return [
          `${s.last_name}, ${s.first_name}`,
          s.grade ?? '—',
          s.campus?.name ?? '—',
          t?.has_postsecondary_goals  ? '✓' : '✕',
          t?.has_transition_assessments ? '✓' : '✕',
          t?.has_transition_services  ? '✓' : '✕',
          t?.student_participated     ? '✓' : '✕',
          t?.agency_invited           ? '✓' : '✕',
          s._compliant                ? 'Yes' : 'No',
        ]
      }),
      headStyles: { fillColor: [88, 28, 135] },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'center' }, 4: { halign: 'center' },
        5: { halign: 'center' }, 6: { halign: 'center' },
        7: { halign: 'center' }, 8: { halign: 'center' },
      },
    })

    // Noncompliant summary
    const noncompliant = enriched.filter(s => !s._compliant)
    if (noncompliant.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10
      doc.setFontSize(11)
      doc.setTextColor(30)
      doc.text('Noncompliant Students — Missing Elements', 14, finalY)

      const summaryBody = noncompliant.map(s => {
        const t = s._transition
        const missing = []
        if (!t || !t.has_postsecondary_goals)    missing.push('Postsecondary Goals')
        if (!t || !t.has_transition_assessments)  missing.push('Transition Assessments')
        if (!t || !t.has_transition_services)     missing.push('Transition Services')
        if (!t || !t.student_participated)        missing.push('Student Participation')
        if (!t || !t.agency_invited)              missing.push('Agency Involvement')
        return [`${s.last_name}, ${s.first_name}`, s.grade ?? '—', missing.join(', ')]
      })

      doc.autoTable({
        startY: finalY + 5,
        head: [['Student', 'Grade', 'Missing Elements']],
        body: summaryBody,
        headStyles: { fillColor: [220, 38, 38] },
        styles: { fontSize: 8 },
      })
    }

    doc.save(`SPPI-13-Report-${sy}.pdf`)
    toast.success('SPPI-13 report downloaded')
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Secondary Transition — SPPI-13</h1>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono font-medium border border-purple-200">
              IDEA § 300.320
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            IEP compliance for students grade 10+ (proxy for age 16+) — School Year {sy}
          </p>
        </div>
        <button
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          Generate Report ↓
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Requires Plan"    value={loading ? '—' : total}        sub="grade 10+ eligible"  color="purple" loading={loading} />
        <StatCard label="Fully Compliant"  value={loading ? '—' : compliant}    sub="all 5 elements met"  color="green"  loading={loading} />
        <StatCard label="Needs Attention"  value={loading ? '—' : needsAttn}    sub="partial plan on file" color="amber" loading={loading} />
        <StatCard label="Compliance %"     value={loading ? '—' : `${compliancePct}%`} sub={`${missingPlan} missing plan`} color={compliancePct >= 80 ? 'green' : compliancePct >= 60 ? 'amber' : 'red'} loading={loading} />
      </div>

      {/* Filter Tabs + Table */}
      <Card>
        <FilterTabs
          tabs={[
            { key: 'all',          label: `All (${total})`               },
            { key: 'compliant',    label: `Compliant (${compliant})`     },
            { key: 'needs_attn',   label: `Needs Attention (${needsAttn})` },
            { key: 'missing_plan', label: `Missing Plan (${missingPlan})` },
          ]}
          active={activeFilter}
          onChange={setActiveFilter}
        />

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-400">
              {total === 0
                ? 'No eligible students grade 10+ found. Students appear here once they are marked as SPED eligible and in grade 10 or above.'
                : 'No students in this filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gr</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campus</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" title="Measurable postsecondary goals">Goals</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" title="Age-appropriate transition assessments">Assessments</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" title="Transition services in IEP">Trans. Svc</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" title="Student participated in ARD">Participated</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" title="Outside agency invited">Agency</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(student => {
                  const t = student._transition
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        {student.last_name}, {student.first_name}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-600 font-mono">{student.grade ?? '—'}</td>
                      <td className="px-3 py-3 text-gray-600">{student.campus?.name ?? '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={t ? t.has_postsecondary_goals : null} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={t ? t.has_transition_assessments : null} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={t ? t.has_transition_services : null} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={t ? t.student_participated : null} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <CheckCell value={t ? t.agency_invited : null} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge status={student._status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setModalStudent(student)}
                          className="text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          Update →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Transition Plan Modal */}
      {modalStudent && (
        <TransitionPlanModal
          student={modalStudent}
          districtId={districtId}
          profileId={profile?.id}
          schoolYear={sy}
          onClose={() => setModalStudent(null)}
          onSaved={() => { refetch(); setModalStudent(null) }}
        />
      )}
    </div>
  )
}

// ── TransitionPlanModal ───────────────────────────────────────────────────────

function AccordionSection({ title, number, open, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {number}
        </span>
        <span className="text-sm font-semibold text-gray-800 flex-1">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 space-y-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'

function TransitionPlanModal({ student, districtId, profileId, schoolYear, onClose, onSaved }) {
  const existing = getTransition(student)

  const [open, setOpen] = useState({ 1: true, 2: false, 3: false, 4: false, 5: false })
  const [saving, setSaving] = useState(false)

  // Element 1
  const [hasGoals, setHasGoals]         = useState(existing?.has_postsecondary_goals ?? false)
  const [goalsDate, setGoalsDate]       = useState(existing?.postsecondary_goals_date ?? '')
  const [eduGoal, setEduGoal]           = useState(existing?.education_goal ?? '')
  const [empGoal, setEmpGoal]           = useState(existing?.employment_goal ?? '')
  const [ilGoal, setIlGoal]             = useState(existing?.independent_living_goal ?? '')

  // Element 2
  const [hasAssess, setHasAssess]       = useState(existing?.has_transition_assessments ?? false)
  const [assessDate, setAssessDate]     = useState(existing?.transition_assessments_date ?? '')
  const [assessTypes, setAssessTypes]   = useState(existing?.assessment_types ?? '')

  // Element 3
  const [hasServices, setHasServices]   = useState(existing?.has_transition_services ?? false)
  const [servicesDate, setServicesDate] = useState(existing?.transition_services_date ?? '')

  // Element 4
  const [participated, setParticipated] = useState(existing?.student_participated ?? false)
  const [participDate, setParticipDate] = useState(existing?.student_participation_date ?? '')

  // Element 5
  const [agencyInvited, setAgencyInvited]       = useState(existing?.agency_invited ?? false)
  const [agencyParticipated, setAgencyPartic]   = useState(existing?.agency_participated ?? false)
  const [agencyName, setAgencyName]             = useState(existing?.agency_name ?? '')
  const [agencyInvDate, setAgencyInvDate]       = useState(existing?.agency_invitation_date ?? '')

  const [notes, setNotes]               = useState(existing?.notes ?? '')

  const toggle = (n) => setOpen(o => ({ ...o, [n]: !o[n] }))

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      district_id:                districtId,
      student_id:                 student.id,
      school_year:                schoolYear,
      has_postsecondary_goals:    hasGoals,
      postsecondary_goals_date:   goalsDate || null,
      education_goal:             eduGoal || null,
      employment_goal:            empGoal || null,
      independent_living_goal:    ilGoal || null,
      has_transition_assessments: hasAssess,
      transition_assessments_date:assessDate || null,
      assessment_types:           assessTypes || null,
      has_transition_services:    hasServices,
      transition_services_date:   servicesDate || null,
      student_participated:       participated,
      student_participation_date: participDate || null,
      agency_invited:             agencyInvited,
      agency_participated:        agencyParticipated,
      agency_name:                agencyName || null,
      agency_invitation_date:     agencyInvDate || null,
      notes:                      notes || null,
      updated_by:                 profileId || null,
      updated_at:                 new Date().toISOString(),
    }
    const { error } = await upsertTransitionPlan(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Transition plan saved')
    onSaved()
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Transition Plan — ${student.last_name}, ${student.first_name}`}
      description={`SPPI-13 elements for ${schoolYear} | Grade ${student.grade ?? '—'} | ${student.campus?.name ?? '—'}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save Transition Plan</Button>
        </>
      }
    >
      <div className="space-y-3">
        {/* Element 1 — Postsecondary Goals */}
        <AccordionSection title="Measurable Postsecondary Goals" number="1" open={open[1]} onToggle={() => toggle(1)}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={hasGoals} onChange={e => setHasGoals(e.target.checked)} className="rounded" />
            Goals documented in IEP
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date Documented">
              <input type="date" value={goalsDate} onChange={e => setGoalsDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Education / Training Goal">
              <input type="text" value={eduGoal} onChange={e => setEduGoal(e.target.value)} placeholder="e.g. Community college, vocational..." className={inputCls} />
            </Field>
          </div>
          <Field label="Employment Goal">
            <input type="text" value={empGoal} onChange={e => setEmpGoal(e.target.value)} placeholder="e.g. Competitive employment in..." className={inputCls} />
          </Field>
          <Field label="Independent Living Goal (if applicable)">
            <input type="text" value={ilGoal} onChange={e => setIlGoal(e.target.value)} placeholder="e.g. Lives independently / with support..." className={inputCls} />
          </Field>
        </AccordionSection>

        {/* Element 2 — Transition Assessments */}
        <AccordionSection title="Age-Appropriate Transition Assessments" number="2" open={open[2]} onToggle={() => toggle(2)}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={hasAssess} onChange={e => setHasAssess(e.target.checked)} className="rounded" />
            Assessments completed and documented
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Assessment Date">
              <input type="date" value={assessDate} onChange={e => setAssessDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Assessment Types">
              <input type="text" value={assessTypes} onChange={e => setAssessTypes(e.target.value)} placeholder="e.g. Career interest inventory, BOSS..." className={inputCls} />
            </Field>
          </div>
        </AccordionSection>

        {/* Element 3 — Transition Services */}
        <AccordionSection title="Transition Services in IEP" number="3" open={open[3]} onToggle={() => toggle(3)}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={hasServices} onChange={e => setHasServices(e.target.checked)} className="rounded" />
            Transition services documented in IEP
          </label>
          <Field label="Date Documented">
            <input type="date" value={servicesDate} onChange={e => setServicesDate(e.target.value)} className={inputCls} />
          </Field>
        </AccordionSection>

        {/* Element 4 — Student Participation */}
        <AccordionSection title="Student Participated in ARD" number="4" open={open[4]} onToggle={() => toggle(4)}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={participated} onChange={e => setParticipated(e.target.checked)} className="rounded" />
            Student was invited and participated in ARD meeting
          </label>
          <Field label="Participation Date">
            <input type="date" value={participDate} onChange={e => setParticipDate(e.target.value)} className={inputCls} />
          </Field>
        </AccordionSection>

        {/* Element 5 — Agency Involvement */}
        <AccordionSection title="Outside Agency Involvement" number="5" open={open[5]} onToggle={() => toggle(5)}>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={agencyInvited} onChange={e => setAgencyInvited(e.target.checked)} className="rounded" />
              Agency invited
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={agencyParticipated} onChange={e => setAgencyPartic(e.target.checked)} className="rounded" />
              Agency participated
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Agency Name">
              <input type="text" value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="e.g. Texas Workforce Commission..." className={inputCls} />
            </Field>
            <Field label="Invitation Date">
              <input type="date" value={agencyInvDate} onChange={e => setAgencyInvDate(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </AccordionSection>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes..."
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </Modal>
  )
}
