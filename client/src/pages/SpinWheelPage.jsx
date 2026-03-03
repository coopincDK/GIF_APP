import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import SpinWheel from '../components/wheel/SpinWheel'
import SpinResult from '../components/wheel/SpinResult'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { getUsers } from '../api/users'
import { saveWheelResult } from '../api/tasks'

export default function SpinWheelPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState([])
  const [swapRequests, setSwapRequests] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    getUsers()
      .then(({ data }) => setPlayers(data || []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false))
  }, [isAdmin, navigate])

  const handleResult = (winners) => {
    setResult(winners)
    setSwapRequests([])
  }

  const handleSwapRequest = (idx) => {
    const user = result[idx]
    if (!user) return
    setSwapRequests(prev => [...prev, user.id])
    toast.success(`${user.name || user.username} vil bytte! 🔄`)
  }

  const handleSave = async () => {
    if (result.length === 0) return
    setSaving(true)
    try {
      const assignments = result.map((u, i) => ({
        userId: u.id,
        taskType: ['tøjvask', 'frugt', 'kage'][i],
      }))
      await saveWheelResult(assignments)
      toast.success('Fordeling gemt! ✅')
      setResult([])
    } catch {
      toast.error('Kunne ikke gemme fordeling')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner message="Henter spillere..." />

  return (
    <div>
      <div className="px-4 py-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-black text-gray-900">🎡 Opgave-Hjulet</h1>
          <p className="text-gray-500 font-semibold mt-1">Spin og find ugens helte!</p>
        </motion.div>

        {/* Hjul */}
        <div className="bg-white rounded-3xl shadow-xl p-5">
          <SpinWheel players={players} onResult={handleResult} />
        </div>

        {/* Resultat */}
        {result.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-5"
          >
            <SpinResult
              assignments={result}
              swapRequests={swapRequests}
              onRequestSwap={handleSwapRequest}
              onSave={handleSave}
            />
          </motion.div>
        )}

        {/* Spillere liste */}
        <div className="bg-white rounded-3xl shadow-md p-4">
          <h3 className="font-black text-gray-700 mb-3">👥 Spillere på holdet ({players.length})</h3>
          <div className="flex flex-wrap gap-2">
            {players.map((p, i) => (
              <span key={i} className="bg-primary/10 text-primary font-bold text-xs px-3 py-1.5 rounded-full">
                {p.name || p.username}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
