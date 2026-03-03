import { motion } from 'framer-motion'
import { useCupMode } from '../../hooks/useCupMode'

export default function TopBar({ title }) {
  const { active } = useCupMode()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 flex items-center justify-between px-4 py-3 ${
        active ? 'cup-gradient' : 'animated-gradient'
      }`}
    >
      <div className="flex items-center gap-2">
        <img
          src="/assets/logo.jpg"
          alt="GIF Logo"
          className="w-9 h-9 rounded-full object-cover border-2 border-white/50 shadow"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div>
          <h1 className={`font-black text-base leading-tight ${active ? 'text-yellow-300' : 'text-white'}`}>
            {active ? '🏆 Kattegat Cup' : 'GIF Hold-Helte'}
          </h1>
          {title && (
            <p className="text-white/80 text-xs font-semibold">{title}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {active && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="bg-yellow-400 text-blue-900 text-xs font-black px-2 py-1 rounded-full"
          >
            ⚽ CUP!
          </motion.div>
        )}
        <div className={`text-lg ${active ? 'text-yellow-300' : 'text-white'}`}>
          {active ? '🏆' : '⚽'}
        </div>
      </div>
    </motion.header>
  )
}
