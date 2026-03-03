import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function BadgeUnlock({ badge, onClose }) {
  const fired = useRef(false)

  useEffect(() => {
    if (!fired.current) {
      fired.current = true
      // Konfetti eksplosion
      const duration = 3000
      const end = Date.now() + duration
      const colors = ['#f5c518', '#1a6b3c', '#ffffff', '#2d9e5f']

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
          className="bg-white rounded-3xl p-8 mx-6 flex flex-col items-center gap-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: 2, duration: 0.6, delay: 0.4 }}
            className="text-6xl"
          >
            🎉
          </motion.div>

          <h2 className="text-2xl font-black text-gray-800">Nyt Badge!</h2>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.3, 1] }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl border-4 border-accent"
          >
            {badge?.imageUrl ? (
              <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent to-primary-light flex items-center justify-center text-5xl">
                ⭐
              </div>
            )}
          </motion.div>

          <div className="text-center">
            <h3 className="text-xl font-black text-gray-900">{badge?.name || 'Nyt Badge'}</h3>
            <p className="text-gray-500 font-medium mt-1">{badge?.description || 'Du har optjent et nyt badge!'}</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="bg-primary text-white font-black px-8 py-3 rounded-2xl text-lg w-full mt-2"
          >
            🌟 Fed! 🌟
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
