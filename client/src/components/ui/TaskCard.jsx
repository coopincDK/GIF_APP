import { motion } from 'framer-motion'
import { CheckCircle, Clock, ArrowLeftRight } from 'lucide-react'

const TASK_ICONS = {
  tøjvask: '👕',
  frugt: '🍎',
  kage: '🎂',
  default: '📋',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  active: 'bg-green-50 border-green-200 text-green-700',
  completed: 'bg-gray-50 border-gray-200 text-gray-500',
  swap_requested: 'bg-orange-50 border-orange-200 text-orange-700',
}

export default function TaskCard({ task, onComplete, onRequestSwap, onAcceptSwap, isAdmin }) {
  const icon = TASK_ICONS[task?.type?.toLowerCase()] || TASK_ICONS.default
  const statusColor = STATUS_COLORS[task?.status] || STATUS_COLORS.active

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl shadow-md p-4 border-2 ${statusColor} relative overflow-hidden`}
    >
      {task?.status === 'swap_requested' && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl">
          BYTTE!
        </div>
      )}

      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none mt-1">{icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 text-base">{task?.title || 'Opgave'}</h3>
          <p className="text-gray-600 text-sm font-medium mt-0.5">{task?.description}</p>
          {task?.dueDate && (
            <div className="flex items-center gap-1 mt-2 text-gray-500">
              <Clock size={12} />
              <span className="text-xs font-semibold">
                {new Date(task.dueDate).toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {task?.status !== 'completed' && (
        <div className="flex gap-2 mt-3">
          {onComplete && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onComplete(task.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2 px-3 rounded-xl text-sm"
            >
              <CheckCircle size={14} />
              Udført!
            </motion.button>
          )}
          {onRequestSwap && task?.status !== 'swap_requested' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onRequestSwap(task.id)}
              className="flex items-center justify-center gap-1 bg-orange-100 text-orange-700 font-bold py-2 px-3 rounded-xl text-sm"
            >
              <ArrowLeftRight size={14} />
              Bytte?
            </motion.button>
          )}
          {onAcceptSwap && task?.status === 'swap_requested' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onAcceptSwap(task.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-2 px-3 rounded-xl text-sm"
            >
              <ArrowLeftRight size={14} />
              Jeg tager den!
            </motion.button>
          )}
        </div>
      )}

      {task?.status === 'completed' && (
        <div className="flex items-center gap-2 mt-2 text-green-600">
          <CheckCircle size={16} />
          <span className="text-sm font-bold">Udført! 🎉</span>
        </div>
      )}
    </motion.div>
  )
}
