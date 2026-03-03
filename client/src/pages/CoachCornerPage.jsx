import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from '../api/axios'
import CoachCharacter from '../components/ui/CoachCharacter'

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function CoachCornerPage() {
  const [activeTab, setActiveTab] = useState('regel')
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent(activeTab)
  }, [activeTab])

  async function fetchContent(type) {
    setLoading(true)
    try {
      const res = await axios.get(`/content?type=${type}`)
      setContent(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const ruleIcons = ['⚽', '🟡', '🤝', '🛡️', '🦶']
  const factIcons = ['🏃', '🎂', '🌍', '⚡', '🏆']

  return (
    <div className="min-h-screen bg-green-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 px-4 pt-6 pb-8">
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-black text-white text-center mb-1">
          📚 Trænerens Hjørne
        </motion.h1>
        <p className="text-green-100 text-center text-sm">Lær mere om fodbold!</p>
      </div>

      {/* Coach karakter */}
      <div className="px-4 -mt-4">
        <CoachCharacter message={activeTab === 'regel' ? "Kend reglerne — det giver dig fordelen! 🧠" : "Fodbold er fyldt med sjove hemmeligheder! 🤩"} />
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-md">
          <button
            onClick={() => setActiveTab('regel')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'regel' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            ⚽ Regel-Galaksen
          </button>
          <button
            onClick={() => setActiveTab('fact')}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'fact' ? 'bg-green-600 text-white shadow-md' : 'text-gray-500'}`}
          >
            ⭐ Viden-Stjernerne
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.2 }}>
            {loading ? (
              <div className="flex justify-center py-12"><div className="text-4xl animate-spin">⚽</div></div>
            ) : content.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-bold">Intet indhold endnu</p>
              </div>
            ) : (
              <div className="space-y-4">
                {content.map((item, i) => (
                  <motion.div
                    key={item.content_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`bg-white rounded-2xl p-5 shadow-md border-l-4 ${activeTab === 'regel' ? 'border-green-500' : 'border-yellow-400'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{activeTab === 'regel' ? ruleIcons[i % ruleIcons.length] : factIcons[i % factIcons.length]}</span>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-800 text-lg mb-1">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.body_text}</p>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="mt-3 rounded-xl w-full object-cover max-h-40" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Overlay dekorationer */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {[1, 2].map(n => (
          <motion.div key={n} whileHover={{ scale: 1.03 }} className="rounded-2xl overflow-hidden shadow-md">
            <img src={`/assets/overlays/ag/ag_overlay_0${n}.png`} alt="" className="w-full h-32 object-cover" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
