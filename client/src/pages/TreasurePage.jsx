import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Badge from '../components/ui/Badge'
import BadgeUnlock from '../components/ui/BadgeUnlock'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getMyBadges, getAllBadges } from '../api/badges'

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
    <div>
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
    </div>
  )
}
