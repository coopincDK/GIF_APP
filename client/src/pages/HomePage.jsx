import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CoachCharacter from '../components/ui/CoachCharacter'
import StatsCard from '../components/ui/StatsCard'
import TaskCard from '../components/ui/TaskCard'
import CupCountdown from '../components/ui/CupCountdown'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCupMode } from '../hooks/useCupMode'
import { getMyTasks, completeTask, requestSwap, acceptSwap } from '../api/tasks'
import { getMyBadges } from '../api/badges'
import toast from 'react-hot-toast'

const WEEKDAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag']
const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

export default function HomePage() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { active } = useCupMode()
  const [tasks, setTasks] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const dateStr = `${WEEKDAYS[now.getDay()]} d. ${now.getDate()}. ${MONTHS[now.getMonth()]}`

  const loadData = async () => {
    try {
      const [tasksRes, badgesRes] = await Promise.all([getMyTasks(), getMyBadges()])
      setTasks(tasksRes.data || [])
      setBadges(badgesRes.data || [])
    } catch {
      // API ikke tilgængeligt endnu - vis demo data
      setTasks([])
      setBadges([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleComplete = async (id) => {
    try {
      await completeTask(id)
      toast.success('Opgave udført! 🎉')
      setTasks(t => t.map(x => x.id === id ? { ...x, status: 'completed' } : x))
    } catch { toast.error('Kunne ikke markere opgave') }
  }

  const handleSwap = async (id) => {
    try {
      await requestSwap(id)
      toast.success('Bytteforespørgsel sendt! 🔄')
      setTasks(t => t.map(x => x.id === id ? { ...x, status: 'swap_requested' } : x))
    } catch { toast.error('Kunne ikke sende bytteforespørgsel') }
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed')
  const swapTasks = tasks.filter(t => t.status === 'swap_requested' && t.assignedTo !== user?.id)

  if (loading) return <LoadingSpinner message="Henter data..." />

  return (
    <div>
      {/* Cup nedtælling banner */}
      {active && <CupCountdown />}

      {/* Hilsen */}
      <div className="px-4 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-black text-gray-900">
            Hej {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-500 font-semibold text-sm capitalize">{dateStr}</p>
        </motion.div>
      </div>

      {/* Coach karakter */}
      <CoachCharacter />

      {/* Stats */}
      <div className="px-4 grid grid-cols-3 gap-3 mt-2">
        <StatsCard icon="🏅" label="Badges" value={badges.length} color="text-accent" bgColor="bg-accent/10" />
        <StatsCard icon="✅" label="Opgaver" value={tasks.filter(t => t.status === 'completed').length} color="text-primary" bgColor="bg-primary/10" />
        <StatsCard icon="⚡" label="Aktive" value={activeTasks.length} color="text-orange-500" bgColor="bg-orange-50" />
      </div>

      {/* Swap muligheder */}
      {swapTasks.length > 0 && (
        <section className="px-4 mt-4">
          <h3 className="font-black text-orange-600 mb-2 flex items-center gap-2">
            🔄 Nogen vil bytte!
          </h3>
          <div className="space-y-2">
            {swapTasks.map(t => (
              <TaskCard key={t.id} task={t} onAcceptSwap={handleSwap} />
            ))}
          </div>
        </section>
      )}

      {/* Mine opgaver */}
      <section className="px-4 mt-4">
        <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
          📋 Mine opgaver
          {activeTasks.length > 0 && (
            <span className="bg-primary text-white text-xs font-black px-2 py-0.5 rounded-full">{activeTasks.length}</span>
          )}
        </h3>
        {activeTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-6 text-center shadow-sm"
          >
            <span className="text-4xl block mb-2">🎉</span>
            <p className="font-black text-gray-700">Ingen aktive opgaver!</p>
            <p className="text-gray-400 text-sm font-medium mt-1">Du er i topform! 💪</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map(t => (
              <TaskCard key={t.id} task={t} onComplete={handleComplete} onRequestSwap={handleSwap} />
            ))}
          </div>
        )}
      </section>

      {/* Hurtig navigation */}
      <section className="px-4 mt-6 pb-4">
        <h3 className="font-black text-gray-800 mb-3">🚀 Genveje</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💎', label: 'Min Skattekiste', path: '/treasure', color: 'from-amber-400 to-amber-600' },
            { icon: '🌟', label: 'Holdets Banner', path: '/team', color: 'from-primary to-primary-dark' },
            { icon: '📚', label: "Trænerens Hjørne", path: '/coach', color: 'from-blue-500 to-blue-700' },
            { icon: '🏆', label: 'Kattegat Cup', path: '/cup', color: active ? 'from-cup-blue to-cup-blue-dark' : 'from-gray-400 to-gray-600' },
          ].map(({ icon, label, path, color }) => (
            <motion.button
              key={path}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(path)}
              className={`bg-gradient-to-br ${color} text-white rounded-2xl p-4 text-left shadow-md`}
            >
              <span className="text-3xl block mb-1">{icon}</span>
              <span className="font-black text-sm">{label}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}
