import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getFeaturesFull, setFeature } from '../../api/features'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import toast from 'react-hot-toast'

const CATEGORY_LABELS = {
  core:     { emoji: '⚙️', label: 'Kerne-funktioner' },
  team:     { emoji: '👥', label: 'Hold & spillere'  },
  content:  { emoji: '📚', label: 'Indhold'           },
  schedule: { emoji: '📅', label: 'Kampprogram'       },
  cup:      { emoji: '🏆', label: 'Kattegat Cup'      },
}

function Toggle({ enabled, onChange, loading }) {
  return (
    <button
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        enabled ? 'bg-green-500' : 'bg-gray-300'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
        enabled ? 'translate-x-6' : 'translate-x-0'
      }`} />
    </button>
  )
}

export default function AdminFeaturesTab() {
  const [flags, setLocalFlags]   = useState([])
  const [loading, setLoading]    = useState(true)
  const [saving, setSaving]      = useState({})
  const { setFlags: setGlobalFlags } = useFeatureFlags()

  useEffect(() => {
    getFeaturesFull()
      .then(({ data }) => setLocalFlags(data || []))
      .catch(() => toast.error('Kunne ikke hente features'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async (key, newValue) => {
    setSaving(s => ({ ...s, [key]: true }))
    // Optimistisk update
    setLocalFlags(f => f.map(flag => flag.flag_key === key ? { ...flag, enabled: newValue ? 1 : 0 } : flag))
    setGlobalFlags(f => ({ ...f, [key]: newValue }))
    try {
      await setFeature(key, newValue)
      toast.success(`${newValue ? '✅' : '🔴'} ${newValue ? 'Aktiveret' : 'Deaktiveret'}`)
    } catch {
      // Rul tilbage
      setLocalFlags(f => f.map(flag => flag.flag_key === key ? { ...flag, enabled: newValue ? 0 : 1 } : flag))
      setGlobalFlags(f => ({ ...f, [key]: !newValue }))
      toast.error('Kunne ikke gemme ændring')
    } finally {
      setSaving(s => ({ ...s, [key]: false }))
    }
  }

  const handleAllOff = async () => {
    if (!window.confirm('Sluk ALLE features undtagen tøjvask-hjulet?')) return
    for (const flag of flags) {
      if (flag.flag_key !== 'spin_wheel' && flag.enabled) {
        await handleToggle(flag.flag_key, false)
      }
    }
    toast.success('🧺 Kun tøjvask-tilstand aktiveret!')
  }

  const handleAllOn = async () => {
    for (const flag of flags) {
      if (!flag.enabled) await handleToggle(flag.flag_key, true)
    }
    toast.success('✅ Alle features aktiveret!')
  }

  if (loading) return (
    <div className="py-12 text-center">
      <div className="text-3xl mb-2">🎛️</div>
      <p className="font-black text-gray-400">Henter features...</p>
    </div>
  )

  // Gruppér efter kategori
  const grouped = {}
  for (const flag of flags) {
    if (!grouped[flag.category]) grouped[flag.category] = []
    grouped[flag.category].push(flag)
  }

  const activeCount = flags.filter(f => f.enabled).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-5 text-white">
        <div className="text-3xl mb-1">🎛️</div>
        <h3 className="font-black text-xl">Feature Kontrol</h3>
        <p className="text-white/70 text-sm font-semibold mt-0.5">
          {activeCount} af {flags.length} features aktive
        </p>
        {/* Progress bar */}
        <div className="mt-3 bg-white/20 rounded-full h-2">
          <div
            className="bg-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(activeCount / flags.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Hurtig-knapper */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAllOn}
          className="bg-green-500 text-white font-black py-3 rounded-2xl text-sm shadow-sm">
          ✅ Tænd alle
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleAllOff}
          className="bg-orange-500 text-white font-black py-3 rounded-2xl text-sm shadow-sm">
          🧺 Kun tøjvask
        </motion.button>
      </div>

      {/* Features grupperet */}
      {Object.entries(grouped).map(([category, categoryFlags]) => {
        const cat = CATEGORY_LABELS[category] || { emoji: '⚙️', label: category }
        const allOn = categoryFlags.every(f => f.enabled)
        return (
          <div key={category} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            {/* Kategori-header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-black text-gray-700 text-sm">
                {cat.emoji} {cat.label}
              </h4>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                allOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {categoryFlags.filter(f => f.enabled).length}/{categoryFlags.length}
              </span>
            </div>
            {/* Flag-liste */}
            <div className="divide-y divide-gray-50">
              {categoryFlags.map((flag, i) => (
                <motion.div key={flag.flag_key}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${
                    !flag.enabled ? 'bg-gray-50/50' : ''
                  }`}>
                  <div className="flex-1 min-w-0 pr-3">
                    <p className={`font-black text-sm ${flag.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                      {flag.label}
                    </p>
                    {flag.description && (
                      <p className="text-gray-400 text-xs font-semibold mt-0.5 leading-tight">
                        {flag.description}
                      </p>
                    )}
                  </div>
                  <Toggle
                    enabled={flag.enabled === 1}
                    onChange={(val) => handleToggle(flag.flag_key, val)}
                    loading={!!saving[flag.flag_key]}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Info */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-blue-700 font-black text-sm">💡 Tip</p>
        <p className="text-blue-600 text-xs font-semibold mt-1 leading-relaxed">
          Ændringer træder i kraft med det samme for alle brugere.
          "Kun tøjvask" slukker alt undtagen hjulet — perfekt til en simpel session.
        </p>
      </div>
    </div>
  )
}
