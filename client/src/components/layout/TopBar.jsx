import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCupMode } from '../../hooks/useCupMode'

export default function TopBar() {
  const { active } = useCupMode()
  const navigate = useNavigate()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 flex items-center justify-between px-4 py-3 ${
        active ? 'cup-gradient' : 'animated-gradient'
      }`}
    >
      {/* Logo + titel — klikbar hjem */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 active:opacity-70 transition-opacity"
      >
        <img
          src="/assets/logo.jpg"
          alt="GIF Logo"
          className="w-9 h-9 rounded-full object-cover border-2 border-white/50 shadow"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <div className="text-left">
          <h1 className={`font-black text-base leading-tight ${active ? 'text-yellow-300' : 'text-white'}`}>
            {active ? '🏆 Kattegat Cup' : 'GIF Hold-Helte'}
          </h1>
          <p className="text-white/70 text-xs font-semibold">Grenå IF U10/U11</p>
        </div>
      </button>

      {/* Højre side */}
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
