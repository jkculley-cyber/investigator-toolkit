import { useState } from 'react'
import { useOriginsScenarios } from '../../hooks/useOrigins'
import { SkillBadge, Card, SectionHeader, EmptyState, PATHWAYS } from './OriginsUI'

export default function OriginsResponseMomentsPage() {
  const [activePathway, setActivePathway] = useState(null)
  const { data: scenarios, loading } = useOriginsScenarios(activePathway)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Response Moments</h1>
        <p className="text-sm text-gray-500 mt-1">Scenario library — browse and assign by skill pathway</p>
      </div>

      {/* Pathway filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActivePathway(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            activePathway === null
              ? 'bg-teal-600 text-white border-teal-600'
              : 'text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          All Pathways
        </button>
        {PATHWAYS.map(p => (
          <button
            key={p.key}
            onClick={() => setActivePathway(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activePathway === p.key
                ? 'bg-teal-600 text-white border-teal-600'
                : 'text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Scenario grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : !scenarios?.length ? (
        <EmptyState
          title="No scenarios found"
          description={activePathway ? 'No scenarios exist for this pathway yet.' : 'No scenarios in the library yet. Add global scenarios via Origins Settings.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map(scenario => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      )}
    </div>
  )
}

function ScenarioCard({ scenario }) {
  const gradeBandLabel = { middle: 'Middle School', high: 'High School', both: 'Middle & High' }

  return (
    <Card className="p-5 hover:shadow-sm transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">{scenario.title}</h3>
        {scenario.grade_band && (
          <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap shrink-0">
            {gradeBandLabel[scenario.grade_band]}
          </span>
        )}
      </div>
      <div className="mb-3">
        <SkillBadge pathway={scenario.skill_pathway} />
      </div>
      {scenario.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{scenario.description}</p>
      )}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {scenario.district_id ? 'District scenario' : 'Global scenario'}
        </span>
        <button className="text-xs text-teal-600 hover:text-teal-700 font-medium">
          Assign →
        </button>
      </div>
    </Card>
  )
}
