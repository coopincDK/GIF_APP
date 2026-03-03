import { motion } from 'framer-motion'

export default function LoadingSpinner({ message = 'Indlæser...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        className="text-5xl"
      >
        ⚽
      </motion.div>
      <p className="text-primary font-bold text-lg">{message}</p>
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
