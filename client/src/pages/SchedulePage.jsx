import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { getSchedule, syncSchedule } from '../api/schedule'
import toast from 'react-hot-toast'

function fmtLong(d)  { return d ? new Date(d).toLocaleDateString('da-DK', { weekday: 'long',  day: 'numeric', month: 'long'  }) : '' }
function fmtShort(d) { return d ? new Date(d).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' }) : '' }

const TABS = [
  { id: 'upcoming', label: '📅 Kommende' },
  { id: 'matches',  label: '⚽ Kampe'    },
  { id: 'training', label: '🏃 Træning'  },
  { id: 'standing', label: '📊 Stilling' },
]

export default function SchedulePage() {
  const { isAdmin } = useAuth()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('upcoming')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getSchedule()
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncSchedule()
      const { data: fresh } = await getSchedule()
      setData(fresh)
      toast.success('Kampprogram opdateret! ✅')
    } catch { toast.error('Kunne ikke synkronisere') }
    finally { setSyncing(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce">⚽</div>
        <p className="font-black text-gray-500">Henter kampprogram...</p>
      </div>
    </div>
  )

  const apiOk    = data?.api_key_configured
  const lastSync = data?.last_sync
    ? new Date(data.last_sync).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-green-600 px-4 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">📅 Kampprogram</h1>
            <p className="text-white/70 text-sm font-semibold mt-0.5">
              {apiOk
                ? `Grenå IF U10/U11 · Sidst synket: ${lastSync || 'Aldrig'}`
                : 'DBU-integration ikke aktiv endnu'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-white/20 text-white font-black text-xs px-3 py-2 rounded-xl active:scale-95 transition-transform"
            >
              {syncing ? '⏳' : '🔄 Sync'}
            </button>
          )}
        </div>
      </div>

      {/* Ikke konfigureret — guide */}
      {!apiOk && (
        <div className="mx-4 mt-6 bg-amber-50 border-2 border-amber-200 rounded-3xl p-5">
          <div className="text-3xl mb-2">🔑</div>
          <h3 className="font-black text-amber-800 mb-2">DBU API ikke aktiveret endnu</h3>
          <p className="text-amber-700 text-sm font-semibold leading-relaxed mb-4">
            Når Grenå IF bestiller API-adgang fra DBU, vises kampprogram, træninger og stilling automatisk her — kun for U10/U11 holdet.
          </p>
          <div className="bg-white rounded-2xl p-4 space-y-2">
            <p className="text-xs font-black text-gray-700 mb-2">📋 Sådan aktiverer du det:</p>
            {[
              'Gå til dbu.dk → KlubAdmin → Klubben',
              'Vælg "KlubOffice Data" fanen',
              'Bestil API-nøgle (inkluderet i Klub-CMS)',
              'Find hold-ID for U10/U11 under Hold',
              'Tilføj DBU_API_KEY + DBU_TEAM_ID på Render',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-xs font-semibold text-gray-600">{step}</p>
              </div>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="mt-3 w-full bg-amber-500 text-white font-black py-2.5 rounded-2xl text-sm"
            >
              {syncing ? '⏳ Tester...' : '🔄 Test forbindelse nu'}
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mt-5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-black text-xs transition-all ${
              tab === t.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-gray-500 border-2 border-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-3">

        {/* ── KOMMENDE ── */}
        {tab === 'upcoming' && (
          <>
            {(data?.upcoming || []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                <div className="text-4xl mb-2">📅</div>
                <p className="font-black text-gray-500">{apiOk ? 'Ingen kommende events' : 'Afventer DBU-integration'}</p>
              </div>
            ) : (data.upcoming).map((e, i) => (
              <motion.div key={e.id || i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`rounded-3xl p-4 shadow-sm border-2 ${
                  e.type === 'match'
                    ? 'bg-gradient-to-br from-primary/8 to-green-50 border-primary/20'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    e.type === 'match' ? 'bg-primary/15 text-primary' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {e.type === 'match' ? '⚽ KAMP' : '🏃 TRÆNING'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{fmtShort(e.date)}</span>
                </div>
                {e.type === 'match' ? (
                  <p className="font-black text-gray-800 text-sm">
                    {e.home_team} <span className="text-gray-400 font-semibold">vs</span> {e.away_team}
                  </p>
                ) : (
                  <p className="font-black text-gray-800 text-sm">Træning</p>
                )}
                <p className="text-gray-500 text-xs font-semibold mt-1">
                  📍 {e.venue}{e.time ? ` · kl. ${e.time}` : ''}
                </p>
              </motion.div>
            ))}
          </>
        )}

        {/* ── KAMPE ── */}
        {tab === 'matches' && (
          <>
            {(data?.matches || []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                <div className="text-4xl mb-2">⚽</div>
                <p className="font-black text-gray-500">{apiOk ? 'Ingen kampe fundet' : 'Afventer DBU-integration'}</p>
              </div>
            ) : (data.matches).map((m, i) => (
              <motion.div key={m.id || i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-3xl shadow-sm p-4 border-l-4 border-primary">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    m.is_home ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {m.is_home ? '🏠 Hjemme' : '✈️ Ude'}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{fmtShort(m.date)}</span>
                </div>
                <div className="flex items-center gap-2 my-1">
                  <span className="flex-1 font-black text-gray-800 text-sm text-right leading-tight">{m.home_team}</span>
                  {m.home_score != null ? (
                    <span className="bg-gray-100 px-3 py-1 rounded-xl font-black text-gray-700 flex-shrink-0">
                      {m.home_score} – {m.away_score}
                    </span>
                  ) : (
                    <span className="bg-gray-100 px-3 py-1 rounded-xl font-black text-gray-400 flex-shrink-0 text-sm">vs</span>
                  )}
                  <span className="flex-1 font-black text-gray-800 text-sm text-left leading-tight">{m.away_team}</span>
                </div>
                <p className="text-gray-400 text-xs font-semibold mt-1.5 text-center">
                  📍 {m.venue}{m.time ? ` · kl. ${m.time}` : ''}
                </p>
              </motion.div>
            ))}
          </>
        )}

        {/* ── TRÆNING ── */}
        {tab === 'training' && (
          <>
            {(data?.trainings || []).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl shadow-sm">
                <div className="text-4xl mb-2">🏃</div>
                <p className="font-black text-gray-500">{apiOk ? 'Ingen træninger fundet' : 'Afventer DBU-integration'}</p>
              </div>
            ) : (data.trainings).map((t, i) => (
              <motion.div key={t.id || i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-3xl shadow-sm p-4 border-l-4 border-blue-400">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-gray-800 text-sm">{fmtLong(t.date)}</p>
                  <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">🏃 Træning</span>
                </div>
                <p className="text-gray-500 text-sm font-semibold">
                  📍 {t.venue}{t.time ? ` · kl. ${t.time}` : ''}{t.end_time ? ` – ${t.end_time}` : ''}
                </p>
                {t.note && <p className="text-gray-400 text-xs font-semibold mt-1 italic">{t.note}</p>}
              </motion.div>
            ))}
          </>
        )}

        {/* ── STILLING ── */}
        {tab === 'standing' && (
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {(data?.standings || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">📊</div>
                <p className="font-black text-gray-500">{apiOk ? 'Ingen stilling fundet' : 'Afventer DBU-integration'}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-primary/10">
                  <tr>
                    {['#','Hold','K','V','U','T','Pt'].map(h => (
                      <th key={h} className={`py-2.5 font-black text-gray-600 text-xs ${h === 'Hold' ? 'text-left px-4' : 'text-center px-2'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.standings.map((s, i) => {
                    const isOurs = (s.TeamName || s.team_name || '').toLowerCase().includes('gren')
                    return (
                      <tr key={i} className={`border-t border-gray-50 ${isOurs ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-2.5 font-black text-gray-400 text-xs">{i+1}</td>
                        <td className="px-4 py-2.5 font-black text-gray-800 text-sm">
                          {isOurs && <span className="text-primary mr-1">★</span>}
                          {s.TeamName || s.team_name}
                        </td>
                        <td className="text-center px-2 py-2.5 text-gray-500 text-xs">{s.Played  ?? s.played  ?? '-'}</td>
                        <td className="text-center px-2 py-2.5 text-green-600 text-xs font-bold">{s.Won   ?? s.won   ?? '-'}</td>
                        <td className="text-center px-2 py-2.5 text-yellow-600 text-xs font-bold">{s.Draw  ?? s.draw  ?? '-'}</td>
                        <td className="text-center px-2 py-2.5 text-red-500 text-xs font-bold">{s.Lost  ?? s.lost  ?? '-'}</td>
                        <td className="text-center px-2 py-2.5 font-black text-primary">{s.Points ?? s.points ?? '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
