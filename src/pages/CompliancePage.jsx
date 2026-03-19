import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import Card from '../components/ui/Card'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/ui/Badge'
import { StudentFlagsSummary } from '../components/students/StudentFlags'
import { useComplianceChecklists } from '../hooks/useCompliance'
import { useAuth } from '../contexts/AuthContext'
import { useAccessScope } from '../hooks/useAccessScope'
import { formatStudentName, formatDate } from '../lib/utils'
import { CONSEQUENCE_TYPE_LABELS } from '../lib/constants'
// exportUtils loaded dynamically on first export click

export default function CompliancePage() {
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState('')
  const { profile } = useAuth()
  const { scope } = useAccessScope()

  // Fetch ALL checklists (no status filter) so stat cards are always accurate
  const filters = useMemo(() => {
    const f = {}
    if (!scope.isDistrictWide && scope.scopedCampusIds?.length) {
      f._campusScope = scope.scopedCampusIds
    }
    return f
  }, [scope])

  const { checklists: allChecklists, loading } = useComplianceChecklists(filters)

  // Stats — mutually exclusive categories
  // Priority: Blocked > Overridden > Completed > In Progress
  const isBlocked = c => c.placement_blocked && !c.block_overridden
  const isOverridden = c => c.block_overridden
  const isCompleted = c => !isBlocked(c) && !isOverridden(c) && c.status === 'completed'
  const isInProgress = c => !isBlocked(c) && !isOverridden(c) && c.status !== 'completed'

  const blocked = allChecklists.filter(isBlocked).length
  const inProgress = allChecklists.filter(isInProgress).length
  const completed = allChecklists.filter(isCompleted).length
  const overridden = allChecklists.filter(isOverridden).length

  // Client-side filter based on which stat card is active
  const checklists = useMemo(() => {
    if (!activeCard) return allChecklists
    if (activeCard === 'blocked') return allChecklists.filter(isBlocked)
    if (activeCard === 'in_progress') return allChecklists.filter(isInProgress)
    if (activeCard === 'completed') return allChecklists.filter(isCompleted)
    if (activeCard === 'overridden') return allChecklists.filter(isOverridden)
    return allChecklists
  }, [allChecklists, activeCard])

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (_, row) => (
        <div>
          <p className="text-sm font-medium text-gray-900">
            {row.student ? formatStudentName(row.student) : '—'}
          </p>
          <div className="mt-0.5">
            {row.student && <StudentFlagsSummary student={row.student} />}
          </div>
        </div>
      ),
      sortable: false,
    },
    {
      key: 'incident',
      header: 'Incident',
      render: (_, row) => (
        <div className="text-sm">
          <p>{row.incident?.offense?.title || '—'}</p>
          <p className="text-xs text-gray-500">{formatDate(row.incident?.incident_date)}</p>
        </div>
      ),
      sortable: false,
    },
    {
      key: 'consequence',
      header: 'Consequence',
      render: (_, row) => (
        <span className="text-sm">
          {CONSEQUENCE_TYPE_LABELS[row.incident?.consequence_type] || '—'}
        </span>
      ),
      sortable: false,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (_, row) => {
        const items = [
          row.ard_committee_notified,
          row.manifestation_determination,
          row.parent_notified,
          row.fape_plan_documented,
        ]
        const completed = items.filter(Boolean).length
        const total = items.length
        const pct = Math.round((completed / total) * 100)

        return (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{completed}/{total}</span>
          </div>
        )
      },
      sortable: false,
    },
    {
      key: 'status',
      header: 'Status',
      render: (val, row) => {
        if (row.block_overridden) {
          return <Badge color="yellow" size="sm" dot>Overridden</Badge>
        }
        const colors = {
          incomplete: 'red',
          in_progress: 'yellow',
          completed: 'green',
          waived: 'gray',
        }
        const labels = {
          incomplete: 'Blocked',
          in_progress: 'In Progress',
          completed: 'Cleared',
          waived: 'Waived',
        }
        return (
          <Badge color={colors[val] || 'gray'} size="sm" dot>
            {labels[val] || val}
          </Badge>
        )
      },
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (val) => <span className="text-xs text-gray-500">{formatDate(val)}</span>,
    },
  ]

  const exportHeaders = ['Student', 'Incident Date', 'Consequence', 'Compliance Status', 'Items Complete']

  const statusLabels = {
    incomplete: 'Blocked',
    in_progress: 'In Progress',
    completed: 'Cleared',
    waived: 'Waived',
  }

  const buildExportRows = useCallback(() => {
    return checklists.map(c => {
      const items = [
        c.ard_committee_notified,
        c.manifestation_determination,
        c.parent_notified,
        c.fape_plan_documented,
      ]
      const done = items.filter(Boolean).length
      const displayStatus = c.block_overridden ? 'Overridden' : (statusLabels[c.status] || c.status)
      return [
        c.student ? formatStudentName(c.student) : '—',
        formatDate(c.incident?.incident_date),
        CONSEQUENCE_TYPE_LABELS[c.incident?.consequence_type] || '—',
        displayStatus,
        `${done}/4`,
      ]
    })
  }, [checklists])

  const handleExportPdf = useCallback(async () => {
    const { exportToPdf } = await import('../lib/exportUtils')
    exportToPdf('SPED Compliance', exportHeaders, buildExportRows(), {
      generatedBy: profile?.full_name,
    })
  }, [buildExportRows, profile])

  const handleExportExcel = useCallback(async () => {
    const { exportToExcel } = await import('../lib/exportUtils')
    exportToExcel('SPED Compliance', exportHeaders, buildExportRows(), {
      generatedBy: profile?.full_name,
    })
  }, [buildExportRows, profile])

  return (
    <div>
      <Topbar
        title="SPED Compliance"
        subtitle="Manage compliance checklists for SPED/504 students recommended for DAEP"
        actions={
          <div className="flex items-center gap-1.5">
            <button onClick={handleExportPdf} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50" title="Export PDF">
              PDF
            </button>
            <button onClick={handleExportExcel} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50" title="Export Excel">
              Excel
            </button>
          </div>
        }
      />

      <div className="p-3 md:p-6">
        {/* Stats — click to filter table */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Blocked Placements" value={blocked} color="red" active={activeCard === 'blocked'} onClick={() => setActiveCard(activeCard === 'blocked' ? '' : 'blocked')} />
          <StatCard label="In Progress" value={inProgress} color="yellow" active={activeCard === 'in_progress'} onClick={() => setActiveCard(activeCard === 'in_progress' ? '' : 'in_progress')} />
          <StatCard label="Completed" value={completed} color="green" active={activeCard === 'completed'} onClick={() => setActiveCard(activeCard === 'completed' ? '' : 'completed')} />
          <StatCard label="Overridden" value={overridden} color="orange" active={activeCard === 'overridden'} onClick={() => setActiveCard(activeCard === 'overridden' ? '' : 'overridden')} />
        </div>
        {activeCard && (
          <div className="mb-4 flex justify-end">
            <button onClick={() => setActiveCard('')} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Clear Filter
            </button>
          </div>
        )}

        {/* Table */}
        <Card padding={false}>
          <DataTable
            columns={columns}
            data={checklists}
            loading={loading}
            onRowClick={(checklist) => navigate(`/incidents/${checklist.incident_id}`)}
            emptyMessage="No compliance checklists found. Checklists are automatically created when SPED/504 students are recommended for DAEP."
          />
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, color, active, onClick }) {
  const bgColors = {
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
  }
  const activeRings = {
    red: 'ring-2 ring-red-400 ring-offset-2',
    yellow: 'ring-2 ring-yellow-400 ring-offset-2',
    green: 'ring-2 ring-green-400 ring-offset-2',
    orange: 'ring-2 ring-orange-400 ring-offset-2',
  }
  const textColors = {
    red: 'text-red-700',
    yellow: 'text-yellow-700',
    green: 'text-green-700',
    orange: 'text-orange-700',
  }

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border text-left transition-all ${bgColors[color]} ${active ? activeRings[color] : ''} hover:shadow-md cursor-pointer`}
    >
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${textColors[color]}`}>{value}</p>
    </button>
  )
}
