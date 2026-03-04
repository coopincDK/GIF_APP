import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import { getLeaderboard } from '../../api/awards'

const AWARD_LABELS = {
  fighter: { emoji: '⚔️', label: 'Ugens Fighter' },
  udvikling: { emoji: '📈', label: 'Ugens Udvikling' },
  ven: { emoji: '🤝', label: 'Ugens Ven' },
  laundry: { emoji: '🧺', label: 'Tøjvask' },
  frugt: { emoji: '🍎', label: 'Frugt med' },
  kage: { emoji: '🎂', label: 'Kage med' },
  koersel: { emoji: '🚗', label: 'Kørsel' },
  fotos: { emoji: '📸', label: 'Fotos' },
}

export default function AdminHistoryTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('leaderboard')
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    getLeaderboard().then(r => setLeaderboard(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/history')
      .then(({ data }) => setData(data))
      .catch(() => setData({ laundry: [], awards: [], volunteers: [] }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-10 text-gray-400 font-semibold">Henter historik...</div>

  // Byg point-leaderboard: 1 point per titel/opgave
  const pointMap = {}
  const addPoint = (name) => {
    if (!name) return
    pointMap[name] = (pointMap[name] || 0) + 1
  }

  ;(data?.awards || []).forEach(a => addPoint(a.winner_name))
  ;(data?.laundry || []).forEach(l => addPoint(l.name))
  ;(data?.volunteers || []).forEach(v => addPoint(v.user_name))

  const pointLeaderboard = Object.entries(pointMap)
    .map(([name, points]) => ({ name, points }))
    .sort((a, b) => b.points - a.points)

  const maxPoints = pointLeaderboard[0]?.points || 1

  const SECTIONS = [
    { id: 'leaderboard', label: '🏆 Point' },
    { id: 'awards', label: '🏅 Helte' },
    { id: 'laundry', label: '🧺 Tøjvask' },
    { id: 'volunteers', label: '🙋 Frivillige' },
  ]

  return (
    <div className="space-y-4">
      {/* ── Leaderboard ── */}
      {leaderboard.length > 0 && (
        <section className="mb-6">
          <h2 className="font-black text-gray-800 text-lg mb-3">🏆 Samlet leaderboard</h2>
          <div className="space-y-2">
            {leaderboard.map((p, i) => (
              <motion.div key={p.user_id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 border-2 ${
                  i === 0 ? 'border-yellow-300' : i === 1 ? 'border-gray-300' : i === 2 ? 'border-orange-300' : 'border-transparent'
                }`}>
                {/* Placering */}
                <div className="w-8 text-center flex-shrink-0">
                  <span className="font-black text-lg">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-400 text-sm">{i+1}</span>}
                  </span>
                </div>
                {/* Avatar */}
                {p.profile_picture_url
                  ? <img src={p.profile_picture_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="font-black text-primary">{p.name?.[0]}</span>
                    </div>}
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-800 text-sm">{p.name}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-yellow-600">🏅 {p.award_count}</span>
                    <span className="text-[10px] font-bold text-blue-500">💎 {p.badge_count}</span>
                    <span className="text-[10px] font-bold text-green-500">🙋 {p.volunteer_count}</span>
                    <span className="text-[10px] font-bold text-gray-400">🧴 {p.laundry_count}</span>
                  </div>
                </div>
                {/* Total */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-black text-primary text-lg">{p.total_score}</p>
                  <p className="text-[10px] font-bold text-gray-400">point</p>
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 text-center mt-2">
            Point: 1 per titel + 1 per badge + 1 per frivillig-indsats
          </p>
        </section>
      )}

      {/* Sektion-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full font-black text-xs transition-all ${
              activeSection === s.id ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-500 border-2 border-gray-200'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* LEADERBOARD */}
      {activeSection === 'leaderboard' && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-primary/5 to-green-50 rounded-2xl p-4 border border-primary/20">
            <p className="text-xs font-black text-primary uppercase tracking-wide mb-1">Sådan tælles point</p>
            <p className="text-gray-600 text-xs font-semibold">1 point per titel (Ugens Helt, Fighter, Ven, Udvikling) + 1 point per tøjvask + 1 point per frivillig-opgave</p>
          </div>

          {pointLeaderboard.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-2">📊</div>
              <p className="font-black text-gray-500">Ingen data endnu</p>
            </div>
          ) : pointLeaderboard.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-black text-gray-300 w-8 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <div className="flex-1">
                  <p className="font-black text-gray-800">{p.name}</p>
                  <p className="text-xs font-bold text-gray-400">{p.points} point</p>
                </div>
                <span className="text-2xl font-black text-primary">{p.points}</span>
              </div>
              {/* Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.points / maxPoints) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`h-full rounded-full ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-primary/60'}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* AWARDS HISTORIK */}
      {activeSection === 'awards' && (
        <div className="space-y-2">
          {(data?.awards || []).length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-2">🏅</div>
              <p className="font-black text-gray-500">Ingen awards endnu</p>
            </div>
          ) : (data?.awards || []).map((a, i) => {
            const type = AWARD_LABELS[a.award_type] || { emoji: '🏅', label: a.award_type }
            return (
              <motion.div key={a.award_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                <span className="text-2xl">{type.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm">{a.winner_name || a.custom_name}</p>
                  <p className="text-gray-400 text-xs font-semibold">{type.label} · Uge {a.week_number}, {a.year}</p>
                </div>
                <span className="text-xs font-bold text-gray-300">+1 pt</span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* TØJVASK HISTORIK */}
      {activeSection === 'laundry' && (
        <div className="space-y-2">
          {(data?.laundry || []).length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-2">🧺</div>
              <p className="font-black text-gray-500">Ingen tøjvask-historik endnu</p>
            </div>
          ) : (data?.laundry || []).map((l, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
              <span className="text-2xl">🧺</span>
              <div className="flex-1">
                <p className="font-black text-gray-800 text-sm">{l.name}</p>
                <p className="text-gray-400 text-xs font-semibold">{new Date(l.date).toLocaleDateString('da-DK')}</p>
              </div>
              <span className="text-xs font-bold text-gray-300">+1 pt</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* FRIVILLIGE HISTORIK */}
      {activeSection === 'volunteers' && (
        <div className="space-y-2">
          {(data?.volunteers || []).length === 0 ? (
            <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
              <div className="text-4xl mb-2">🙋</div>
              <p className="font-black text-gray-500">Ingen bekræftede frivillige endnu</p>
            </div>
          ) : (data?.volunteers || []).map((v, i) => {
            const type = AWARD_LABELS[v.volunteer_type] || { emoji: '🙋', label: v.volunteer_type }
            return (
              <motion.div key={v.signup_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                <span className="text-2xl">{type.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm">{v.user_name}</p>
                  <p className="text-gray-400 text-xs font-semibold">{type.label} · {new Date(v.match_date).toLocaleDateString('da-DK')}</p>
                </div>
                <span className="text-xs font-bold text-gray-300">+1 pt</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
