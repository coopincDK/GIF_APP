import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LOADING_TEXTS = [
  'Henter data... ⚡',
  'Lader op... 🔋',
  'Klar snart... ⚽',
  'Finder heltene... 🏅',
  'Giver den gas... 🔥',
]

export default function LoadingSpinner({ message }) {
  const [textIndex, setTextIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(i => (i + 1) % LOADING_TEXTS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Ydre pulserende ring */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Ring lag 1 — langsom puls */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-primary/30"
        />
        {/* Ring lag 2 — hurtigere puls */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.8, 0.25, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-primary/20"
        />
        {/* Roterende bold */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="text-5xl relative z-10 select-none"
        >
          ⚽
        </motion.div>
      </div>

      {/* Skiftende loading-tekst */}
      <div className="h-8 flex items-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="text-primary font-black text-lg text-center"
          >
            {message || LOADING_TEXTS[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}

export function InlineSpinner({ size = 20 }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
      className="inline-block"
      style={{ width: size, height: size }}
    >
      <div
        className="rounded-full border-2 border-white/30 border-t-white w-full h-full"
      />
    </motion.div>
  )
}
