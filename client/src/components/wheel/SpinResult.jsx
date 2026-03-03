import { motion } from 'framer-motion'
import { ArrowLeftRight, Save } from 'lucide-react'

const TASK_LABELS = ['Tøjvask 👕', 'Frugt 🍎', 'Kage 🎂']

export default function SpinResult({ assignments = [], onRequestSwap, onSave, swapRequests = [] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-black text-gray-800 text-lg text-center">📋 Ugens fordeling</h3>

      {assignments.map((a, i) => {
        const hasSwapRequest = swapRequests.includes(a?.userId)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className={`bg-white rounded-2xl p-4 shadow-md border-2 ${
              hasSwapRequest ? 'border-orange-300' : 'border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{['👕', '🍎', '🎂'][i]}</span>
                <div>
                  <p className="font-black text-gray-900 text-base">{a?.name || a?.username}</p>
                  <p className="text-sm text-gray-500 font-semibold">{TASK_LABELS[i]}</p>
                </div>
              </div>

              {hasSwapRequest ? (
                <span className="bg-orange-100 text-orange-600 text-xs font-black px-2 py-1 rounded-full">
                  Vil bytte!
                </span>
              ) : (
                onRequestSwap && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRequestSwap(i)}
                    className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-2 rounded-xl"
                  >
                    <ArrowLeftRight size={12} />
                    Bytte?
                  </motion.button>
                )
              )}
            </div>
          </motion.div>
        )
      })}

      {onSave && assignments.length > 0 && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSave}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-4 rounded-2xl text-lg shadow-lg mt-2"
        >
          <Save size={18} />
          Gem fordeling ✅
        </motion.button>
      )}
    </div>
  )
}
