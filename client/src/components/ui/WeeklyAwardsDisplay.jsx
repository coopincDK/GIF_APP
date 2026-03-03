import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getWeekAwards } from '../../api/awards'

const CATEGORIES = [
  { id: 'fighter',   label: 'Ugens Fighter',   emoji: '🥊', color: 'bg-red-50 border-red-200 text-red-600' },
  { id: 'udvikling', label: 'Ugens Udvikling', emoji: '📈', color: 'bg-blue-50 border-blue-200 text-blue-600' },
  { id: 'ven',       label: 'Ugens Ven',       emoji: '🤝', color: 'bg-green-50 border-green-200 text-green-600' },
  { id: 'spiller',   label: 'Ugens Spiller',   emoji: '⚽', color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
  { id: 'fokus',     label: 'Ugens Fokus',     emoji: '🎯', color: 'bg-purple-50 border-purple-200 text-purple-600' },
  { id: 'energi',    label: 'Ugens Energi',    emoji: '🔥', color: 'bg-orange-50 border-orange-200 text-orange-600' },
]

function getWeekNumber() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
}

export default function WeeklyAwardsDisplay() {
  const [awards, setAwards] = useState([])
  const [loading, setLoading] = useState(true)
  const week = getWeekNumber()
  const year = new Date().getFullYear()

  useEffect(() => {
    getWeekAwards(week, year)
      .then(({ data }) => setAwards(data || []))
      .catch(() => setAwards([]))
      .finally(() => setLoading(false))
  }, [week, year])

  const getWinner = (cat) => awards.find(a => a.category === cat)
  const hasAny = awards.length > 0

  if (loading) return null

  return (
    <section className="px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-800">🏅 Ugens Helte</h2>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Uge {week}</span>
      </div>

      {!hasAny ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
          <div className="text-3xl mb-2">🏆</div>
          <p className="text-gray-500 font-semibold text-sm">Ugens helte er ikke kåret endnu</p>
          <p className="text-gray-400 text-xs mt-1">Kommer efter næste kamp!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat, i) => {
            const winner = getWinner(cat.id)
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className={`rounded-2xl border-2 p-3 ${winner ? cat.color : 'bg-gray-50 border-gray-100'}`}
              >
                <div className="text-xl mb-1">{cat.emoji}</div>
                <p className={`text-[10px] font-black uppercase tracking-wide ${winner ? '' : 'text-gray-400'}`}>
                  {cat.label}
                </p>
                <p className={`text-sm font-black mt-0.5 truncate ${winner ? 'text-gray-800' : 'text-gray-300'}`}>
                  {winner ? winner.user_name : '?'}
                </p>
                {winner?.note && (
                  <p className="text-[10px] text-gray-500 mt-0.5 truncate italic">"{winner.note}"</p>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
