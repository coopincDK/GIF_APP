import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getSchedule } from '../../api/schedule'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

export default function UpcomingMatch() {
  const [upcoming, setUpcoming] = useState([])
  const [apiConfigured, setApiConfigured] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getSchedule()
      .then(({ data }) => {
        setUpcoming(data.upcoming || [])
        setApiConfigured(data.api_key_configured)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  // Vis placeholder hvis API ikke er konfigureret
  if (loaded && !apiConfigured) {
    return (
      <section className="px-4 mt-6">
        <h2 className="text-lg font-black text-gray-800 mb-3">📅 Kampprogram</h2>
        <div
          onClick={() => navigate('/schedule')}
          className="bg-white rounded-3xl p-5 shadow-sm border-2 border-dashed border-gray-200 text-center cursor-pointer active:scale-98 transition-transform"
        >
          <div className="text-3xl mb-2">⚽</div>
          <p className="font-black text-gray-600 text-sm">Kampprogram aktiveres snart!</p>
          <p className="text-gray-400 text-xs font-semibold mt-1">Tryk for at se detaljer 👆</p>
        </div>
      </section>
    )
  }

  if (!loaded || upcoming.length === 0) return null

  const next = upcoming[0]
  const days = daysUntil(next.date)

  return (
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-800">📅 Næste event</h2>
        <button
          onClick={() => navigate('/schedule')}
          className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full"
        >
          Se alle →
        </button>
      </div>

      {/* Hoved-kort */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/schedule')}
        className={`rounded-3xl p-4 shadow-md cursor-pointer ${
          next.type === 'match'
            ? 'bg-gradient-to-br from-primary to-green-600'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}
      >
        {/* Type + countdown */}
        <div className="flex items-center justify-between mb-3">
          <span className="bg-white/20 text-white text-xs font-black px-3 py-1 rounded-full">
            {next.type === 'match' ? '⚽ KAMP' : '🏃 TRÆNING'}
          </span>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${
            days <= 0 ? 'bg-red-500 text-white' :
            days === 1 ? 'bg-yellow-400 text-gray-900' :
            'bg-white/20 text-white'
          }`}>
            {days <= 0 ? 'I DAG! 🔥' : days === 1 ? 'I MORGEN! ⚡' : `Om ${days} dage`}
          </span>
        </div>

        {next.type === 'match' ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-black text-white text-sm flex-1 text-right leading-tight">{next.home_team}</span>
              <span className="bg-white/30 text-white font-black text-base px-3 py-1 rounded-xl flex-shrink-0">VS</span>
              <span className="font-black text-white text-sm flex-1 text-left leading-tight">{next.away_team}</span>
            </div>
            <p className="text-white/80 text-xs font-bold">
              📍 {next.venue} · {formatDate(next.date)}{next.time ? ` kl. ${next.time}` : ''}
            </p>
          </div>
        ) : (
          <div>
            <p className="font-black text-white text-xl mb-1">Træning 💪</p>
            <p className="text-white/80 text-sm font-bold">
              📍 {next.venue} · {formatDate(next.date)}{next.time ? ` kl. ${next.time}` : ''}
              {next.end_time ? ` – ${next.end_time}` : ''}
            </p>
            {next.note && <p className="text-white/60 text-xs font-semibold mt-1 italic">{next.note}</p>}
          </div>
        )}
      </motion.div>

      {/* Næste 2 events */}
      {upcoming.length > 1 && (
        <div className="mt-2 space-y-2">
          {upcoming.slice(1, 3).map((e, i) => (
            <motion.div
              key={e.id || i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate('/schedule')}
              className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 cursor-pointer"
            >
              <span className="text-xl">{e.type === 'match' ? '⚽' : '🏃'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm truncate">
                  {e.type === 'match' ? `${e.home_team} vs ${e.away_team}` : 'Træning'}
                </p>
                <p className="text-gray-400 text-xs font-semibold">
                  {formatDate(e.date)}{e.time ? ` kl. ${e.time}` : ''}
                </p>
              </div>
              <span className="text-xs font-bold text-gray-300 flex-shrink-0">
                {daysUntil(e.date)}d →
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
