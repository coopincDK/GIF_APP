import { useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = [
  '#1a6b3c', '#2d9e5f', '#f5c518', '#0f4a28',
  '#3db874', '#e8b400', '#156b38', '#4ccc8a',
  '#e05555', '#5589e0', '#9b59b6', '#e07c55',
  '#2bbcb0', '#d45090', '#6b7a1a', '#e08833',
]

export default function SpinWheel({ players = [], onResult }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState(null)
  const spinCount = useRef(0)

  // ── Weighted segments ──────────────────────────────────────────────────────
  const totalWeight = useMemo(
    () => players.reduce((sum, p) => sum + (p.weight ?? 1), 0),
    [players]
  )

  const segments = useMemo(() => {
    let cumulative = 0
    return players.map((player) => {
      const weight = player.weight ?? 1
      const angle = (weight / totalWeight) * 360
      const start = cumulative
      cumulative += angle
      return { player, angle, start, end: cumulative }
    })
  }, [players, totalWeight])

  // ── Spin ──────────────────────────────────────────────────────────────────
  const spin = () => {
    if (spinning || players.length < 2) return
    setSpinning(true)
    setWinner(null)

    const extraSpins = 5 + Math.random() * 5
    const randomAngle = Math.random() * 360
    const totalRotation = rotation + extraSpins * 360 + randomAngle
    setRotation(totalRotation)

    setTimeout(() => {
      setSpinning(false)
      spinCount.current += 1

      // Pointer is fixed at top (0°). Find which segment is under the pointer
      // after the wheel has rotated by totalRotation.
      // The angle at pointer = (360 - (totalRotation % 360)) % 360
      const pointerAngle = ((360 - (totalRotation % 360)) % 360)

      let winnerIdx = segments.length - 1
      for (let i = 0; i < segments.length; i++) {
        if (pointerAngle >= segments[i].start && pointerAngle < segments[i].end) {
          winnerIdx = i
          break
        }
      }

      const picked = segments[winnerIdx].player
      setWinner(picked)
      if (onResult) onResult([picked])
    }, 4000)
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <span className="text-5xl mb-3">👥</span>
        <p className="font-bold">Ingen spillere på hjulet</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6">

      {/* Hjul */}
      <div className="relative w-72 h-72">
        {/* Pil / pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div
            className="w-0 h-0"
            style={{
              borderLeft:  '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop:   '26px solid #f5c518',
              filter:      'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          />
        </div>

        {/* SVG hjul */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.23, 1, 0.32, 1] }}
          className="w-full h-full"
        >
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
            {segments.map(({ player, start, angle }, i) => {
              const startRad = (start - 90) * (Math.PI / 180)
              const endRad   = (start + angle - 90) * (Math.PI / 180)
              const x1 = 100 + 90 * Math.cos(startRad)
              const y1 = 100 + 90 * Math.sin(startRad)
              const x2 = 100 + 90 * Math.cos(endRad)
              const y2 = 100 + 90 * Math.sin(endRad)
              const largeArc = angle > 180 ? 1 : 0

              // Tekstposition i midten af segmentet
              const midRad = (start + angle / 2 - 90) * (Math.PI / 180)
              const tx = 100 + 62 * Math.cos(midRad)
              const ty = 100 + 62 * Math.sin(midRad)

              const label = (player?.name || player?.username || 'Spiller').split(' ')[0]
              // Skjul tekst på meget små segmenter
              const showLabel = angle >= 12

              return (
                <g key={player.id ?? i}>
                  <path
                    d={`M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 90 90 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {showLabel && (
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={players.length > 10 ? '7' : '9'}
                      fontWeight="bold"
                      fontFamily="Nunito, sans-serif"
                      transform={`rotate(${start + angle / 2}, ${tx.toFixed(2)}, ${ty.toFixed(2)})`}
                    >
                      {label}
                    </text>
                  )}
                </g>
              )
            })}
            {/* Center */}
            <circle cx="100" cy="100" r="16" fill="white" stroke="#f5c518" strokeWidth="3" />
            <text x="100" y="101" textAnchor="middle" dominantBaseline="middle" fontSize="13">🧺</text>
          </svg>
        </motion.div>
      </div>

      {/* SPIN-knap */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: spinning ? 1 : 1.05 }}
        onClick={spin}
        disabled={spinning || players.length < 2}
        className={`w-44 h-14 rounded-2xl font-black text-xl shadow-lg transition-all ${
          spinning || players.length < 2
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-accent text-gray-900 pulse-glow'
        }`}
      >
        {spinning ? '🌀 Snurrer...' : '🎡 SPIN!'}
      </motion.button>

      {/* Vinder */}
      {winner && !spinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-md"
        >
          <span className="text-4xl">🧺</span>
          <div>
            <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-0.5">Ugens tøjvask</p>
            <p className="font-black text-gray-900 text-lg">{winner?.name || winner?.username}</p>
          </div>
          <span className="ml-auto text-2xl">🎯</span>
        </motion.div>
      )}
    </div>
  )
}
