import { useState } from 'react'
import { Card, SectionHeader } from './MeridianUI'

const SOURCES = [
  { id: 'src1', name: 'Frontline eSped', type: 'CSV Upload', status: 'active', lastSync: '6 hours ago', recordsProcessed: 361, errors: 0, icon: '📄', description: 'Manual CSV export from Frontline report writer → upload to Meridian' },
  { id: 'src2', name: 'Frontline eSped (sFTP)', type: 'Nightly sFTP', status: 'pending_setup', lastSync: null, recordsProcessed: null, errors: null, icon: '🔄', description: 'Automated nightly sync via Frontline sFTP — requires Frontline agreement' },
  { id: 'src3', name: 'Waypoint', type: 'Live API', status: 'active', lastSync: '2 hours ago', recordsProcessed: 3, errors: 0, icon: '🔗', description: 'Real-time DAEP student record sharing — flags IEP/504 students in active DAEP placements' },
]

const COLUMN_MAP = [
  { frontline: 'StudentID',        meridian: 'state_id',           required: true  },
  { frontline: 'LocalID',          meridian: 'local_id',           required: true  },
  { frontline: 'FrontlineID',      meridian: 'frontline_id',       required: true  },
  { frontline: 'FirstName',        meridian: 'first_name',         required: true  },
  { frontline: 'LastName',         meridian: 'last_name',          required: true  },
  { frontline: 'DOB',              meridian: 'date_of_birth',      required: true  },
  { frontline: 'Grade',            meridian: 'grade',              required: true  },
  { frontline: 'Campus',           meridian: 'campus_id (matched)',required: true  },
  { frontline: 'DisabilityCode',   meridian: 'primary_disability', required: false },
  { frontline: 'PlanType',         meridian: 'plan_type',          required: true  },
  { frontline: 'IEPStartDate',     meridian: 'iep_start_date',     required: false },
  { frontline: 'AnnualReviewDate', meridian: 'annual_review_due',  required: false },
  { frontline: 'ReferralDate',     meridian: 'referral_date',      required: false },
  { frontline: 'EvalDueDate',      meridian: 'eval_due_date',      required: false },
  { frontline: 'DyslexiaFlag',     meridian: 'dyslexia_identified',required: false },
  { frontline: 'Plan504StartDate', meridian: 'plan_start_date',    required: false },
  { frontline: 'CaseManagerEmail', meridian: 'case_manager_id',    required: false },
]

const IMPORT_LOG = [
  { time: 'Today 6:00 AM',  file: 'frontline_export_20260219.csv', records: 361, created: 0,   updated: 14, errors: 0, status: 'complete' },
  { time: 'Feb 18 6:00 AM', file: 'frontline_export_20260218.csv', records: 361, created: 2,   updated: 8,  errors: 0, status: 'complete' },
  { time: 'Feb 17 6:00 AM', file: 'frontline_export_20260217.csv', records: 359, created: 5,   updated: 11, errors: 1, status: 'partial'  },
  { time: 'Feb 14 2:12 PM', file: 'frontline_manual_upload.csv',   records: 354, created: 354, updated: 0,  errors: 3, status: 'complete' },
]

export default function MeridianIntegrationPage() {
  const [dragOver, setDragOver]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showMap, setShowMap]     = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) simulateUpload(file.name)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) simulateUpload(file.name)
  }

  const simulateUpload = (filename) => {
    setUploading(true)
    setTimeout(() => {
      setUploading(false)
      alert(`Import complete — ${filename} processed successfully`)
    }, 2200)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data Integration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Connect Frontline eSped and Waypoint data sources</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
          + Add Source
        </button>
      </div>

      {/* Architecture explainer */}
      <div className="px-6 py-5 bg-purple-50 border border-purple-200 rounded-xl">
        <h2 className="text-sm font-bold text-gray-900 mb-2">How Meridian connects to Frontline eSped</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Frontline eSped does not expose a public API. Meridian uses a three-tier integration strategy so districts can
          start syncing immediately regardless of IT capacity, then automate over time.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { tier: '1', label: 'CSV Upload',      desc: "Export any report from Frontline's report writer → upload here. Available day one, no IT required.", time: 'Available now',  color: 'text-emerald-600 border-emerald-300', icon: '📄' },
            { tier: '2', label: 'sFTP Nightly Sync', desc: "Frontline's integration server pushes a nightly file via sFTP. Requires Frontline agreement + district IT.", time: '2–4 weeks setup', color: 'text-amber-600 border-amber-300', icon: '🔄' },
            { tier: '3', label: 'Future API',      desc: 'If Frontline opens a SPED REST API, Meridian will plug in automatically. Architecture is ready.',        time: 'Future roadmap', color: 'text-gray-400 border-gray-200', icon: '⚡' },
          ].map(t => (
            <div key={t.tier} className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border ${t.color}`}>
                {t.tier}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 mb-1">{t.icon} {t.label}</p>
                <p className="text-xs text-gray-500 leading-snug mb-2">{t.desc}</p>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${t.color} bg-white`}>{t.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected sources */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Connected Sources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SOURCES.map(src => (
            <Card key={src.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{src.icon}</span>
                  <span className="text-sm font-semibold text-gray-900">{src.name}</span>
                </div>
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${src.status === 'active' ? 'bg-emerald-100 text-emerald-700' : src.status === 'pending_setup' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {src.status === 'active' ? '● ACTIVE' : src.status === 'pending_setup' ? '◐ SETUP' : '○ INACTIVE'}
                </span>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-mono mb-2">{src.type}</p>
              <p className="text-xs text-gray-600 leading-snug mb-3">{src.description}</p>
              {src.lastSync && (
                <div className="flex justify-between text-xs text-gray-400 font-mono">
                  <span>Last sync: {src.lastSync}</span>
                  {src.recordsProcessed != null && <span>{src.recordsProcessed} records</span>}
                </div>
              )}
              {src.status === 'pending_setup' && (
                <button className="mt-3 w-full py-2 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors">
                  Begin Setup
                </button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* CSV Upload */}
      <Card>
        <SectionHeader
          title="Upload Frontline CSV Export"
          action={showMap ? 'Hide column map' : 'View column map'}
          onAction={() => setShowMap(!showMap)}
        />
        <div className="p-3 md:p-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('meridian-csv-input').click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
          >
            <input id="meridian-csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            {uploading ? (
              <div>
                <p className="text-sm font-bold text-purple-600 mb-2">Processing import...</p>
                <div className="w-48 h-1.5 rounded-full bg-gray-200 mx-auto overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500 animate-pulse w-3/5" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-3xl mb-3">📄</p>
                <p className="text-sm font-bold text-gray-900 mb-1">Drop Frontline CSV export here</p>
                <p className="text-xs text-gray-500 mb-4">
                  Export from Frontline: Reports → Student List → Export CSV
                </p>
                <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-purple-600 text-white">
                  Browse Files
                </span>
              </>
            )}
          </div>

          {showMap && (
            <div className="mt-5">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono mb-3">
                Frontline Column → Meridian Field Mapping
              </p>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Frontline CSV Column</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Meridian Field</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COLUMN_MAP.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}>
                        <td className="px-4 py-2 font-mono text-gray-600">{row.frontline}</td>
                        <td className="px-4 py-2 font-mono text-purple-600">{row.meridian}</td>
                        <td className="px-4 py-2">
                          {row.required
                            ? <span className="text-xs font-mono text-emerald-600">Required</span>
                            : <span className="text-xs font-mono text-gray-400">Optional</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Import history */}
      <Card>
        <SectionHeader title="Import History" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Time', 'File', 'Total', 'Created', 'Updated', 'Errors', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMPORT_LOG.map((log, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-xs font-mono text-gray-400">{log.time}</td>
                <td className="px-5 py-3 text-xs font-mono text-gray-600">{log.file}</td>
                <td className="px-5 py-3 text-xs font-mono font-semibold text-gray-900">{log.records}</td>
                <td className={`px-5 py-3 text-xs font-mono font-semibold ${log.created > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{log.created}</td>
                <td className={`px-5 py-3 text-xs font-mono font-semibold ${log.updated > 0 ? 'text-purple-600' : 'text-gray-400'}`}>{log.updated}</td>
                <td className={`px-5 py-3 text-xs font-mono font-semibold ${log.errors > 0 ? 'text-red-600' : 'text-gray-400'}`}>{log.errors}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${log.status === 'complete' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {log.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
