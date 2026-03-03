import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppShell from '../components/layout/AppShell'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { getTeamBadges } from '../api/badges'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, scale: 0, rotate: -15 },
  show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', damping: 10, stiffness: 200 } },
}

export default function TeamBannerPage() {
  const [teamBadges, setTeamBadges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeamBadges()
      .then(({ data }) => setTeamBadges(data || []))
      .catch(() => setTeamBadges([]))
      .finally(() => setLoading(false))
  }, [])

  const totalScore = teamBadges.length * 10

  if (loading) return <LoadingSpinner message="Henter hold-banner..." />

  return (
    <AppShell title="Holdets Super-Banner">
      <div className="px-4 py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-3xl font-black text-gray-900">🏆 Holdets Power!</h1>
          <p className="text-gray-500 font-semibold text-sm mt-1">Grenå IF's samlede styrke</p>
        </motion.div>

        {/* Total score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="animated-gradient rounded-3xl p-5 text-center mb-5 shadow-xl"
        >
          <p className="text-white/80 font-bold text-sm mb-1">Hold-Styrke Score</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            className="text-5xl font-black text-white"
          >
            ⚡ {totalScore}
          </motion.p>
          <p className="text-white/70 text-sm font-semibold mt-1">{teamBadges.length} badges samlet</p>
        </motion.div>

        {/* Football mønster baggrund */}
        <div className="football-pattern rounded-3xl p-4 bg-white shadow-md">
          {teamBadges.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-5xl block mb-3">🏅</span>
              <p className="font-black text-gray-700">Holdet har ingen badges endnu!</p>
              <p className="text-gray-400 text-sm mt-1">Vær den første til at optjene et badge 💪</p>
            </div>
          ) : (
            <>
              <h3 className="font-black text-gray-700 mb-3 text-center">
                🌟 Alle holdets badges
              </h3>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-3 gap-3"
              >
                {teamBadges.map((entry, i) => (
                  <motion.div
                    key={i}
                    variants={item}
                    className="flex flex-col items-center bg-gray-50 rounded-2xl p-3 shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-accent to-primary-light flex items-center justify-center shadow-md mb-1">
                      {entry.badge?.imageUrl ? (
                        <img src={entry.badge.imageUrl} alt={entry.badge.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">⭐</span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-gray-800 text-center leading-tight">
                      {entry.badge?.name || 'Badge'}
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold mt-0.5">
                      {entry.user?.name || 'Spiller'}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>

        {/* Top-spillere */}
        {teamBadges.length > 0 && (
          <div className="mt-4 bg-white rounded-3xl shadow-md p-4">
            <h3 className="font-black text-gray-800 mb-3">🥇 Top-spillere</h3>
            {Object.entries(
              teamBadges.reduce((acc, e) => {
                const name = e.user?.name || 'Ukendt'
                acc[name] = (acc[name] || 0) + 1
                return acc
              }, {})
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xl">{['🥇','🥈','🥉','🏅','⭐'][i]}</span>
                  <span className="font-black text-gray-900 flex-1">{name}</span>
                  <span className="bg-primary/10 text-primary font-black text-sm px-2 py-1 rounded-full">
                    {count} {count === 1 ? 'badge' : 'badges'}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
