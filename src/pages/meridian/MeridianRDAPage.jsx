import { useState, useMemo } from 'react'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import {
  useRDADetermination,
  useRDAIndicators,
  useSPPI13Students,
  useDeadlines,
  upsertRDADetermination,
  upsertRDAIndicator,
} from '../../hooks/useMeridian'
import { useAuth } from '../../contexts/AuthContext'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Skeleton, Card } from './MeridianUI'

// Current school year (matches hook)
function currentSchoolYear() {
  const now = new Date()
  const y = now.getFullYear()
  return now.getMonth() >= 7 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
}

// SPPI configuration — targets and domain groupings
const SPPI_TARGETS = {
  '1':  { label: 'Graduation Rate',                target: 85,   domain: 'I',   auto: false },
  '2':  { label: 'Dropout Rate (≤)',               target: 0.54, domain: 'I',   auto: false },
  '5':  { label: 'LRE ≥80% (School-Age)',          target: 65,   domain: 'II',  auto: false },
  '6':  { label: 'LRE (Preschool Regular)',         target: 32,   domain: 'II',  auto: false },
  '7':  { label: 'Preschool Outcomes',              target: null, domain: 'II',  auto: false },
  '8':  { label: 'Parent Involvement',              target: 80,   domain: 'II',  auto: false },
  '11': { label: 'Evaluation Timeliness',           target: 100,  domain: 'II',  auto: true  },
  '12': { label: 'Early Childhood Transition',      target: 100,  domain: 'II',  auto: false },
  '13': { label: 'Secondary Transition IEP',        target: 100,  domain: 'II',  auto: true  },
  '9':  { label: 'Disproportionality (Overall)',    target: null, domain: 'III', auto: false },
  '10': { label: 'Disproportionality (Disability)', target: null, domain: 'III', auto: false },
}

const DL_CONFIG = {
  dl1: { label: 'DL1 — Meets Requirements',               color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  dl2: { label: 'DL2 — Needs Assistance',                 color: 'amber',   bg: 'bg-amber-50',   border: 'border-amber-300',   text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-700'   },
  dl3: { label: 'DL3 — Needs Intervention',               color: 'orange',  bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-800',  badge: 'bg-orange-100 text-orange-700' },
  dl4: { label: 'DL4 — Needs Substantial Intervention',   color: 'red',     bg: 'bg-red-50',     border: 'border-red-300',     text: 'text-red-800',     badge: 'bg-red-100 text-red-700'       },
}

const STATUS_CONFIG = {
  meets:        { label: 'Meets',        cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  approaching:  { label: 'Approaching',  cls: 'bg-amber-100 text-amber-700 border-amber-200'       },
  not_meets:    { label: 'Not Meets',    cls: 'bg-red-100 text-red-700 border-red-200'             },
}

function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status]
  if (!cfg) return <span className="text-xs text-gray-400 font-mono">—</span>
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Auto-calculated SPPI-11: eval timeliness from meridian_compliance_deadlines ─
function useAutoSPPI11() {
  const { data: deadlines } = useDeadlines()
  if (!deadlines) return null
  const evalRows = deadlines.filter(d => d.evaluation_type === 'initial' || d.evaluation_type === 'triennial')
  if (evalRows.length === 0) return null
  const onTime = evalRows.filter(d => d.status !== 'overdue').length
  return Math.round((onTime / evalRows.length) * 100)
}

// ── Auto-calculated SPPI-13: secondary transition compliance ─────────────────
function useAutoSPPI13() {
  const { data: students } = useSPPI13Students()
  if (!students || students.length === 0) return null
  const sy = currentSchoolYear()
  const eligible = students.filter(s => s.sped_status === 'eligible' && parseInt(s.grade, 10) >= 10)
  if (eligible.length === 0) return null
  const compliant = eligible.filter(s => {
    const t = s.meridian_secondary_transitions?.find(tr => tr.school_year === sy)
    return t && t.has_postsecondary_goals && t.has_transition_assessments &&
           t.has_transition_services && t.student_participated && t.agency_invited
  }).length
  return Math.round((compliant / eligible.length) * 100)
}

// ── Indicator Card ────────────────────────────────────────────────────────────
function IndicatorCard({ sppiNum, indicator, liveValue, onEdit }) {
  const cfg = SPPI_TARGETS[sppiNum]
  if (!cfg) return null

  const displayPct = cfg.auto ? liveValue : indicator?.district_pct
  const status     = indicator?.status ?? null

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">SPPI-{sppiNum}</p>
          <p className="text-sm font-semibold text-gray-800 leading-tight">{cfg.label}</p>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ${cfg.auto ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
          {cfg.auto ? 'Live' : 'Manual'}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          {displayPct !== null && displayPct !== undefined
            ? <p className="text-2xl font-mono font-bold text-gray-900">{displayPct}%</p>
            : <p className="text-2xl font-mono font-bold text-gray-300">—</p>
          }
          {cfg.target !== null && (
            <p className="text-xs text-gray-400">
              State target: {cfg.target}%
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill status={status} />
          {!cfg.auto && (
            <button
              onClick={() => onEdit(sppiNum)}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              {indicator ? 'Edit' : 'Enter Data'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Domain Section ────────────────────────────────────────────────────────────
function DomainSection({ title, sppiNumbers, indicators, autoSPPI11, autoSPPI13, onEdit }) {
  const indicatorMap = useMemo(() => {
    const m = {}
    for (const ind of (indicators ?? [])) m[ind.sppi_number] = ind
    return m
  }, [indicators])

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sppiNumbers.map(num => (
          <IndicatorCard
            key={num}
            sppiNum={num}
            indicator={indicatorMap[num]}
            liveValue={num === '11' ? autoSPPI11 : num === '13' ? autoSPPI13 : undefined}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MeridianRDAPage() {
  const { districtId, profile } = useAuth()
  const { data: determination, loading: loadingDL, refetch: refetchDL } = useRDADetermination()
  const { data: indicators, loading: loadingInd, refetch: refetchInd } = useRDAIndicators()
  const autoSPPI11 = useAutoSPPI11()
  const autoSPPI13 = useAutoSPPI13()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState(null) // sppi number string or null

  const sy = currentSchoolYear()
  const dl = determination?.determination_level ?? null
  const dlCfg = dl ? DL_CONFIG[dl] : null
  const needsSSP = dl && dl !== 'dl1'

  // Next check-in calculation
  const nextCheckin = useMemo(() => {
    if (!determination?.next_checkin_date) return null
    try {
      const d = parseISO(determination.next_checkin_date)
      const days = differenceInDays(d, new Date())
      return { date: format(d, 'MMM d, yyyy'), days }
    } catch { return null }
  }, [determination])

  const handleEditIndicator = (sppiNum) => {
    setEditingIndicator(sppiNum)
  }

  const indicatorMap = useMemo(() => {
    const m = {}
    for (const ind of (indicators ?? [])) m[ind.sppi_number] = ind
    return m
  }, [indicators])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Results Driven Accountability (RDA)</h1>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono font-medium border border-purple-200">
              TEA
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            SPPI compliance scores and determination level — School Year {sy}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          Update RDA Data
        </button>
      </div>

      {/* Determination Banner */}
      {loadingDL ? (
        <Skeleton className="h-20 w-full rounded-xl" />
      ) : !determination ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">No determination recorded for {sy}</p>
            <p className="text-xs text-gray-400 mt-0.5">Click "Update RDA Data" to enter this year's TEA determination level.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm text-purple-600 hover:underline font-medium"
          >
            Enter Determination →
          </button>
        </div>
      ) : (
        <div className={`${dlCfg.bg} border ${dlCfg.border} rounded-xl px-5 py-4`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-lg font-bold ${dlCfg.text}`}>{dlCfg.label}</span>
                {determination.determination_date && (
                  <span className="text-xs text-gray-500">
                    as of {format(parseISO(determination.determination_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              {determination.notes && (
                <p className="text-xs text-gray-600">{determination.notes}</p>
              )}
            </div>

            {/* SSP Status — only shown for DL2+ */}
            {needsSSP && (
              <div className="flex gap-4 text-sm flex-wrap">
                {determination.ssp_due_date && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">SSP Due</p>
                    <p className="font-semibold text-gray-800">{format(parseISO(determination.ssp_due_date), 'MMM d, yyyy')}</p>
                  </div>
                )}
                {determination.ssp_submitted_date ? (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">SSP Submitted</p>
                    <p className="font-semibold text-emerald-700">{format(parseISO(determination.ssp_submitted_date), 'MMM d, yyyy')}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">SSP Status</p>
                    <p className="font-semibold text-amber-700">Not Yet Submitted</p>
                  </div>
                )}
                {nextCheckin && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Next TEA Check-in</p>
                    <p className="font-semibold text-gray-800">{nextCheckin.date}</p>
                    <p className="text-xs text-gray-500">
                      {nextCheckin.days > 0 ? `in ${nextCheckin.days} days` : nextCheckin.days === 0 ? 'today' : `${Math.abs(nextCheckin.days)}d overdue`}
                    </p>
                  </div>
                )}
                {determination.checkin_cadence_days && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Cadence</p>
                    <p className="font-semibold text-gray-800">Every {determination.checkin_cadence_days} days</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SPPI Indicator Domains */}
      {loadingInd ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <DomainSection
            title="Domain I — Academic Achievement"
            sppiNumbers={['1', '2']}
            indicators={indicators}
            autoSPPI11={autoSPPI11}
            autoSPPI13={autoSPPI13}
            onEdit={handleEditIndicator}
          />
          <DomainSection
            title="Domain II — Program Quality"
            sppiNumbers={['5', '6', '7', '8', '11', '12', '13']}
            indicators={indicators}
            autoSPPI11={autoSPPI11}
            autoSPPI13={autoSPPI13}
            onEdit={handleEditIndicator}
          />
          <DomainSection
            title="Domain III — Disproportionality"
            sppiNumbers={['9', '10']}
            indicators={indicators}
            autoSPPI11={autoSPPI11}
            autoSPPI13={autoSPPI13}
            onEdit={handleEditIndicator}
          />
        </div>
      )}

      {/* RDA Data Modal */}
      {modalOpen && (
        <RDADataModal
          districtId={districtId}
          profileId={profile?.id}
          schoolYear={sy}
          existing={determination}
          autoSPPI11={autoSPPI11}
          autoSPPI13={autoSPPI13}
          onClose={() => setModalOpen(false)}
          onSaved={() => { refetchDL(); refetchInd(); setModalOpen(false) }}
        />
      )}

      {/* Single Indicator Edit Modal */}
      {editingIndicator && (
        <IndicatorEditModal
          districtId={districtId}
          schoolYear={sy}
          sppiNum={editingIndicator}
          existing={indicatorMap[editingIndicator]}
          onClose={() => setEditingIndicator(null)}
          onSaved={() => { refetchInd(); setEditingIndicator(null) }}
        />
      )}
    </div>
  )
}

// ── RDADataModal — 3-step ─────────────────────────────────────────────────────

const SCHOOL_YEARS = ['2024-25', '2025-26', '2026-27']

function RDADataModal({ districtId, profileId, schoolYear, existing, autoSPPI11, autoSPPI13, onClose, onSaved }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [dl, setDl]           = useState(existing?.determination_level ?? 'dl1')
  const [sy, setSy]           = useState(existing?.school_year ?? schoolYear)
  const [dlDate, setDlDate]   = useState(existing?.determination_date ?? '')
  const [sspDue, setSspDue]   = useState(existing?.ssp_due_date ?? '')
  const [sspSub, setSspSub]   = useState(existing?.ssp_submitted_date ?? '')
  const [nextCI, setNextCI]   = useState(existing?.next_checkin_date ?? '')
  const [notes, setNotes]     = useState(existing?.notes ?? '')

  const needsSSP = dl !== 'dl1'

  const cadenceMap = { dl2: 90, dl3: 60, dl4: 30 }
  const cadenceDays = cadenceMap[dl] ?? null

  // Auto-compute next check-in from SSP due date + cadence if not manually set
  const computedNextCI = useMemo(() => {
    if (!sspDue || !cadenceDays) return ''
    try {
      return format(addDays(parseISO(sspDue), cadenceDays), 'yyyy-MM-dd')
    } catch { return '' }
  }, [sspDue, cadenceDays])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      district_id:         districtId,
      school_year:         sy,
      determination_level: dl,
      determination_date:  dlDate || null,
      ssp_due_date:        needsSSP ? (sspDue || null) : null,
      ssp_submitted_date:  needsSSP ? (sspSub || null) : null,
      next_checkin_date:   needsSSP ? (nextCI || computedNextCI || null) : null,
      notes:               notes || null,
      updated_by:          profileId || null,
      updated_at:          new Date().toISOString(),
    }
    const { error } = await upsertRDADetermination(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('RDA determination saved')
    onSaved()
  }

  const dlOptions = [
    { value: 'dl1', label: 'DL1 — Meets Requirements',             desc: 'No SSP required'           },
    { value: 'dl2', label: 'DL2 — Needs Assistance',               desc: 'SSP required, 90-day cycle' },
    { value: 'dl3', label: 'DL3 — Needs Intervention',             desc: 'SSP required, 60-day cycle' },
    { value: 'dl4', label: 'DL4 — Needs Substantial Intervention', desc: 'SSP required, 30-day cycle' },
  ]

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'

  const steps = needsSSP ? 3 : 1

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Update RDA Determination"
      description={`School Year ${sy} — Results Driven Accountability`}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)} disabled={saving}>
                ← Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            {step < steps
              ? <Button variant="primary" onClick={() => setStep(s => s + 1)}>Next →</Button>
              : <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
            }
          </div>
        </div>
      }
    >
      {/* Step Indicator */}
      {steps > 1 && (
        <div className="flex items-center gap-2 mb-5">
          {Array.from({ length: steps }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                i + 1 === step ? 'bg-purple-600 text-white' : i + 1 < step ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1 < step ? '✓' : i + 1}
              </div>
              {i < steps - 1 && <div className="h-px w-8 bg-gray-200" />}
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-2">
            Step {step}: {step === 1 ? 'Determination' : step === 2 ? 'SSP Dates' : 'SPPI Scores'}
          </span>
        </div>
      )}

      {/* Step 1 — Determination */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">School Year</label>
              <select value={sy} onChange={e => setSy(e.target.value)} className={inputCls}>
                {SCHOOL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Determination Date</label>
              <input type="date" value={dlDate} onChange={e => setDlDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Determination Level</label>
            <div className="space-y-2">
              {dlOptions.map(opt => (
                <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  dl === opt.value ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="dl"
                    value={opt.value}
                    checked={dl === opt.value}
                    onChange={() => setDl(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional context..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>
      )}

      {/* Step 2 — SSP Dates (DL2+ only) */}
      {step === 2 && needsSSP && (
        <div className="space-y-4">
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <strong>{DL_CONFIG[dl]?.label}</strong> requires a Systemic Improvement Plan (SSP) with
            TEA check-ins every <strong>{cadenceDays} days</strong>.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SSP Due Date</label>
              <input type="date" value={sspDue} onChange={e => setSspDue(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SSP Submitted Date</label>
              <input type="date" value={sspSub} onChange={e => setSspSub(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Next Check-in Date</label>
            <input
              type="date"
              value={nextCI || computedNextCI}
              onChange={e => setNextCI(e.target.value)}
              className={inputCls}
            />
            {computedNextCI && !nextCI && (
              <p className="text-xs text-gray-400 mt-1">
                Auto-computed: {format(parseISO(computedNextCI), 'MMM d, yyyy')} ({cadenceDays} days from SSP due)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — SPPI Scores (manual indicators only) */}
      {step === 3 && needsSSP && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Enter district percentages for manually-tracked indicators. SPPI-11 and SPPI-13 are auto-calculated from Meridian data (shown as read-only).
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            You can also update individual indicators directly from the RDA Dashboard using the "Edit" links on each card.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(SPPI_TARGETS).map(([num, cfg]) => (
              <div key={num} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  SPPI-{num}: {cfg.label}
                </label>
                {cfg.auto ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      readOnly
                      value={num === '11' ? (autoSPPI11 ?? '') : (autoSPPI13 ?? '')}
                      placeholder="Auto-calculated"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 whitespace-nowrap">Live</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder={cfg.target !== null ? `Target: ${cfg.target}%` : 'Enter %'}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Single Indicator Edit Modal ───────────────────────────────────────────────

function IndicatorEditModal({ districtId, schoolYear, sppiNum, existing, onClose, onSaved }) {
  const cfg = SPPI_TARGETS[sppiNum]
  const [distPct, setDistPct]   = useState(existing?.district_pct ?? '')
  const [stateTgt, setStateTgt] = useState(existing?.state_target ?? cfg?.target ?? '')
  const [status, setStatus]     = useState(existing?.status ?? '')
  const [notes, setNotes]       = useState(existing?.notes ?? '')
  const [saving, setSaving]     = useState(false)

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500'

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      district_id:  districtId,
      school_year:  schoolYear,
      sppi_number:  sppiNum,
      district_pct: distPct !== '' ? parseFloat(distPct) : null,
      state_target: stateTgt !== '' ? parseFloat(stateTgt) : null,
      status:       status || null,
      data_source:  'manual',
      notes:        notes || null,
      updated_at:   new Date().toISOString(),
    }
    const { error } = await upsertRDAIndicator(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(`SPPI-${sppiNum} updated`)
    onSaved()
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`SPPI-${sppiNum}: ${cfg?.label}`}
      description={`Domain ${cfg?.domain} — ${schoolYear}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">District %</label>
            <input
              type="number" min="0" max="100" step="0.01"
              value={distPct}
              onChange={e => setDistPct(e.target.value)}
              placeholder="e.g. 78.5"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">State Target %</label>
            <input
              type="number" min="0" max="100" step="0.01"
              value={stateTgt}
              onChange={e => setStateTgt(e.target.value)}
              placeholder={cfg?.target ?? '—'}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
            <option value="">— Select —</option>
            <option value="meets">Meets</option>
            <option value="approaching">Approaching</option>
            <option value="not_meets">Not Meets</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>
      </div>
    </Modal>
  )
}

