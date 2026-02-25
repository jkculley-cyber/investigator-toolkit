import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import OriginsPortalLayout from './OriginsPortalLayout'
import { SCENARIOS, TEC_OFFENSES, REFLECTION_PROMPTS, getConversationStarters } from '../../../lib/originsScenarios'

const PATHWAY_LABELS = {
  emotional_regulation:  'Emotional Regulation',
  conflict_deescalation: 'Conflict De-escalation',
  peer_pressure:         'Peer Pressure Resistance',
  rebuilding:            'Rebuilding After a Mistake',
  adult_communication:   'Communication with Adults',
}

// Steps: intro → situation → choose → outcome → reflect → commit → complete
const STEPS = ['intro', 'situation', 'choose', 'outcome', 'reflect', 'commit', 'complete']

function saveSession(session) {
  try {
    const all = JSON.parse(localStorage.getItem('origins_sessions') || '[]')
    const idx = all.findIndex(s => s.id === session.id)
    if (idx >= 0) all[idx] = session
    else all.unshift(session)
    localStorage.setItem('origins_sessions', JSON.stringify(all.slice(0, 50)))
  } catch {}
}

export default function OriginsScenarioPlayer() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const scenario   = SCENARIOS.find(s => s.id === id)

  const [step, setStep]               = useState('intro')
  const [choiceIndex, setChoiceIndex] = useState(null)
  const [reflections, setReflections] = useState(['', '', ''])
  const [commitment, setCommitment]   = useState('')
  const [animating, setAnimating]     = useState(false)

  const offense   = TEC_OFFENSES.find(o => o.key === scenario?.tec_offense)
  const options   = scenario?.content?.options || []
  const chosen    = choiceIndex !== null ? options[choiceIndex] : null
  const prompts   = REFLECTION_PROMPTS[scenario?.skill_pathway] || []

  if (!scenario) {
    return (
      <OriginsPortalLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Scenario not found.</p>
          <button onClick={() => navigate('/family/student')} className="mt-4 text-teal-600 text-sm hover:underline">
            ← Back to my activities
          </button>
        </div>
      </OriginsPortalLayout>
    )
  }

  function advance(next) {
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 200)
  }

  function handleChoose(idx) {
    setChoiceIndex(idx)
    advance('outcome')
  }

  function handleComplete() {
    const session = {
      id:           `session-${Date.now()}`,
      scenario_id:  scenario.id,
      scenario_title: scenario.title,
      skill_pathway: scenario.skill_pathway,
      tec_offense:  scenario.tec_offense,
      choice_index: choiceIndex,
      choice_text:  chosen?.text,
      choice_score: chosen?.score,
      reflections,
      commitment,
      completed_at: new Date().toISOString(),
    }
    saveSession(session)
    advance('complete')
  }

  const stepIndex   = STEPS.indexOf(step)
  const progressPct = Math.round((stepIndex / (STEPS.length - 1)) * 100)

  return (
    <OriginsPortalLayout>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/family/student')} className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-1">
            ← Exit
          </button>
          <span className="text-xs text-gray-400 font-mono">{stepIndex + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className={`transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.328l5.603 3.113z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{scenario.title}</h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-teal-100 text-teal-700">
                  {PATHWAY_LABELS[scenario.skill_pathway]}
                </span>
                {offense && (
                  <span className="text-xs font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                    {offense.ref}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-teal-800">Before you start:</p>
              <ul className="space-y-2">
                {[
                  'You\'ll read a real situation and choose what you\'d actually do.',
                  'There\'s no trick — choose honestly, not what sounds "right."',
                  'After you choose, you\'ll reflect on what it means for you.',
                  'Your counselor and parent will see your reflection — not your grade.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-teal-700">
                    <span className="text-teal-400 mt-0.5 shrink-0">›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => advance('situation')}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              I'm ready — let's go →
            </button>
          </div>
        )}

        {/* ── SITUATION ── */}
        {step === 'situation' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">The Situation</p>
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <p className="text-base text-gray-900 leading-relaxed">{scenario.content.prompt}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Think about it honestly.</span>{' '}
                What would you actually do — not what you think you should say?
              </p>
            </div>

            <button
              onClick={() => advance('choose')}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              Show me my options →
            </button>
          </div>
        )}

        {/* ── CHOOSE ── */}
        {step === 'choose' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">What do you do?</p>
              <p className="text-sm text-gray-500">Tap the choice that feels most honest for you.</p>
            </div>

            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleChoose(i)}
                className="w-full text-left bg-white border-2 border-gray-200 hover:border-teal-400 hover:bg-teal-50 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full border-2 border-gray-300 group-hover:border-teal-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-teal-600">{String.fromCharCode(65 + i)}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{opt.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── OUTCOME ── */}
        {step === 'outcome' && chosen && (
          <div className="space-y-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">You chose:</p>

            {/* Their choice */}
            <div className={`rounded-2xl border-2 p-5 ${
              chosen.score >= 85 ? 'bg-teal-50 border-teal-300' :
              chosen.score >= 50 ? 'bg-amber-50 border-amber-300' :
              'bg-red-50 border-red-200'
            }`}>
              <p className="text-base font-semibold text-gray-900 mb-1">"{chosen.text}"</p>
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${
                chosen.score >= 85 ? 'bg-teal-100 text-teal-700' :
                chosen.score >= 50 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-600'
              }`}>
                {chosen.score >= 85 ? '✓ Strong choice' : chosen.score >= 50 ? '↗ Getting there' : '↻ Room to grow'}
              </div>
            </div>

            {/* What happens */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What this usually means:</p>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed">{chosen.outcome}</p>
              </div>
            </div>

            {/* Coaching supports */}
            {scenario.content.supports?.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <p className="text-xs font-semibold text-indigo-700 mb-2">Keep in mind:</p>
                <ul className="space-y-1.5">
                  {scenario.content.supports.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-indigo-700">
                      <span className="shrink-0 mt-0.5">›</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => advance('reflect')}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              Now let's reflect →
            </button>
          </div>
        )}

        {/* ── REFLECT ── */}
        {step === 'reflect' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reflect</p>
              <p className="text-sm text-gray-500">
                These questions are for you. There are no wrong answers — just honest ones.
              </p>
            </div>

            {prompts.map((prompt, i) => (
              <div key={i} className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">{prompt}</label>
                <textarea
                  value={reflections[i]}
                  onChange={e => {
                    const next = [...reflections]
                    next[i] = e.target.value
                    setReflections(next)
                  }}
                  rows={3}
                  placeholder="Write what's actually true for you..."
                  className="w-full rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-300 text-sm p-3 resize-none outline-none transition-colors placeholder-gray-300"
                />
              </div>
            ))}

            <button
              onClick={() => advance('commit')}
              disabled={reflections.every(r => !r.trim())}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              One more step →
            </button>
            <p className="text-center text-xs text-gray-400">Answer at least one question to continue.</p>
          </div>
        )}

        {/* ── COMMIT ── */}
        {step === 'commit' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Commitment</p>
              <p className="text-sm text-gray-500">
                This is the most important part. What will you actually do differently?
              </p>
            </div>

            <div className="bg-white border-2 border-teal-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-teal-800 mb-3">
                Next time a situation like this comes up, I will:
              </p>
              <textarea
                value={commitment}
                onChange={e => setCommitment(e.target.value)}
                rows={4}
                placeholder="Be specific. 'I will take three breaths before I respond.' 'I will text my mom first.' 'I will walk away and find a counselor.'"
                className="w-full rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-300 text-sm p-3 resize-none outline-none transition-colors placeholder-gray-300"
              />
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <p className="text-xs text-teal-700">
                <span className="font-semibold">Your counselor and parent/guardian will see this commitment.</span>{' '}
                That's intentional — people who know your plan can help you keep it.
              </p>
            </div>

            <button
              onClick={handleComplete}
              disabled={!commitment.trim()}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              I commit to this ✓
            </button>
          </div>
        )}

        {/* ── COMPLETE ── */}
        {step === 'complete' && chosen && (
          <div className="space-y-6">
            {/* Celebration */}
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4 text-4xl">
                🎯
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">You did it.</h2>
              <p className="text-gray-500 text-sm">That took honesty. That took courage.</p>
            </div>

            {/* Commitment card */}
            <div className="bg-teal-600 text-white rounded-2xl p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-200 mb-2">Your Commitment</p>
              <p className="text-base font-medium leading-relaxed">"{commitment}"</p>
              <p className="text-xs text-teal-300 mt-3">Screenshot this or write it down. Read it again tomorrow.</p>
            </div>

            {/* What happens next */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-800">What happens next:</p>
              <ul className="space-y-2">
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                  Your counselor can see your reflection and commitment
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                  Your parent/guardian receives a summary with conversation starters
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                  Your commitment stays visible on your activity page
                </li>
              </ul>
            </div>

            {/* Parent preview */}
            <ParentSummaryPreview scenario={scenario} chosen={chosen} commitment={commitment} />

            <button
              onClick={() => navigate('/family/student')}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              Back to my activities
            </button>
          </div>
        )}
      </div>
    </OriginsPortalLayout>
  )
}

function ParentSummaryPreview({ scenario, chosen, commitment }) {
  const starters = getConversationStarters(scenario, chosen)

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
      <div className="bg-emerald-100 px-5 py-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
        <p className="text-xs font-semibold text-emerald-700">Preview: What your parent/guardian will see</p>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-emerald-700 font-semibold mb-1">Their summary:</p>
          <p className="text-sm text-gray-700">
            Your child completed <span className="font-medium">"{scenario.title}"</span> and made a commitment for next time.
          </p>
        </div>
        <div>
          <p className="text-xs text-emerald-700 font-semibold mb-1">Their commitment:</p>
          <p className="text-sm text-gray-700 italic">"{commitment}"</p>
        </div>
        <div>
          <p className="text-xs text-emerald-700 font-semibold mb-2">Conversation starters for this week:</p>
          <ul className="space-y-2">
            {starters.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-emerald-400 mt-0.5 shrink-0 font-bold">›</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
