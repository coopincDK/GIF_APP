import { motion } from 'framer-motion'

export default function StatsCard({ icon, label, value, color = 'text-primary', bgColor = 'bg-primary/10' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      className="bg-white rounded-2xl shadow-md p-4 flex flex-col items-center gap-1"
    >
      <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center text-2xl`}>
        {icon}
      </div>
      <span className={`text-2xl font-black ${color}`}>{value ?? '-'}</span>
      <span className="text-xs font-bold text-gray-500 text-center">{label}</span>
    </motion.div>
  )
}
