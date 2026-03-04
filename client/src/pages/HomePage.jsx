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
import { useFeatureFlags } from '../hooks/useFeatureFlags'
import { getMyTasks, completeTask, requestSwap, acceptSwap } from '../api/tasks'
import { getMyBadges } from '../api/badges'
import toast from 'react-hot-toast'
import WeeklyAwardsDisplay from '../components/ui/WeeklyAwardsDisplay'
import VolunteerBoard from '../components/ui/VolunteerBoard'
import DailyFact from '../components/ui/DailyFact'
import SuperligaWidget from '../components/ui/SuperligaWidget'
import UpcomingMatch from '../components/ui/UpcomingMatch'

const WEEKDAYS = ['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag']
const MONTHS = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']

const MOTIVATIONS = [
  'Klar til at smadre det i dag? ⚽',
  'Lad os give den fuld gas! 💪',
  'Holdet regner med dig! 🔥',
  'Mega fedt du er med! 🥳',
  'Vis hvad du er lavet af! ⚡',
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const { active } = useCupMode()
  const { flags } = useFeatureFlags()
  const [tasks, setTasks] = useState([])
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const dateStr = `${WEEKDAYS[now.getDay()]} d. ${now.getDate()}. ${MONTHS[now.getMonth()]}`
  const motivation = MOTIVATIONS[now.getDay() % MOTIVATIONS.length]

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

  const handleAcceptSwap = async (id) => {
    try {
      await acceptSwap(id)
      toast.success('Du har overtaget opgaven! 💪')
      // Fjern opgaven fra swap-listen og genindlæs
      setTasks(t => t.filter(x => x.id !== id))
      loadData()
    } catch (e) { toast.error(e?.response?.data?.error || 'Kunne ikke overtage opgaven') }
  }

  const myTasks     = tasks.filter(t => t.assigned_to === user?.user_id && !t.completion_date)
  const activeTasks  = myTasks.filter(t => t.status !== 'completed')
  // Swap-opgaver = opgaver fra ANDRE der har tilbudt bytte
  const swapTasks    = tasks.filter(t => t.is_swap_offered && t.assigned_to !== user?.user_id && !t.completion_date)
  const completedCount = tasks.filter(t => t.completion_date).length

  if (loading) return <LoadingSpinner message="Henter data..." />

  return (
    <div className="pb-32">
      {/* Cup nedtælling banner */}
      {active && <CupCountdown />}

      {/* ── Hero-sektion ── */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`mx-4 mt-4 rounded-3xl p-5 shadow-xl ${
          active
            ? 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900'
            : 'bg-gradient-to-br from-primary via-primary-light to-emerald-400'
        }`}
      >
        {/* Dato-chip */}
        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 ${
          active ? 'bg-yellow-400/20 text-yellow-300' : 'bg-white/20 text-white/80'
        }`}>
          📅 {dateStr}
        </span>

        {/* Velkomst */}
        <h2 className="text-3xl font-black text-white leading-tight">
          Hej {user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className={`text-base font-bold mt-1 ${active ? 'text-blue-200' : 'text-white/90'}`}>
          {motivation}
        </p>

        {/* Mini stats-bar i hero */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2 text-center">
            <p className="text-2xl font-black text-white">{badges.length}</p>
            <p className={`text-[11px] font-bold ${active ? 'text-blue-200' : 'text-white/70'}`}>🏅 Badges</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2 text-center">
            <p className="text-2xl font-black text-white">{completedCount}</p>
            <p className={`text-[11px] font-bold ${active ? 'text-blue-200' : 'text-white/70'}`}>✅ Udført</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2 text-center">
            <p className="text-2xl font-black text-white">{activeTasks.length}</p>
            <p className={`text-[11px] font-bold ${active ? 'text-blue-200' : 'text-white/70'}`}>⚡ Aktive</p>
          </div>
        </div>
      </motion.div>

      {/* Coach karakter */}
      <CoachCharacter />

      {/* Næste kamp/træning */}
      {flags.upcoming_match && <UpcomingMatch />}

      {/* Swap muligheder */}
      {flags.task_swap && swapTasks.length > 0 && (
        <section className="px-4 mt-4">
          <h3 className="font-black text-orange-600 mb-2 flex items-center gap-2">
            🔄 Nogen vil bytte!
          </h3>
          <div className="space-y-2">
            {swapTasks.map(t => (
              <TaskCard key={t.id} task={t} onAcceptSwap={handleAcceptSwap} />
            ))}
          </div>
        </section>
      )}

      {/* Mine opgaver */}
      <section className="px-4 mt-7">
        <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 text-lg">
          📋 Mine opgaver
          {activeTasks.length > 0 && (
            <span className="bg-primary text-white text-xs font-black px-2.5 py-1 rounded-full">{activeTasks.length}</span>
          )}
        </h3>
        {activeTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-6 text-center shadow-md border border-green-100"
          >
            <span className="text-5xl block mb-2">🎉</span>
            <p className="font-black text-gray-700 text-lg">Ingen aktive opgaver!</p>
            <p className="text-gray-400 text-sm font-bold mt-1">Du er i topform! 💪</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map(t => (
              <TaskCard key={t.id} task={t} onComplete={handleComplete} onRequestSwap={flags.task_swap ? handleSwap : undefined} />
            ))}
          </div>
        )}
      </section>

      {/* Dagens Fact */}
      {flags.daily_fact && <DailyFact />}

      {/* Superliga */}
      {flags.superliga_widget && <SuperligaWidget />}

      {/* Ugens Helte */}
      {flags.weekly_awards && <WeeklyAwardsDisplay />}

      {/* Frivillig-board */}
      {flags.volunteer_board && <VolunteerBoard />}

      {/* Hurtig navigation */}
      <section className="px-4 mt-8 mb-4">
        <h3 className="font-black text-gray-800 mb-4 text-lg">🚀 Genveje</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '💎', label: 'Min Skattekiste', sub: 'Dine badges', path: '/treasure', color: 'from-amber-400 to-orange-500' },
            { icon: '🌟', label: 'Holdets Banner', sub: 'Se holdet', path: '/team', color: 'from-primary to-green-600' },
            { icon: '📚', label: 'Trænerens Hjørne', sub: 'Regler & facts', path: '/coach', color: 'from-blue-500 to-indigo-600' },
            { icon: '🏆', label: 'Kattegat Cup', sub: active ? 'I GANG! 🔥' : 'Kommer snart', path: '/cup', color: active ? 'from-yellow-500 to-orange-600' : 'from-gray-400 to-gray-500' },
          ].map(({ icon, label, sub, path, color }) => (
            <motion.button
              key={path}
              whileTap={{ scale: 0.93 }}
              onClick={() => navigate(path)}
              className={`bg-gradient-to-br ${color} text-white rounded-3xl p-5 flex flex-col items-center text-center shadow-lg`}
            >
              <span className="text-4xl mb-2">{icon}</span>
              <span className="font-black text-sm leading-tight">{label}</span>
              <span className="text-white/70 text-[11px] font-semibold mt-1">{sub}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  )
}
