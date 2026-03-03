import { motion } from 'framer-motion'

export default function Badge({ badge, earned = false, earnedAt, showName = true }) {
  const hasImage = badge?.imageUrl || badge?.image

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center gap-1 p-2 rounded-2xl ${
        earned ? 'bg-white shadow-md' : 'bg-gray-100'
      }`}
    >
      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden ${
        earned ? 'shadow-lg' : 'grayscale opacity-40'
      }`}>
        {hasImage ? (
          <img
            src={hasImage}
            alt={badge.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`w-full h-full bg-gradient-to-br from-accent to-primary-light flex items-center justify-center text-2xl ${hasImage ? 'hidden' : 'flex'}`}
        >
          {earned ? '⭐' : '❓'}
        </div>
        {!earned && (
          <div className="absolute inset-0 bg-gray-400/60 flex items-center justify-center rounded-2xl">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </div>
      {showName && (
        <span className={`text-[10px] font-bold text-center leading-tight max-w-[72px] ${
          earned ? 'text-gray-800' : 'text-gray-400'
        }`}>
          {earned ? (badge?.name || 'Badge') : '???'}
        </span>
      )}
      {earned && earnedAt && (
        <span className="text-[9px] text-gray-400 font-medium">
          {new Date(earnedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
        </span>
      )}
    </motion.div>
  )
}
