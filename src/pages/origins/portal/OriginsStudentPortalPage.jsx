import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OriginsPortalLayout from './OriginsPortalLayout'
import { SCENARIOS, getConversationStarters } from '../../../lib/originsScenarios'

const PATHWAYS = [
  { key: 'emotional_regulation',  label: 'Emotional Regulation',        color: 'bg-teal-100 text-teal-700',    ring: 'ring-teal-200'    },
  { key: 'conflict_deescalation', label: 'Conflict De-escalation',      color: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200' },
  { key: 'peer_pressure',         label: 'Peer Pressure Resistance',    color: 'bg-cyan-100 text-cyan-700',    ring: 'ring-cyan-200'    },
  { key: 'rebuilding',            label: 'Rebuilding After a Mistake',  color: 'bg-sky-100 text-sky-700',      ring: 'ring-sky-200'     },
  { key: 'adult_communication',   label: 'Communication with Adults',   color: 'bg-indigo-100 text-indigo-700', ring: 'ring-indigo-200' },
]

// Demo assigned activities — will be replaced by real DB data
const DEMO_ACTIVITIES = [
  {
    id: '1',
    type: 'scenario',
    scenario_id: 'global-001',
    title: 'When Someone Gets in Your Face',
    pathway: 'emotional_regulation',
    description: 'A scenario about staying calm when someone is pushing your buttons.',
  },
  {
    id: '2',
    type: 'replay',
    title: 'Reflect on What Happened',
    pathway: 'rebuilding',
    description: 'Walk through a recent situation and think about what you could do differently.',
  },
  {
    id: '3',
    type: 'scenario',
    scenario_id: 'global-004',
    title: 'The Group Chat',
    pathway: 'peer_pressure',
    description: 'Your friend group is saying mean things about someone online. What do you do?',
  },
]

const TYPE_ICONS = {
  scenario: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z" />
    </svg>
  ),
  replay: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
}

export default function OriginsStudentPortalPage() {
  const navigate = useNavigate()
  const [completedSessions, setCompletedSessions] = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('origins_sessions') || '[]')
      setCompletedSessions(stored)
    } catch {}
  }, [])

  const completedIds = new Set(completedSessions.map(s => s.scenario_id))
  const pending = DEMO_ACTIVITIES.filter(a => !a.scenario_id || !completedIds.has(a.scenario_id))

  function startActivity(activity) {
    if (activity.type === 'scenario' && activity.scenario_id) {
      navigate(`/family/student/scenario/${activity.scenario_id}`)
    }
  }

  return (
    <OriginsPortalLayout>
      {/* Greeting */}
      <div className="mb-8">
        <button onClick={() => navigate('/family')} className="text-xs text-teal-600 hover:underline mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Hey there! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's waiting for you today.</p>
      </div>

      {/* Skill badges */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Skill Pathways</h2>
        <div className="flex flex-wrap gap-2">
          {PATHWAYS.map(p => (
            <span key={p.key} className={`px-3 py-1 rounded-full text-xs font-medium ${p.color}`}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      {/* To-do activities */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Up next <span className="ml-1.5 bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          </h2>
          <div className="space-y-3">
            {pending.map(a => (
              <ActivityCard key={a.id} activity={a} onStart={() => startActivity(a)} />
            ))}
          </div>
        </div>
      )}

      {/* Completed sessions from localStorage */}
      {completedSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Completed ✓</h2>
          <div className="space-y-3">
            {completedSessions.map(s => (
              <CompletedSessionCard key={s.id} session={s} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {pending.length === 0 && completedSessions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">You're all caught up!</p>
          <p className="text-sm text-gray-400 mt-1">Your counselor will assign activities soon.</p>
        </div>
      )}
    </OriginsPortalLayout>
  )
}

function ActivityCard({ activity, onStart }) {
  const pathway = PATHWAYS.find(p => p.key === activity.pathway)

  return (
    <div className="bg-white rounded-2xl border border-teal-100 hover:border-teal-300 hover:shadow-md shadow-sm overflow-hidden transition-all cursor-pointer"
      onClick={onStart}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-teal-100 text-teal-600">
            {TYPE_ICONS[activity.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {activity.type === 'scenario' ? 'Response Moment' : 'Reflection'}
              </span>
              {pathway && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pathway.color}`}>
                  {pathway.label}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900">{activity.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{activity.description}</p>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onStart() }}
          className="mt-4 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Start →
        </button>
      </div>
    </div>
  )
}

const PATHWAY_LABELS = {
  emotional_regulation:  'Emotional Regulation',
  conflict_deescalation: 'Conflict De-escalation',
  peer_pressure:         'Peer Pressure Resistance',
  rebuilding:            'Rebuilding After a Mistake',
  adult_communication:   'Communication with Adults',
}

function CompletedSessionCard({ session }) {
  const scenario = SCENARIOS.find(s => s.id === session.scenario_id)
  const scoreLabel = session.choice_score >= 85 ? '✓ Strong choice' : session.choice_score >= 50 ? '↗ Getting there' : '↻ Room to grow'
  const scoreColor = session.choice_score >= 85 ? 'text-teal-600' : session.choice_score >= 50 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-80">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Response Moment</span>
            {session.skill_pathway && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                {PATHWAY_LABELS[session.skill_pathway]}
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-700">{session.scenario_title}</h3>
          <p className={`text-xs font-semibold mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>
      {session.commitment && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
          <p className="text-xs text-teal-700">
            <span className="font-semibold">Your commitment: </span>"{session.commitment}"
          </p>
        </div>
      )}
    </div>
  )
}
