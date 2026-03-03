import { useState, useRef } from 'react'
import { motion } from 'framer-motion'

const COLORS = [
  '#1a6b3c', '#2d9e5f', '#f5c518', '#0f4a28',
  '#3db874', '#e8b400', '#156b38', '#4ccc8a',
]

export default function SpinWheel({ players = [], onResult }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winners, setWinners] = useState([])
  const spinCount = useRef(0)

  const segmentAngle = players.length > 0 ? 360 / players.length : 0

  const spin = () => {
    if (spinning || players.length < 3) return
    setSpinning(true)
    setWinners([])

    const extraSpins = 5 + Math.random() * 5
    const randomAngle = Math.random() * 360
    const totalRotation = rotation + extraSpins * 360 + randomAngle
    setRotation(totalRotation)

    setTimeout(() => {
      setSpinning(false)
      spinCount.current += 1

      // Beregn vinder baseret på slutposition
      const finalAngle = totalRotation % 360
      const winnerIdx = Math.floor(((360 - finalAngle) % 360) / segmentAngle) % players.length

      // Vælg 3 forskellige
      const indices = new Set([winnerIdx])
      while (indices.size < Math.min(3, players.length)) {
        indices.add(Math.floor(Math.random() * players.length))
      }
      const selected = [...indices].map((i) => players[i])
      setWinners(selected)
      if (onResult) onResult(selected)
    }, 4000)
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <span className="text-5xl mb-3">👥</span>
        <p className="font-bold">Ingen spillere fundet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hjul */}
      <div className="relative w-72 h-72">
        {/* Pil */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0" style={{
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '24px solid #f5c518',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }} />
        </div>

        {/* SVG Hjul */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.23, 1, 0.32, 1] }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            {players.map((player, i) => {
              const startAngle = (i * segmentAngle - 90) * (Math.PI / 180)
              const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180)
              const x1 = 100 + 90 * Math.cos(startAngle)
              const y1 = 100 + 90 * Math.sin(startAngle)
              const x2 = 100 + 90 * Math.cos(endAngle)
              const y2 = 100 + 90 * Math.sin(endAngle)
              const largeArc = segmentAngle > 180 ? 1 : 0

              // Tekst position
              const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180)
              const tx = 100 + 60 * Math.cos(midAngle)
              const ty = 100 + 60 * Math.sin(midAngle)

              return (
                <g key={i}>
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={players.length > 8 ? '7' : '9'}
                    fontWeight="bold"
                    fontFamily="Nunito, sans-serif"
                    transform={`rotate(${(i + 0.5) * segmentAngle}, ${tx}, ${ty})`}
                  >
                    {(player?.name || player?.username || 'Spiller').split(' ')[0]}
                  </text>
                </g>
              )
            })}
            {/* Center cirkel */}
            <circle cx="100" cy="100" r="15" fill="white" stroke="#f5c518" strokeWidth="3" />
            <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="12">⚽</text>
          </svg>
        </motion.div>
      </div>

      {/* SPIN knap */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        onClick={spin}
        disabled={spinning}
        className={`w-40 h-14 rounded-2xl text-white font-black text-xl shadow-lg transition-all ${
          spinning ? 'bg-gray-400' : 'bg-accent text-gray-900 pulse-glow'
        }`}
      >
        {spinning ? '🌀 Snurrer...' : '🎡 SPIN!'}
      </motion.button>

      {/* Vindernavne */}
      {winners.length > 0 && !spinning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-2"
        >
          <p className="text-center font-black text-gray-700 text-sm">🎯 Hjulet har talt!</p>
          {winners.map((w, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-md"
            >
              <span className="text-2xl">{['👕', '🍎', '🎂'][i]}</span>
              <div>
                <p className="font-black text-gray-900">{w?.name || w?.username}</p>
                <p className="text-xs text-gray-500 font-semibold">
                  {['Tøjvask', 'Frugt', 'Kage'][i]}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
