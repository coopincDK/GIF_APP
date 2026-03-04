import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Badge from '../components/ui/Badge'
import BadgeUnlock from '../components/ui/BadgeUnlock'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getMyBadges, getAllBadges, getMyTimeline } from '../api/badges'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, scale: 0.5, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 12 } },
}

export default function TreasurePage() {
  const [earned, setEarned] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBadge, setNewBadge] = useState(null)
  const [timeline, setTimeline] = useState(null)

  useEffect(() => {
    getMyTimeline().then(r => setTimeline(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.all([getMyBadges(), getAllBadges()])
      .then(([me, allB]) => {
        setEarned(me.data || [])
        setAll(allB.data || [])
      })
      .catch(() => { setEarned([]); setAll([]) })
      .finally(() => setLoading(false))
  }, [])

  const earnedIds = new Set(earned.map(e => e.badgeId || e.id))

  const badges = all.map(b => {
    const earnedEntry = earned.find(e => (e.badgeId || e.id) === b.id)
    return { ...b, earned: !!earnedEntry, earnedAt: earnedEntry?.earnedAt }
  })

  if (loading) return <LoadingSpinner message="Henter skattekiste..." />

  return (
    <div className="pb-32">
      {newBadge && <BadgeUnlock badge={newBadge} onClose={() => setNewBadge(null)} />}

      <div className="px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="text-3xl font-black text-gray-900">
            ⚡ Min Skattekiste
          </h1>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block mt-2 bg-accent/20 text-amber-700 font-black text-sm px-4 py-1.5 rounded-full border border-accent/30"
          >
            🏅 {earned.length} / {all.length} badges optjent
          </motion.div>
        </motion.div>

        {/* Progress bar */}
        <div className="bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: all.length > 0 ? `${(earned.length / all.length) * 100}%` : '0%' }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>

        {/* Badge grid */}
        {badges.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">🎒</span>
            <p className="font-black text-gray-700">Ingen badges endnu!</p>
            <p className="text-gray-400 text-sm mt-1">Fortsæt det gode arbejde 💪</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 gap-3"
          >
            {badges.map((b, i) => (
              <motion.div key={b.id || i} variants={item}>
                <Badge badge={b} earned={b.earned} earnedAt={b.earnedAt} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Optjente badges sektion */}
        {earned.length > 0 && (
          <div className="mt-6 bg-white rounded-3xl shadow-md p-4">
            <h3 className="font-black text-gray-800 mb-1">🌟 Seneste badges</h3>
            <p className="text-gray-400 text-sm font-medium mb-3">Dine nyeste præstationer</p>
            {earned.slice(0, 3).map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-xl">⭐</div>
                <div>
                  <p className="font-black text-gray-900 text-sm">{e.name || e.badge?.name || 'Badge'}</p>
                  <p className="text-xs text-gray-400 font-medium">
                    {e.earnedAt ? new Date(e.earnedAt).toLocaleDateString('da-DK') : 'Nylig'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      {timeline && (
        <section className="px-4 mt-6 pb-8">
          <h2 className="text-lg font-black text-gray-800 mb-3">📅 Min historik</h2>

          {/* Ugens Helte awards */}
          {timeline.awards?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-black text-gray-600 text-sm mb-2">🏅 Ugens Helte</h3>
              <div className="space-y-2">
                {timeline.awards.map((a, i) => (
                  <motion.div key={a.award_id || i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 border border-gray-100">
                    <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🏅</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-sm capitalize">{a.category?.replace(/_/g, ' ')}</p>
                      <p className="text-gray-400 text-xs font-semibold">Uge {a.week_number}, {a.year}</p>
                      {a.note && <p className="text-gray-500 text-xs italic mt-0.5">"{a.note}"</p>}
                    </div>
                    {a.awarded_by_name && (
                      <span className="text-[10px] font-bold text-gray-300 flex-shrink-0">fra {a.awarded_by_name}</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Badges timeline */}
          {timeline.badges?.length > 0 && (
            <div className="mb-4">
              <h3 className="font-black text-gray-600 text-sm mb-2">💎 Badges optjent</h3>
              <div className="space-y-2">
                {timeline.badges.map((b, i) => (
                  <motion.div key={b.user_badge_id || i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 border border-gray-100">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      {b.image_url
                        ? <img src={b.image_url} alt="" className="w-8 h-8 object-contain" />
                        : <span className="text-xl">💎</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-sm">{b.name}</p>
                      <p className="text-gray-400 text-xs font-semibold">{b.description}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-300 flex-shrink-0">
                      {new Date(b.date_awarded).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Frivillig historik */}
          {timeline.volunteer?.length > 0 && (
            <div>
              <h3 className="font-black text-gray-600 text-sm mb-2">🙋 Frivillig-indsats</h3>
              <div className="space-y-2">
                {timeline.volunteer.map((v, i) => {
                  const typeLabel = { frugt: '🍎 Frugt', kage: '🎂 Kage', koersel: '🚗 Kørsel', fotos: '📸 Fotos' }
                  return (
                    <motion.div key={v.signup_id || i}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 border border-gray-100">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">{typeLabel[v.volunteer_type]?.split(' ')[0] || '🙋'}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-800 text-sm">{typeLabel[v.volunteer_type] || v.volunteer_type}</p>
                        <p className="text-gray-400 text-xs font-semibold">
                          {new Date(v.match_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-green-500 font-black text-xs">✓ Bekræftet</span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tom state */}
          {timeline.awards?.length === 0 && timeline.badges?.length === 0 && timeline.volunteer?.length === 0 && (
            <div className="text-center py-8 bg-white rounded-3xl shadow-sm">
              <span className="text-4xl block mb-2">🌱</span>
              <p className="font-black text-gray-500">Din historik er tom endnu</p>
              <p className="text-gray-400 text-sm font-semibold mt-1">Deltag og gør en forskel! 💪</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
