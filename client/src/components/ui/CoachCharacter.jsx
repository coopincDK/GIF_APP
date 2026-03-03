import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COACHES = {
  ag: {
    name: 'Adam',
    short: 'AG',
    images: [
      '/assets/coaches/ag/ag_01_coaching.png',
      '/assets/coaches/ag/ag_02_coaching.png',
    ],
    color: 'bg-primary',
  },
  bsj: {
    name: 'Bjarke',
    short: 'BSJ',
    images: [
      '/assets/coaches/bsj/bsj_01_coaching.png',
      '/assets/coaches/bsj/bsj_02_coaching.png',
    ],
    color: 'bg-blue-700',
  },
}

const MESSAGES = [
  'Kæmpe indsats i træning i dag! 💪',
  'I er det bedste hold i verden! ⭐',
  'Hold hovedet oppe og kæmp videre! 🔥',
  'Fantastisk arbejde – bliv ved! 🌟',
  'Vi er et hold – vi vinder sammen! 🤝',
  'Øvelse gør mester! Bliv ved! ⚽',
  'I kan det her – jeg tror på jer! 💪',
  'Husk: Sjov og god energi til alle! 😄',
]

export default function CoachCharacter({ coachId, message, imageIndex = 0 }) {
  const [coach, setCoach] = useState(null)
  const [msg, setMsg] = useState('')
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    const id = coachId || (Math.random() > 0.5 ? 'ag' : 'bsj')
    setCoach(COACHES[id] || COACHES.ag)
    setMsg(message || MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
    setImgError(false)
  }, [coachId, message])

  if (!coach) return null

  const imgSrc = coach.images[imageIndex % coach.images.length]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-end gap-3 px-4 py-3"
    >
      {/* Coach billede */}
      <div className="relative flex-shrink-0">
        <div className={`w-16 h-16 rounded-2xl overflow-hidden ${coach.color} shadow-lg`}>
          {!imgError ? (
            <img
              src={imgSrc}
              alt={coach.name}
              className="w-full h-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl text-white font-black">
              {coach.short}
            </div>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${coach.color} rounded-full border-2 border-white flex items-center justify-center`}>
          <span className="text-xs">⚽</span>
        </div>
      </div>

      {/* Tale-boble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={msg}
          initial={{ opacity: 0, scale: 0.8, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative bg-white rounded-2xl rounded-bl-sm shadow-md px-4 py-3 max-w-[220px] border border-gray-100"
        >
          <p className="text-gray-800 font-bold text-sm leading-snug">{msg}</p>
          <p className="text-gray-400 text-xs font-semibold mt-1">— Træner {coach.name}</p>
          {/* Boble hale */}
          <div className="absolute -bottom-2 left-3 w-0 h-0"
            style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid white' }}
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
