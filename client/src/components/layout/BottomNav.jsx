import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Trophy, Star, User, MoreHorizontal, BookOpen, Shield, X, Cpu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCupMode } from '../../hooks/useCupMode'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useAuth()
  const { active } = useCupMode()
  const [showMore, setShowMore] = useState(false)

  const isActive = (path) => location.pathname === path

  const baseBtn = (path) =>
    `flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
      isActive(path)
        ? active
          ? 'text-yellow-400 bg-blue-900/40'
          : 'text-primary bg-primary/10'
        : active
          ? 'text-blue-200'
          : 'text-gray-500'
    }`

  const navBg = active
    ? 'bg-cup-blue-dark border-t border-yellow-500/30'
    : 'bg-white border-t border-gray-100'

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMore(false)}
          />
        )}
      </AnimatePresence>

      {/* More menu panel */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-3xl shadow-2xl p-6 ${
              active ? 'bg-cup-blue-dark' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className={`font-black text-lg ${active ? 'text-white' : 'text-gray-800'}`}>Mere</h3>
              <button onClick={() => setShowMore(false)} className={`p-2 rounded-full ${active ? 'text-white' : 'text-gray-600'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MenuTile icon={<BookOpen size={22} />} label="Trænerens Hjørne" onClick={() => { navigate('/coach'); setShowMore(false) }} active={active} />
              <MenuTile
                icon={<span className="text-2xl">⚽</span>}
                label="Kattegat Cup"
                badge={!active ? 'SNART' : undefined}
                highlight={active}
                onClick={() => { navigate('/cup'); setShowMore(false) }}
                active={active}
              />
              {isAdmin && (
                <MenuTile icon={<Shield size={22} />} label="Admin" onClick={() => { navigate('/admin'); setShowMore(false) }} active={active} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 shadow-lg ${navBg}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        <div className="flex items-center justify-around py-2">
          <NavBtn path="/" icon="🏠" label="Hjem" onClick={() => navigate('/')} isActive={isActive('/')} active={active} />
          {isAdmin && (
            <NavBtn path="/spin" icon="🎡" label="Hjul" onClick={() => navigate('/spin')} isActive={isActive('/spin')} active={active} />
          )}
          <NavBtn path="/treasure" icon="💎" label="Skattekiste" onClick={() => navigate('/treasure')} isActive={isActive('/treasure')} active={active} />
          <NavBtn path="/team" icon="🌟" label="Hold" onClick={() => navigate('/team')} isActive={isActive('/team')} active={active} />
          <NavBtn path="/profile" icon="👤" label="Profil" onClick={() => navigate('/profile')} isActive={isActive('/profile')} active={active} />
          <button
            onClick={() => setShowMore(true)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
              active ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-bold">Mere</span>
          </button>
        </div>
      </nav>
    </>
  )
}

function NavBtn({ path, icon, label, onClick, isActive, active }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-2xl transition-all ${
        isActive
          ? active
            ? 'text-yellow-400 bg-blue-900/40'
            : 'text-primary bg-primary/10'
          : active
            ? 'text-blue-200'
            : 'text-gray-500'
      }`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </motion.button>
  )
}

function MenuTile({ icon, label, badge, highlight, onClick, active }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 ${
        highlight
          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
          : active
            ? 'bg-blue-800/40 border-blue-700/40 text-blue-200'
            : 'bg-gray-50 border-gray-200 text-gray-700'
      }`}
    >
      {badge && (
        <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {icon}
      <span className="text-xs font-bold text-center leading-tight">{label}</span>
    </motion.button>
  )
}
