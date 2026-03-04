import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFootball } from '../../api/football'

const CLUB_EMOJI = {
  'FCK':         '🦁',
  'Brøndby':     '🐝',
  'AGF':         '⚪',
  'OB':          '🔵',
  'AaB':         '🔴',
  'Midtjylland': '🐺',
  'Randers':     '⚫',
  'Viborg':      '🟢',
  'Silkeborg':   '🔴',
  'Vejle':       '🟡',
  'Lyngby':      '🔵',
  'Hvidovre':    '🟡',
}

function clubEmoji(name) {
  if (!name) return '⚽'
  const key = Object.keys(CLUB_EMOJI).find(k => name.includes(k))
  return key ? CLUB_EMOJI[key] : '⚽'
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })
}

const TABS = [
  { id: 'recent',   label: '📋 Resultater' },
  { id: 'upcoming', label: '📅 Kommende'   },
  { id: 'standing', label: '📊 Stilling'   },
]

export default function SuperligaWidget() {
  const [data, setData]     = useState(null)
  const [tab, setTab]       = useState('recent')
  const [apiOk, setApiOk]   = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getFootball()
      .then(({ data }) => { setData(data); setApiOk(data.api_key_configured) })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (loaded && !apiOk) {
    return (
      <section className="px-4 mt-6">
        <h2 className="text-lg font-black text-gray-800 mb-3">🏆 Superliga</h2>
        <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-dashed border-gray-200 text-center">
          <div className="text-3xl mb-2">⚽</div>
          <p className="font-black text-gray-500 text-sm">Superliga-resultater aktiveres snart!</p>
          <p className="text-gray-400 text-xs font-semibold mt-1">Gratis API fra football-data.org</p>
        </div>
      </section>
    )
  }

  if (!loaded || !data) return null

  return (
    <section className="px-4 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-800">⚽ Fodbold</h2>
        <span className="text-[10px] font-bold text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">
          Live data
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-3">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-full font-black text-xs transition-all ${
              tab === t.id ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 border-2 border-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── RESULTATER ── */}
        {tab === 'recent' && (
          <motion.div key="recent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {(data.recent || []).length === 0 ? (
              <div className="text-center py-6 bg-white rounded-2xl shadow-sm">
                <p className="font-black text-gray-400 text-sm">Ingen resultater endnu</p>
              </div>
            ) : data.recent.map((m, i) => {
              const homeWon = m.home_score > m.away_score
              const awayWon = m.away_score > m.home_score
              return (
                <motion.div key={m.id || i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-2">
                  {/* Hjemmehold */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {m.home_crest
                      ? <img src={m.home_crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                      : <span className="text-base flex-shrink-0">{clubEmoji(m.home_team)}</span>}
                    <span className={`font-black text-xs truncate ${homeWon ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.home_team}
                    </span>
                  </div>
                  {/* Score */}
                  <div className="flex items-center gap-1 flex-shrink-0 bg-gray-50 rounded-xl px-2 py-1">
                    <span className={`text-sm font-black w-4 text-center ${homeWon ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.home_score ?? '-'}
                    </span>
                    <span className="text-gray-300 font-black text-xs">–</span>
                    <span className={`text-sm font-black w-4 text-center ${awayWon ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.away_score ?? '-'}
                    </span>
                  </div>
                  {/* Udehold */}
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className={`font-black text-xs truncate ${awayWon ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.away_team}
                    </span>
                    {m.away_crest
                      ? <img src={m.away_crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                      : <span className="text-base flex-shrink-0">{clubEmoji(m.away_team)}</span>}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── KOMMENDE ── */}
        {tab === 'upcoming' && (
          <motion.div key="upcoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2">
            {(data.upcoming || []).length === 0 ? (
              <div className="text-center py-6 bg-white rounded-2xl shadow-sm">
                <p className="font-black text-gray-400 text-sm">Ingen kommende kampe</p>
              </div>
            ) : data.upcoming.map((m, i) => (
              <motion.div key={m.id || i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Runde {m.matchday}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {fmtDate(m.date)} · {fmtTime(m.date)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {m.home_crest
                      ? <img src={m.home_crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                      : <span className="text-base">{clubEmoji(m.home_team)}</span>}
                    <span className="font-black text-xs text-gray-800 truncate">{m.home_team}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-400 font-black text-xs px-2 py-0.5 rounded-lg flex-shrink-0">vs</span>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="font-black text-xs text-gray-800 truncate">{m.away_team}</span>
                    {m.away_crest
                      ? <img src={m.away_crest} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                      : <span className="text-base">{clubEmoji(m.away_team)}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── STILLING ── */}
        {tab === 'standing' && (
          <motion.div key="standing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {(data.standings || []).length === 0 ? (
              <div className="text-center py-6 bg-white rounded-2xl shadow-sm">
                <p className="font-black text-gray-400 text-sm">Ingen stilling endnu</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-primary/10">
                    <tr>
                      {['#', 'Hold', 'K', 'V', 'U', 'T', 'Pt'].map(h => (
                        <th key={h} className={`py-2 font-black text-gray-600 ${h === 'Hold' ? 'text-left px-3' : 'text-center px-1'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.standings.slice(0, 14).map((s, i) => (
                      <tr key={i} className={`border-t border-gray-50 ${i < 3 ? 'bg-green-50/40' : i >= 11 ? 'bg-red-50/40' : ''}`}>
                        <td className="px-2 py-2 font-black text-gray-400 text-center text-[11px]">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            {s.team?.crest
                              ? <img src={s.team.crest} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                              : <span className="text-sm">{clubEmoji(s.team?.shortName || s.team?.name)}</span>}
                            <span className="font-black text-gray-800 truncate max-w-[75px]">
                              {s.team?.shortName || s.team?.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-1 py-2 text-gray-500">{s.playedGames}</td>
                        <td className="text-center px-1 py-2 text-green-600 font-bold">{s.won}</td>
                        <td className="text-center px-1 py-2 text-yellow-600 font-bold">{s.draw}</td>
                        <td className="text-center px-1 py-2 text-red-500 font-bold">{s.lost}</td>
                        <td className="text-center px-1 py-2 font-black text-primary">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-2 flex gap-4 border-t border-gray-50">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-green-200 inline-block"></span> Europæisk
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-red-200 inline-block"></span> Nedrykning
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  )
}
