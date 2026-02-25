import { useState } from 'react'
import { SkillBadge, Card, EmptyState, PATHWAYS } from './OriginsUI'
import { SCENARIOS, TEC_OFFENSES } from '../../lib/originsScenarios'

const GRADE_LABELS = { middle: 'Middle', high: 'High', both: 'Middle & High' }

const FILTER_MODES = [
  { key: 'offense',  label: 'By Offense' },
  { key: 'pathway',  label: 'By Pathway' },
]

export default function OriginsResponseMomentsPage() {
  const [filterMode, setFilterMode]       = useState('offense')
  const [activeOffense, setActiveOffense] = useState(null)
  const [activePathway, setActivePathway] = useState(null)
  const [selected, setSelected]           = useState(null)

  const filtered = SCENARIOS.filter(s => {
    if (filterMode === 'offense' && activeOffense) return s.tec_offense === activeOffense
    if (filterMode === 'pathway' && activePathway) return s.skill_pathway === activePathway
    return true
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Response Moments</h1>
          <p className="text-sm text-gray-500 mt-1">
            {SCENARIOS.length} scenarios · 8 TEC offense categories · 5 skill pathways
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-medium text-teal-600">{SCENARIOS.length}</p>
          <p className="text-xs text-gray-400">scenarios available</p>
        </div>
      </div>

      {/* Filter mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {FILTER_MODES.map(m => (
          <button
            key={m.key}
            onClick={() => { setFilterMode(m.key); setActiveOffense(null); setActivePathway(null) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filterMode === m.key
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Offense filters */}
      {filterMode === 'offense' && (
        <div className="flex flex-wrap gap-2">
          <OffenseChip label="All Offenses" active={!activeOffense} onClick={() => setActiveOffense(null)} count={SCENARIOS.length} />
          {TEC_OFFENSES.map(o => (
            <OffenseChip
              key={o.key}
              label={o.label}
              tecRef={o.ref}
              active={activeOffense === o.key}
              onClick={() => setActiveOffense(o.key)}
              count={SCENARIOS.filter(s => s.tec_offense === o.key).length}
            />
          ))}
        </div>
      )}

      {/* Pathway filters */}
      {filterMode === 'pathway' && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePathway(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !activePathway ? 'bg-teal-600 text-white border-teal-600' : 'text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            All Pathways
          </button>
          {PATHWAYS.map(p => (
            <button
              key={p.key}
              onClick={() => setActivePathway(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activePathway === p.key ? 'bg-teal-600 text-white border-teal-600' : 'text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Showing {filtered.length} scenario{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Scenario grid */}
      {!filtered.length ? (
        <EmptyState title="No scenarios found" description="Try a different filter." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onSelect={() => setSelected(scenario)}
            />
          ))}
        </div>
      )}

      {/* Preview panel */}
      {selected && (
        <ScenarioPreviewPanel scenario={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function OffenseChip({ label, tecRef, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
        active
          ? 'bg-teal-600 text-white border-teal-600'
          : 'text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-700'
      }`}
    >
      <span>{label}</span>
      {tecRef && <span className={`font-mono ${active ? 'text-teal-200' : 'text-gray-400'}`}>{tecRef}</span>}
      <span className={`ml-0.5 ${active ? 'text-teal-200' : 'text-gray-400'}`}>({count})</span>
    </button>
  )
}

function ScenarioCard({ scenario, onSelect }) {
  const offense = TEC_OFFENSES.find(o => o.key === scenario.tec_offense)

  return (
    <Card
      className="p-5 hover:shadow-sm transition-shadow cursor-pointer hover:border-teal-200"
      onClick={onSelect}
    >
      {offense && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
            {offense.ref} · {offense.label}
          </span>
          <span className="text-[10px] text-gray-400">{GRADE_LABELS[scenario.grade_band]}</span>
        </div>
      )}

      <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-2">{scenario.title}</h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{scenario.description}</p>

      <div className="flex items-center justify-between">
        <SkillBadge pathway={scenario.skill_pathway} />
        <span className="text-xs text-gray-400">{scenario.content?.options?.length} choices</span>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">Global scenario</span>
        <button
          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
          onClick={e => { e.stopPropagation(); onSelect() }}
        >
          Preview + Assign →
        </button>
      </div>
    </Card>
  )
}

function ScenarioPreviewPanel({ scenario, onClose }) {
  const offense = TEC_OFFENSES.find(o => o.key === scenario.tec_offense)

  return (
    <div className="fixed inset-0 z-40 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <div
        className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {offense && (
                <span className="text-[10px] font-mono text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                  {offense.ref}
                </span>
              )}
              <SkillBadge pathway={scenario.skill_pathway} />
              <span className="text-[10px] text-gray-400">{GRADE_LABELS[scenario.grade_band]}</span>
            </div>
            <h2 className="text-base font-semibold text-gray-900">{scenario.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex-1 space-y-5">
          {/* Prompt */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scenario Prompt</p>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-sm text-teal-900 leading-relaxed">{scenario.content?.prompt}</p>
            </div>
          </div>

          {/* Coaching supports */}
          {scenario.content?.supports?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Coaching Supports</p>
              <ul className="space-y-1.5">
                {scenario.content.supports.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-teal-500 mt-0.5 shrink-0">›</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Choices */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Response Choices</p>
            <div className="space-y-3">
              {scenario.content?.options?.map((opt, i) => (
                <div key={i} className={`rounded-xl border p-4 ${
                  opt.score >= 85 ? 'border-teal-200 bg-teal-50' :
                  opt.score >= 50 ? 'border-amber-100 bg-amber-50' :
                  'border-red-100 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-medium text-gray-900">"{opt.text}"</p>
                    <span className={`text-xs font-mono font-bold shrink-0 ${
                      opt.score >= 85 ? 'text-teal-600' :
                      opt.score >= 50 ? 'text-amber-600' :
                      'text-red-500'
                    }`}>{opt.score}pts</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{opt.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assign footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors">
            Assign to Student →
          </button>
        </div>
      </div>
    </div>
  )
}
