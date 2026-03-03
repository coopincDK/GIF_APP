import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useCupMode } from '../../hooks/useCupMode'

export default function CupCountdown({ compact = false }) {
  const { daysUntilCup, cupDate } = useCupMode()
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const calc = () => {
      const diff = cupDate - new Date()
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [cupDate])

  if (compact) {
    return (
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="cup-gradient rounded-2xl p-3 flex items-center gap-3"
      >
        <span className="text-3xl">🏆</span>
        <div>
          <p className="text-yellow-300 font-black text-sm">Kattegat Cup</p>
          <p className="text-white font-black text-xl leading-none">{timeLeft.days} dage!</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cup-gradient rounded-3xl p-5 mx-4 my-3 shadow-xl"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-4xl"
        >
          🏆
        </motion.span>
        <div className="text-center">
          <p className="text-yellow-300 font-black text-xs uppercase tracking-wider">Kattegat Cup 2026</p>
          <p className="text-white font-black text-lg leading-tight">Nedtælling!</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { val: timeLeft.days, label: 'Dage' },
          { val: timeLeft.hours, label: 'Timer' },
          { val: timeLeft.minutes, label: 'Min' },
          { val: timeLeft.seconds, label: 'Sek' },
        ].map(({ val, label }) => (
          <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-2 text-center">
            <motion.span
              key={val}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-2xl font-black text-yellow-300 block leading-none"
            >
              {String(val).padStart(2, '0')}
            </motion.span>
            <span className="text-white/70 text-[10px] font-bold">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
