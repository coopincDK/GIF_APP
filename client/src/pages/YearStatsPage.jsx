import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getYearStats } from '../api/awards'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CATS = [
  { id: 'fighter',   label: '🥊', full: 'Fighter' },
  { id: 'udvikling', label: '📈', full: 'Udvikling' },
  { id: 'ven',       label: '🤝', full: 'Ven' },
  { id: 'spiller',   label: '⚽', full: 'Spiller' },
  { id: 'fokus',     label: '🎯', full: 'Fokus' },
  { id: 'energi',    label: '🔥', full: 'Energi' },
  { id: 'toejvask',  label: '🧺', full: 'Tøjvask' },
  { id: 'frugt',     label: '🍎', full: 'Frugt' },
  { id: 'kage',      label: '🎂', full: 'Kage' },
]

export default function YearStatsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    setLoading(true)
    getYearStats(year)
      .then(({ data }) => {
        const sorted = (data || []).sort((a, b) => (b.total || 0) - (a.total || 0))
        setStats(sorted)
        if (sorted.length > 0) {
          setTimeout(() => setShowConfetti(true), 500)
          setTimeout(() => setShowConfetti(false), 4000)
        }
      })
      .catch(() => setStats([]))
      .finally(() => setLoading(false))
  }, [year])

  const winner = stats[0]

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="animated-gradient px-4 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🏆 Årsstatistik</h1>
            <p className="text-white/70 text-sm font-semibold">Kun synlig for admin</p>
          </div>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="bg-white/20 text-white font-black rounded-xl px-3 py-2 border-0 outline-none text-sm"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} className="text-gray-800">{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner message="Henter statistik..." /> : (
        <div className="px-4 mt-4 space-y-4">

          {/* Årets Vinder */}
          {winner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden"
            >
              {/* Konfetti */}
              <AnimatePresence>
                {showConfetti && [...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 300 - 150, opacity: 1 }}
                    animate={{ y: 300, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
                    className="absolute top-0 text-xl pointer-events-none"
                    style={{ left: `${10 + i * 7}%` }}
                  >
                    {['🎉','⭐','🏆','✨','🎊'][i % 5]}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="text-5xl mb-2">🏆</div>
              <p className="text-white/80 font-bold text-sm uppercase tracking-widest">Årets Vinder {year}</p>
              <p className="text-white font-black text-3xl mt-1">{winner.name}</p>
              <div className="mt-3 bg-white/30 rounded-2xl px-4 py-2 inline-block">
                <span className="text-white font-black text-xl">{winner.total} point</span>
              </div>
            </motion.div>
          )}

          {/* Statistik tabel */}
          {stats.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500 font-semibold">Ingen data for {year} endnu</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-3 font-black text-gray-600 sticky left-0 bg-gray-50">#</th>
                      <th className="text-left px-3 py-3 font-black text-gray-600 sticky left-6 bg-gray-50 min-w-[100px]">Navn</th>
                      {CATS.map(c => (
                        <th key={c.id} className="px-2 py-3 font-black text-gray-500 text-center" title={c.full}>
                          {c.label}
                        </th>
                      ))}
                      <th className="px-3 py-3 font-black text-primary text-center">∑</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((row, i) => (
                      <motion.tr
                        key={row.user_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`border-b border-gray-50 ${i === 0 ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-3 py-2.5 font-black text-gray-400 sticky left-0 bg-inherit">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td className="px-3 py-2.5 font-black text-gray-800 sticky left-6 bg-inherit whitespace-nowrap">
                          {row.name}
                          {i === 0 && <span className="ml-1 text-yellow-500">★</span>}
                        </td>
                        {CATS.map(c => (
                          <td key={c.id} className="px-2 py-2.5 text-center font-bold text-gray-600">
                            {row[c.id] > 0 ? (
                              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                                {row[c.id]}
                              </span>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`font-black text-sm px-2 py-1 rounded-full ${
                            i === 0 ? 'bg-yellow-400 text-white' :
                            i === 1 ? 'bg-gray-300 text-white' :
                            i === 2 ? 'bg-orange-300 text-white' :
                            'bg-primary/10 text-primary'
                          }`}>
                            {row.total || 0}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Forklaring */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-black text-gray-600 text-sm mb-2">📋 Point-forklaring</p>
            <div className="grid grid-cols-3 gap-1">
              {CATS.map(c => (
                <div key={c.id} className="text-xs text-gray-500 font-semibold">
                  {c.label} {c.full}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Hvert award = 1 point. Tøjvask, frugt og kage tæller med.</p>
          </div>
        </div>
      )}
    </div>
  )
}
