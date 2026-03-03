import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import SpinWheel from '../components/wheel/SpinWheel'
import SpinResult from '../components/wheel/SpinResult'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { getUsers } from '../api/users'
import { saveWheelResult, getLaundryCounts } from '../api/tasks'
import { getVolunteers } from '../api/volunteers'

// ── Hjælpe­funktioner ───────────────────────────────────────────────────────

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const laundryWeight = (count) => {
  if (count === 0) return 10
  if (count === 1) return 7
  if (count === 2) return 4
  return 1
}

const laundryBadge = (count) => {
  if (count === 0) return { emoji: '🟢', label: 'Aldrig', cls: 'bg-green-100 text-green-700' }
  if (count === 1) return { emoji: '🟡', label: '1x',    cls: 'bg-yellow-100 text-yellow-700' }
  if (count === 2) return { emoji: '🟠', label: '2x',    cls: 'bg-orange-100 text-orange-700' }
  return             { emoji: '🔴', label: '3x+',  cls: 'bg-red-100 text-red-700' }
}

// ── Konfetti (frivillig-skip animation) ─────────────────────────────────────

const CONFETTI_PIECES = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  emoji: ['🎉', '✨', '🧺', '⭐', '🎊', '💚'][i % 6],
  x: (Math.random() - 0.5) * 320,
  delay: Math.random() * 0.5,
  duration: 1.2 + Math.random() * 1,
}))

function Confetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {CONFETTI_PIECES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 text-2xl select-none"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
          animate={{ x: p.x, y: -260 - Math.random() * 80, opacity: 0, scale: 1.4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  )
}

// ── Hoved­komponent ──────────────────────────────────────────────────────────

export default function SpinWheelPage() {
  const navigate  = useNavigate()
  const { isAdmin } = useAuth()

  // ── Data ──
  const [allPlayers,    setAllPlayers]    = useState([])
  const [laundryCounts, setLaundryCounts] = useState({})   // { userId: count }
  const [volunteers,    setVolunteers]    = useState([])   // tøjvask-frivillige for dato

  // ── UI-state ──
  const [loading,     setLoading]     = useState(true)
  const [matchDate,   setMatchDate]   = useState(todayStr)
  const [selectedIds, setSelectedIds] = useState(new Set())
  // 'select' | 'wheel' | 'volunteer_skip'
  const [step, setStep] = useState('select')

  // ── Hjul-state ──
  const [wheelPlayers,   setWheelPlayers]   = useState([])
  const [skipVolunteer,  setSkipVolunteer]  = useState(null)  // scenario: præcis 1 frivillig
  const [multiVolMsg,    setMultiVolMsg]    = useState('')    // scenario: 2+ frivillige
  const [result,         setResult]         = useState([])
  const [swapRequests,   setSwapRequests]   = useState([])
  const [saving,         setSaving]         = useState(false)

  // ── Auth-guard ──
  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
  }, [isAdmin, navigate])

  // ── Hent spillere + vaske-tal ──
  useEffect(() => {
    if (!isAdmin) return
    Promise.allSettled([getUsers(), getLaundryCounts()])
      .then(([usersRes, countsRes]) => {
        const players = (usersRes.status === 'fulfilled' ? (usersRes.value.data || []) : [])
          .map(p => ({ ...p, id: p.id ?? p.user_id })) // normalisér id-felt
        setAllPlayers(players)
        setSelectedIds(new Set(players.map((p) => p.id)))

        // Counts kan komme som array [{ userId, count }] eller objekt { userId: count }
        if (countsRes.status === 'fulfilled') {
          const raw = countsRes.value.data
          if (Array.isArray(raw)) {
            const map = {}
            raw.forEach((r) => { map[r.user_id ?? r.userId ?? r.id] = r.laundry_count ?? r.count ?? 0 })
            setLaundryCounts(map)
          } else if (raw && typeof raw === 'object') {
            setLaundryCounts(raw)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [isAdmin])

  // ── Hent frivillige når dato ændres ──
  useEffect(() => {
    if (!matchDate) return
    getVolunteers(matchDate)
      .then(({ data }) => {
        const all = data || []
        // Filtrer tøjvask-frivillige
        const toj = all.filter(
          (v) => !v.task || v.task === 'tøjvask' || v.taskType === 'tøjvask'
        )
        setVolunteers(toj)
      })
      .catch(() => setVolunteers([]))
  }, [matchDate])

  // ── Hjælper: hent volunteer's userId ──
  const volUserId = (v) => v.userId ?? v.user?.id ?? v.id

  // ── Frivillige der ER valgt til kampen ──
  const activeVolunteers = useMemo(
    () => volunteers.filter((v) => selectedIds.has(volUserId(v))),
    [volunteers, selectedIds]
  )

  // ── Byg spillere med vægte ──
  const buildWeightedPlayers = (playerList) =>
    playerList.map((p) => ({
      ...p,
      weight: laundryWeight(laundryCounts[p.id] ?? 0),
    }))

  // ── Toggle spiller-chip ──
  const togglePlayer = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll   = () => setSelectedIds(new Set(allPlayers.map((p) => p.id)))
  const deselectAll = () => setSelectedIds(new Set())

  // ── Start Hjulet ──
  const handleStart = () => {
    const selected = allPlayers.filter((p) => selectedIds.has(p.id))
    if (selected.length < 2) {
      toast.error('Vælg mindst 2 spillere')
      return
    }

    const weighted = buildWeightedPlayers(selected)

    if (activeVolunteers.length === 0) {
      // Scenario 1: ingen frivillige → alle valgte på hjulet
      setWheelPlayers(weighted)
      setMultiVolMsg('')
      setStep('wheel')

    } else if (activeVolunteers.length === 1) {
      // Scenario 2: præcis 1 frivillig → skip hjulet
      const vid  = volUserId(activeVolunteers[0])
      const vol  = allPlayers.find((p) => p.id === vid)
      setSkipVolunteer(vol ?? { name: activeVolunteers[0].name, id: vid })
      setStep('volunteer_skip')

    } else {
      // Scenario 3: 2+ frivillige → kun dem på hjulet
      const volIds = new Set(activeVolunteers.map(volUserId))
      const volPlayers = selected.filter((p) => volIds.has(p.id))
      setWheelPlayers(buildWeightedPlayers(volPlayers))
      setMultiVolMsg(`🎉 ${activeVolunteers.length} spillere har meldt sig frivilligt! Lad hjulet afgøre…`)
      setStep('wheel')
    }

    setResult([])
    setSwapRequests([])
  }

  // ── Gem direkte (volunteer skip) ──
  const handleSaveSkip = async () => {
    if (!skipVolunteer) return
    setSaving(true)
    try {
      await saveWheelResult([{ userId: skipVolunteer.id, taskType: 'tøjvask' }])
      toast.success(`Tøjvask gemt til ${skipVolunteer.name || skipVolunteer.username}! ✅`)
      setStep('select')
      setSkipVolunteer(null)
    } catch {
      toast.error('Kunne ikke gemme')
    } finally {
      setSaving(false)
    }
  }

  // ── Gem hjul-resultat ──
  const handleSave = async () => {
    if (result.length === 0) return
    setSaving(true)
    try {
      await saveWheelResult([{ userId: result[0].id, taskType: 'tøjvask' }])
      toast.success('Tøjvask gemt! ✅')
      setResult([])
    } catch {
      toast.error('Kunne ikke gemme fordeling')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──
  if (loading) return <LoadingSpinner message="Henter spillere…" />

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="px-4 py-4 space-y-5 pb-8">

      {/* Header — altid synlig */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-black text-gray-900">🧺 Tøjvask-Hjulet</h1>
        <p className="text-gray-500 font-semibold mt-1">Hvem vasker tøjet denne uge?</p>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ────────────────── TRIN 1: VÆLG SPILLERE ───────────────────────── */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="space-y-4"
          >

            {/* Dato-vælger */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-black text-gray-700 mb-3 flex items-center gap-2">
                📅 Kampens dato
              </h3>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-sm focus:border-primary outline-none"
              />
              {volunteers.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-sm font-bold text-green-600"
                >
                  🙋 {activeVolunteers.length > 0
                    ? `${activeVolunteers.length} frivillig${activeVolunteers.length > 1 ? 'e' : ''} fundet til tøjvask!`
                    : `${volunteers.length} frivillig${volunteers.length > 1 ? 'e' : ''} for denne dato (ikke valgt til kamp)`}
                </motion.p>
              )}
            </div>

            {/* Spiller-chips */}
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-gray-700 flex items-center gap-2">
                  👥 Kampens spillere
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-full"
                  >
                    Alle
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1 rounded-full"
                  >
                    Ingen
                  </button>
                </div>
              </div>

              {/* Tæller */}
              <p className="text-xs font-black text-gray-400 mb-3">
                <span className={`${selectedIds.size < 2 ? 'text-red-500' : 'text-primary'}`}>
                  {selectedIds.size}
                </span>{' '}
                af {allPlayers.length} spillere valgt
              </p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                {allPlayers.map((p) => {
                  const isSelected = selectedIds.has(p.id)
                  const count      = laundryCounts[p.id] ?? 0
                  const badge      = laundryBadge(count)
                  const isVol      = volunteers.some((v) => volUserId(v) === p.id)

                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => togglePlayer(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-black transition-all border-2 ${
                        isSelected
                          ? 'bg-primary/15 border-primary text-primary shadow-sm'
                          : 'bg-gray-100 border-transparent text-gray-400'
                      }`}
                    >
                      {p.name || p.username}
                      {/* Frivillig-badge */}
                      {isVol && (
                        <span className="bg-green-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                          🙋
                        </span>
                      )}
                      {/* Tøjvask-count badge */}
                      {isSelected && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${badge.cls}`}>
                          {badge.emoji} {badge.label}
                        </span>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              {/* Vægt-forklaring */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[11px] font-black text-gray-400 mb-1.5">
                  ⚖️ Større segment = lavere sandsynlighed for tøjvask
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: '🟢', label: 'Aldrig vasket', weight: 10 },
                    { emoji: '🟡', label: '1 gang',        weight: 7 },
                    { emoji: '🟠', label: '2 gange',       weight: 4 },
                    { emoji: '🔴', label: '3+ gange',      weight: 1 },
                  ].map((b) => (
                    <span key={b.label} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
                      {b.emoji} {b.label} → vægt {b.weight}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Start-knap */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              disabled={selectedIds.size < 2}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                selectedIds.size < 2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white pulse-glow'
              }`}
            >
              ✅ Start Hjulet med {selectedIds.size} spillere
            </motion.button>
          </motion.div>
        )}

        {/* ────────────────── TRIN 2: FRIVILLIG SKIP ───────────────────────── */}
        {step === 'volunteer_skip' && skipVolunteer && (
          <motion.div
            key="volunteer_skip"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative space-y-4"
          >
            <Confetti />

            {/* Stor fejrings-kort */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-400 rounded-3xl p-6 text-center shadow-xl"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-6xl mb-3"
              >
                🧺
              </motion.div>
              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">
                Frivillig redder dagen!
              </p>
              <h2 className="text-2xl font-black text-gray-900 mb-1">
                {skipVolunteer.name || skipVolunteer.username}
              </h2>
              <p className="text-gray-600 font-bold">
                har meldt sig frivilligt til tøjvask! 🙌
              </p>
              <div className="mt-4 bg-white/70 rounded-2xl px-4 py-3 inline-block">
                <p className="text-sm font-black text-green-700">
                  Du slipper for hjulet denne uge! 🎉
                </p>
              </div>
            </motion.div>

            {/* Gem direkte */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveSkip}
              disabled={saving}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2"
            >
              {saving ? '⏳ Gemmer…' : `✅ Gem tøjvask til ${skipVolunteer.name || skipVolunteer.username}`}
            </motion.button>

            {/* Tilbage */}
            <button
              onClick={() => { setStep('select'); setSkipVolunteer(null) }}
              className="w-full bg-gray-100 text-gray-600 font-black py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              ← Fortryd — brug hjulet alligevel
            </button>
          </motion.div>
        )}

        {/* ────────────────── TRIN 3: HJULET ──────────────────────────────── */}
        {step === 'wheel' && (
          <motion.div
            key="wheel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="space-y-5"
          >
            {/* Tilbage + info-banner */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setStep('select'); setResult([]); setSwapRequests([]) }}
                className="bg-white border-2 border-gray-200 text-gray-600 font-black text-sm px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                ← Skift spillere
              </button>
              <div className="text-xs font-bold text-gray-500">
                {wheelPlayers.length} spiller{wheelPlayers.length !== 1 ? 'e' : ''} på hjulet
              </div>
            </div>

            {/* 2+ frivillige banner */}
            {multiVolMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl px-4 py-3 font-bold text-sm shadow-md"
              >
                {multiVolMsg}
              </motion.div>
            )}

            {/* Hjulet */}
            <div className="bg-white rounded-3xl shadow-xl p-5">
              <SpinWheel
                players={wheelPlayers}
                onResult={(winners) => {
                  setResult(winners)
                  setSwapRequests([])
                }}
              />
            </div>

            {/* Resultat + gem */}
            {result.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl p-5"
              >
                <SpinResult
                  assignments={result}
                  swapRequests={swapRequests}
                  onRequestSwap={(idx) => {
                    const user = result[idx]
                    if (!user) return
                    setSwapRequests((prev) => [...prev, user.id])
                    toast.success(`${user.name || user.username} vil bytte! 🔄`)
                  }}
                  onSave={saving ? undefined : handleSave}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
