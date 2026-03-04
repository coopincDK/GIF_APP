import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Link as LinkIcon, Award, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ui/ConfirmModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { InlineSpinner } from '../components/ui/LoadingSpinner'
import { useAuth } from '../hooks/useAuth'
import { useCupMode } from '../hooks/useCupMode'
import {
  getSettings, setCupModeOverride,
  getAdminUsers, deleteAdminUser, generateInviteLink,
  getAdminTasks, createAdminTask, deleteAdminTask,
  getAdminBadges, awardBadgeToUser,
  getAdminShifts, createAdminShift, deleteAdminShift,
} from '../api/admin'
import { getRules, getFacts, createRule, deleteRule, createFact, deleteFact } from '../api/content'
import { getUsers } from '../api/users'
import { getWeekAwards, createAward, deleteAward } from '../api/awards'
import AdminNotesTab from './admin/AdminNotesTab'
import AdminHistoryTab from './admin/AdminHistoryTab'
import AdminGuideTab from './admin/AdminGuideTab'
import AdminFeaturesTab from './admin/AdminFeaturesTab'

const TABS = [
  { id: 'settings', label: '⚙️ Indstillinger' },
  { id: 'users', label: '👥 Brugere' },
  { id: 'tasks', label: '📋 Opgaver' },
  { id: 'badges', label: '🏅 Badges' },
  { id: 'shifts', label: '🏆 Cup-Vagter' },
  { id: 'content', label: '📚 Indhold' },
  { id: 'notes', label: '📝 Kladde' },
  { id: 'history', label: '📊 Historik' },
  { id: 'guide', label: '📖 Guide' },
  { id: 'features', label: '🎛️ Features' },
]

// ─── Cup-Mode Override Selector ───────────────────────────────────────────────
const OVERRIDE_OPTIONS = [
  {
    value: 'off',
    label: 'Slukket',
    emoji: '🔴',
    desc: 'Cup-mode er aldrig aktiv',
    btnClass: 'border-red-400 text-red-600 bg-red-50',
    activeBtnClass: 'bg-red-500 text-white border-red-500 shadow-lg scale-105',
  },
  {
    value: 'auto',
    label: 'Automatisk',
    emoji: '🟡',
    desc: 'Aktiveres 4 uger før Cup',
    btnClass: 'border-yellow-400 text-yellow-700 bg-yellow-50',
    activeBtnClass: 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-lg scale-105',
  },
  {
    value: 'on',
    label: 'Tændt',
    emoji: '🟢',
    desc: 'Cup-mode altid aktiv',
    btnClass: 'border-green-400 text-green-700 bg-green-50',
    activeBtnClass: 'bg-green-500 text-white border-green-500 shadow-lg scale-105',
  },
]

function CupModeControl() {
  const { override, active, autoActivateDate, refreshStatus } = useCupMode()
  const [currentOverride, setCurrentOverride] = useState(override)
  const [saving, setSaving] = useState(false)

  // Synk med context når override ændres udefra
  useEffect(() => { setCurrentOverride(override) }, [override])

  const handleSet = async (value) => {
    if (value === currentOverride) return
    setSaving(true)
    try {
      await setCupModeOverride(value)
      setCurrentOverride(value)
      // Opdater context øjeblikkeligt + refresh
      await refreshStatus(value)
      const labels = { on: 'tændt 🏆', off: 'slukket 🔴', auto: 'automatisk 🟡' }
      toast.success(`Cup-Mode er nu ${labels[value]}!`, { duration: 4000 })
    } catch {
      toast.error('Kunne ikke opdatere Cup-Mode')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Manuelt aktiveret banner */}
      <AnimatePresence>
        {currentOverride === 'on' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="cup-gradient rounded-2xl p-4 flex items-center gap-3 border border-yellow-500/40"
          >
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-yellow-300 font-black text-sm">Cup-Mode er MANUELT aktiveret!</p>
              <p className="text-white/70 text-xs font-semibold">Hele appen viser nu Cup-tema</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status card */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Aktuel status</p>
            <p className="font-black text-gray-900 text-base">
              {active ? '🟢 Cup-Mode ER aktiv' : '⚫ Cup-Mode er IKKE aktiv'}
            </p>
            <p className="text-xs text-gray-400 font-semibold mt-0.5">
              Override: <span className="text-gray-700 font-black">{currentOverride.toUpperCase()}</span>
            </p>
          </div>
          {saving && <InlineSpinner size={20} />}
        </div>
      </div>

      {/* 3-knaps toggle */}
      <div>
        <p className="font-black text-gray-700 text-sm mb-3">Vælg tilstand:</p>
        <div className="flex gap-2">
          {OVERRIDE_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSet(opt.value)}
              disabled={saving}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 font-black text-sm transition-all duration-200 ${
                currentOverride === opt.value ? opt.activeBtnClass : opt.btnClass
              }`}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span className="text-xs">{opt.label}</span>
            </motion.button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 font-semibold mt-2">
          {OVERRIDE_OPTIONS.find(o => o.value === currentOverride)?.desc}
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <p className="text-blue-800 font-black text-xs mb-1">ℹ️ Om Auto-mode</p>
        <p className="text-blue-700 text-xs font-semibold leading-relaxed">
          Auto aktiveres automatisk <strong>{autoActivateDate?.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</strong> (4 uger før Kattegat Cup 23. juli 2026).
          Appen opdaterer status hvert 30. sekund.
        </p>
      </div>
    </div>
  )
}

// ─── Brugere Tab ──────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    getAdminUsers()
      .then(({ data }) => setUsers(data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    try {
      await deleteAdminUser(deleteTarget)
      setUsers(u => u.filter(x => x.id !== deleteTarget))
      toast.success('Bruger slettet')
    } catch { toast.error('Kunne ikke slette bruger') }
    setDeleteTarget(null)
  }

  const handleInvite = async () => {
    try {
      const { data } = await generateInviteLink({ teamId: 1 })
      const link = `${window.location.origin}/register?token=${data.token}`
      setInviteLink(link)
      navigator.clipboard?.writeText(link)
      toast.success('Invite-link kopieret! 📋')
    } catch { toast.error('Kunne ikke generere link') }
  }

  if (loading) return <div className="py-6 text-center"><InlineSpinner size={24} /></div>

  return (
    <div className="space-y-4">
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleInvite}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-black py-3 rounded-2xl shadow-md">
        <LinkIcon size={16} /> Generer invite-link
      </motion.button>
      {inviteLink && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3">
          <p className="text-green-700 text-xs font-bold break-all">{inviteLink}</p>
        </div>
      )}
      <ConfirmModal open={!!deleteTarget} title="Slet bruger?" message="Brugeren slettes permanent."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
      {users.map(u => (
        <div key={u.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{u.name}</p>
            <p className="text-gray-400 text-xs font-semibold">{u.email} · {u.role}</p>
          </div>
          <button onClick={() => setDeleteTarget(u.id)} className="text-red-400 p-2">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      {users.length === 0 && <p className="text-center text-gray-400 font-semibold py-6">Ingen brugere endnu</p>}
    </div>
  )
}

// ─── Opgaver Tab ──────────────────────────────────────────────────────────────
function TasksTab() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({ title: '', description: '', type: 'tøjvask' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    getAdminTasks()
      .then(({ data }) => setTasks(data || []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newTask.title) { toast.error('Skriv en titel'); return }
    try {
      const { data } = await createAdminTask(newTask)
      setTasks(t => [...t, data])
      setNewTask({ title: '', description: '', type: 'tøjvask' })
      toast.success('Opgave oprettet! ✅')
    } catch { toast.error('Kunne ikke oprette opgave') }
  }

  const handleDelete = async () => {
    try {
      await deleteAdminTask(deleteTarget)
      setTasks(t => t.filter(x => x.id !== deleteTarget))
      toast.success('Opgave slettet')
    } catch { toast.error('Fejl') }
    setDeleteTarget(null)
  }

  if (loading) return <div className="py-6 text-center"><InlineSpinner size={24} /></div>

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!deleteTarget} title="Slet opgave?" message="Opgaven slettes permanent."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h4 className="font-black text-gray-700">Opret opgave</h4>
        <input placeholder="Titel" value={newTask.title}
          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        <input placeholder="Beskrivelse" value={newTask.description}
          onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        <select value={newTask.type} onChange={e => setNewTask({ ...newTask, type: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm">
          <option value="tøjvask">👕 Tøjvask</option>
          <option value="frugt">🍎 Frugt</option>
          <option value="kage">🎂 Kage</option>
          <option value="other">📋 Andet</option>
        </select>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
          className="w-full bg-primary text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
          <Plus size={16} /> Opret opgave
        </motion.button>
      </div>
      {tasks.map(t => (
        <div key={t.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="font-black text-gray-900">{t.title}</p>
            <p className="text-gray-400 text-xs font-semibold">{t.type} · {t.status}</p>
          </div>
          <button onClick={() => setDeleteTarget(t.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

// Alle award-kategorier med sticker-billeder
const AWARD_CATEGORIES = [
  { key: 'mvp',        emoji: '🏆', label: 'Ugens MVP',         desc: 'Kampens allerbedste spiller',          stickerImg: '/assets/stickers/27_medalje.png' },
  { key: 'fighter',   emoji: '⚔️', label: 'Ugens Fighter',     desc: 'Kæmpede hårdest på banen',              stickerImg: '/assets/stickers/15_ild_fart.png' },
  { key: 'udvikling', emoji: '📈', label: 'Ugens Udvikling',   desc: 'Viste størst fremgang',                 stickerImg: '/assets/stickers/12_stjaerne_oejne.png' },
  { key: 'holdaand',  emoji: '🤝', label: 'Ugens Holdspiller', desc: 'Bedste holdspiller',                   stickerImg: '/assets/stickers/18_hold_kram.png' },
  { key: 'humor',     emoji: '😄', label: 'Ugens Humor',       desc: 'Holdt humøret oppe',                   stickerImg: '/assets/stickers/11_thumbs_up.png' },
  { key: 'energi',    emoji: '💪', label: 'Ugens Energi',      desc: 'Mest energi og engagement',            stickerImg: '/assets/stickers/10_vandflasker.png' },
  { key: 'fokus',     emoji: '🎯', label: 'Ugens Fokus',       desc: 'Bedst koncentration og fokus',         stickerImg: '/assets/stickers/14_taenker.png' },
  { key: 'aflevering',emoji: '🎯', label: 'Ugens Aflevering',  desc: 'Præciseste afleveringer',               stickerImg: '/assets/stickers/28_hjoernespark.png' },
  { key: 'assist',    emoji: '🤜', label: 'Ugens Assist',      desc: 'Flest assists eller bedste oplæg',     stickerImg: '/assets/stickers/04_high_five.png' },
  { key: 'skud',      emoji: '🔥', label: 'Ugens Skud',        desc: 'Farligste skud på mål',                stickerImg: '/assets/stickers/01_spiller_spark.png' },
  { key: 'dribbling', emoji: '🌀', label: 'Ugens Dribbling',   desc: 'Flotteste driblinger',                 stickerImg: '/assets/stickers/05_fodbold.png' },
  { key: 'forsvar',   emoji: '🛡️', label: 'Ugens Forsvar',     desc: 'Bedste defensive indsats',             stickerImg: '/assets/stickers/09_fodboldmaal.png' },
  { key: 'keeper',    emoji: '🧄', label: 'Ugens Redning',     desc: 'Bedste redning eller keeperspil',      stickerImg: '/assets/stickers/02_keeper_redning.png' },
  { key: 'sprint',    emoji: '🏃', label: 'Ugens Sprint',      desc: 'Hurtigste spiller på banen',           stickerImg: '/assets/stickers/13_sved_traening.png' },
  { key: 'ros',       emoji: '⭐', label: 'Ugens Ros',         desc: 'Fortjener ekstra ros denne uge',       stickerImg: '/assets/stickers/24_nummer_et.png' },
  { key: 'kommentar', emoji: '💬', label: 'Ugens Kommentar',   desc: 'Bedste kommentar til holdet',          stickerImg: '/assets/stickers/30_klap_haender.png' },
  { key: 'soveste',   emoji: '😴', label: 'Ugens Soveste',     desc: 'Var lidt i drømmeland 😄',            stickerImg: '/assets/stickers/14_taenker.png' },
  { key: 'fremmøde',  emoji: '📅', label: 'Ugens Fremmøde',    desc: 'Aldrig udeblevet — altid klar!',       stickerImg: '/assets/stickers/20_kegler.png' },
  { key: 'attitude',  emoji: '😎', label: 'Ugens Attitude',    desc: 'Bedste indstilling og attitude',       stickerImg: '/assets/stickers/11_thumbs_up.png' },
  { key: 'leder',     emoji: '👑', label: 'Ugens Leder',       desc: 'Naturlig leder på banen',              stickerImg: '/assets/stickers/07_guldpokal.png' },
  { key: 'opmuntrer', emoji: '📣', label: 'Ugens Opmuntrer',   desc: 'Opmuntrede og heppede på holdet',      stickerImg: '/assets/stickers/30_klap_haender.png' },
  { key: 'kreativ',   emoji: '🎨', label: 'Ugens Kreative',    desc: 'Mest kreative spil og løsninger',      stickerImg: '/assets/stickers/12_stjaerne_oejne.png' },
  { key: 'jubel',     emoji: '🎉', label: 'Ugens Jubel',       desc: 'Fejrede mest og bedst',                stickerImg: '/assets/stickers/03_maal_jubel.png' },
  { key: 'bold',      emoji: '⚽', label: 'Ugens Boldmester',  desc: 'Bedst til at holde bolden',            stickerImg: '/assets/stickers/05_fodbold.png' },
  { key: 'heading',   emoji: '🧠', label: 'Ugens Heading',     desc: 'Bedste hovedstød',                      stickerImg: '/assets/stickers/06_fodboldstovle.png' },
  { key: 'faldgruppe',emoji: '🤦', label: 'Ugens Faldgruppe',  desc: 'Faldt flest gange... men rejste sig!', stickerImg: '/assets/stickers/08_floejte.png' },
  { key: 'madpakke',  emoji: '🥪', label: 'Ugens Madpakke',    desc: 'Bedste madpakke til træning',           stickerImg: '/assets/stickers/17_frugtskaal.png' },
  { key: 'trøje',     emoji: '👕', label: 'Ugens Trøje',       desc: 'Flotteste/sjoveste trøje',              stickerImg: '/assets/stickers/16_vaskemaskine.png' },
]

function getISOWeek(date) {
  const d = new Date(date); d.setHours(0,0,0,0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const w1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7)
}

function getWeekLabel(week, year) {
  const jan4 = new Date(year, 0, 4)
  const dow = (jan4.getDay() + 6) % 7
  const mon = new Date(jan4); mon.setDate(jan4.getDate() - dow + (week - 1) * 7)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = d => d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

// ─── Badges Tab ───────────────────────────────────────────────────────────────
function BadgesTab() {
  const now = new Date()
  const curWeek = getISOWeek(now)
  const curYear = now.getFullYear()
  const [week, setWeek]       = useState(curWeek)
  const [year, setYear]       = useState(curYear)
  const [awards, setAwards]   = useState([])
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState({})
  const [openCat, setOpenCat] = useState(null)
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    getUsers().then(r => setUsers(r.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    getWeekAwards(week, year)
      .then(r => setAwards(Array.isArray(r.data) ? r.data : (r.data?.awards || [])))
      .catch(() => setAwards([]))
      .finally(() => setLoading(false))
  }, [week, year])

  const awardFor = cat => awards.find(a => a.category === cat)

  const handleAssign = async (category, userId) => {
    setSaving(s => ({ ...s, [category]: true }))
    try {
      const res = await createAward({ user_id: userId, category, week_number: week, year })
      // Backend returnerer { message, award } — udtræk award-objektet
      const newAward = res.data?.award || res.data
      setAwards(prev => [...prev.filter(a => a.category !== category), newAward])
      const cat = AWARD_CATEGORIES.find(c => c.key === category)
      setCelebration({ message: `${cat?.emoji} ${cat?.label} tildelt!`, stickerImg: cat?.stickerImg })
      setOpenCat(null)
    } catch (e) { toast.error(e?.response?.data?.error || 'Fejl') }
    finally { setSaving(s => ({ ...s, [category]: false })) }
  }

  const handleRemove = async (category) => {
    const award = awardFor(category)
    if (!award) return
    setSaving(s => ({ ...s, [category]: true }))
    try {
      await deleteAward(award.award_id)
      setAwards(prev => prev.filter(a => a.category !== category))
      toast.success('Fjernet')
    } catch { toast.error('Fejl') }
    finally { setSaving(s => ({ ...s, [category]: false })) }
  }

  const isPast   = year < curYear || (year === curYear && week < curWeek)
  const isFuture = year > curYear || (year === curYear && week > curWeek)

  return (
    <div className="space-y-4">

      {/* Konfetti-fejring */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setCelebration(null)}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl border-4 border-primary"
              onClick={e => e.stopPropagation()}
            >
              {celebration.stickerImg && (
                <motion.img src={celebration.stickerImg} alt=""
                  animate={{ rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.7 }}
                  className="w-24 h-24 object-contain mx-auto mb-3"
                />
              )}
              <p className="font-black text-2xl text-gray-900 mb-1">{celebration.message}</p>
              <p className="text-gray-400 text-sm font-semibold">Uge {week} • {year}</p>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCelebration(null)}
                className="mt-4 bg-primary text-white font-black px-6 py-2 rounded-xl">
                Fedt! 🎉
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uge-navigator */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-1">
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => week === 1 ? (setWeek(52), setYear(y => y-1)) : setWeek(w => w-1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-600 text-xl">
            ‹
          </motion.button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <span className="font-black text-gray-900">Uge {week}</span>
              {week === curWeek && year === curYear && <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">DENNE UGE</span>}
              {isPast   && <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full">HISTORISK</span>}
              {isFuture && <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">PLANLAGT</span>}
            </div>
            <p className="text-gray-400 text-xs font-semibold mt-0.5">{getWeekLabel(week, year)}</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => week === 52 ? (setWeek(1), setYear(y => y+1)) : setWeek(w => w+1)}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-600 text-xl">
            ›
          </motion.button>
        </div>
        {(week !== curWeek || year !== curYear) && (
          <button onClick={() => { setWeek(curWeek); setYear(curYear) }}
            className="w-full mt-2 text-primary font-black text-xs py-1.5 bg-primary/5 rounded-xl">
            → Gå til denne uge
          </button>
        )}
      </div>

      {/* Progress-bar */}
      <div className="flex items-center gap-3 px-1">
        <p className="font-black text-gray-700 text-sm whitespace-nowrap">{awards.length}/{AWARD_CATEGORIES.length}</p>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${(awards.length / AWARD_CATEGORIES.length) * 100}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-400">{Math.round((awards.length / AWARD_CATEGORIES.length) * 100)}%</span>
      </div>

      {/* Kategori-liste */}
      {loading ? <div className="py-10 flex justify-center"><InlineSpinner size={28} /></div> : (
        <div className="space-y-2">
          {AWARD_CATEGORIES.map(cat => {
            const award = awardFor(cat.key)
            const isOpen = openCat === cat.key
            const isSav  = saving[cat.key]
            return (
              <motion.div key={cat.key}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-2 transition-colors ${
                  award ? 'border-primary/40' : 'border-transparent'
                }`}>
                <button onClick={() => setOpenCat(isOpen ? null : cat.key)}
                  className="w-full flex items-center gap-3 p-3 text-left">
                  <img src={cat.stickerImg} alt="" className="w-10 h-10 object-contain flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-sm">{cat.label}</p>
                    {award
                      ? <p className="text-primary text-xs font-black">✅ {award.user_name}</p>
                      : <p className="text-gray-400 text-xs font-semibold truncate">{cat.desc}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {award && (
                      <button onClick={e => { e.stopPropagation(); handleRemove(cat.key) }}
                        className="text-red-400 p-1 rounded-lg">
                        <Trash2 size={13} />
                      </button>
                    )}
                    <span className={`text-gray-400 font-black text-lg transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>+</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-3 pb-3 border-t border-gray-50">
                        <p className="text-xs font-black text-gray-500 mt-2 mb-2">Vælg spiller:</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {users.filter(u => u.role !== 'admin').map(u => (
                            <motion.button key={u.user_id || u.id} whileTap={{ scale: 0.95 }}
                              onClick={() => handleAssign(cat.key, u.user_id || u.id)}
                              disabled={isSav}
                              className={`flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-colors ${
                                award?.user_id === (u.user_id || u.id)
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-100 bg-gray-50'
                              }`}>
                              {u.profile_picture_url
                                ? <img src={u.profile_picture_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                                : <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-black text-xs">{u.name?.[0]}</span>
                                  </div>}
                              <span className="font-black text-gray-800 text-xs truncate">{u.name?.split(' ')[0]}</span>
                              {award?.user_id === (u.user_id || u.id) && <span className="ml-auto text-primary text-xs">✓</span>}
                            </motion.button>
                          ))}
                        </div>
                        {isSav && <div className="mt-2 flex justify-center"><InlineSpinner size={16} /></div>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Indhold Tab ──────────────────────────────────────────────────────────────
function ContentTab() {
  const [rules, setRules] = useState([])
  const [facts, setFacts] = useState([])
  const [sub, setSub] = useState('rules')
  const [newItem, setNewItem] = useState({ title: '', content: '', emoji: '⭐' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    Promise.all([getRules(), getFacts()])
      .then(([r, f]) => { setRules(r.data || []); setFacts(f.data || []) })
      .catch(() => {})
  }, [])

  const items = sub === 'rules' ? rules : facts
  const setItems = sub === 'rules' ? setRules : setFacts

  const handleCreate = async () => {
    if (!newItem.title) { toast.error('Skriv en titel'); return }
    try {
      const fn = sub === 'rules' ? createRule : createFact
      const { data } = await fn(newItem)
      setItems(i => [...i, data])
      setNewItem({ title: '', content: '', emoji: '⭐' })
      toast.success('Oprettet! ✅')
    } catch { toast.error('Fejl ved oprettelse') }
  }

  const handleDelete = async () => {
    try {
      const fn = sub === 'rules' ? deleteRule : deleteFact
      await fn(deleteTarget)
      setItems(i => i.filter(x => x.id !== deleteTarget))
      toast.success('Slettet')
    } catch { toast.error('Fejl') }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!deleteTarget} title="Slet indhold?" message="Indholdet slettes permanent."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
      <div className="flex gap-2">
        {[{ id: 'rules', label: '📚 Regler' }, { id: 'facts', label: '⭐ Fakta' }].map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            className={`flex-1 py-2 rounded-xl font-black text-sm ${sub === t.id ? 'bg-primary text-white' : 'bg-white text-gray-600 border-2 border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h4 className="font-black text-gray-700">Tilføj {sub === 'rules' ? 'regel' : 'fakta'}</h4>
        <div className="flex gap-2">
          <input placeholder="Emoji" value={newItem.emoji} onChange={e => setNewItem({ ...newItem, emoji: e.target.value })}
            className="w-16 border-2 border-gray-200 rounded-xl px-2 py-2 text-center font-semibold text-sm" />
          <input placeholder="Titel" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })}
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        </div>
        <textarea placeholder="Indhold..." value={newItem.content} onChange={e => setNewItem({ ...newItem, content: e.target.value })}
          rows={3} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm resize-none" />
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
          className="w-full bg-primary text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
          <Plus size={16} /> Tilføj
        </motion.button>
      </div>
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="text-2xl">{item.emoji}</span>
            <div>
              <p className="font-black text-gray-900">{item.title}</p>
              <p className="text-gray-500 text-xs font-semibold mt-0.5 line-clamp-2">{item.content}</p>
            </div>
          </div>
          <button onClick={() => setDeleteTarget(item.id)} className="text-red-400 p-1 flex-shrink-0"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  )
}

// ─── Hoved AdminPage ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { override, active } = useCupMode()
  const [activeTab, setActiveTab] = useState('settings')

  useEffect(() => {
    if (!isAdmin) { navigate('/'); toast.error('Adgang nægtet') }
  }, [isAdmin, navigate])

  if (!isAdmin) return null

  return (
    <div className="pb-32">
      <div className="py-4">
        {/* Header */}
        <div className="px-4 mb-4">
          <h1 className="text-2xl font-black text-gray-900">⚙️ Admin Panel</h1>
          <p className="text-gray-500 text-sm font-semibold mt-0.5">Træner & administrator</p>
        </div>

        {/* Cup-mode aktiv banner i admin */}
        <AnimatePresence>
          {override === 'on' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-4"
            >
              <div className="cup-gradient rounded-2xl px-4 py-3 flex items-center gap-3 border border-yellow-400/50">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-2xl"
                >
                  🏆
                </motion.span>
                <div>
                  <p className="text-yellow-300 font-black text-sm">Cup-Mode er MANUELT aktiveret</p>
                  <p className="text-white/70 text-xs font-semibold">Appen viser Cup-tema til alle brugere</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab scrollbar */}
        <div className="px-4 mb-4 overflow-x-auto pb-1">
          <div className="flex gap-2 w-max">
            {TABS.map(t => (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-4 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white text-gray-600 border-2 border-gray-200'
                }`}
              >
                {t.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4"
          >
            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div className="bg-white rounded-3xl shadow-md p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">⚽</span>
                    <h2 className="font-black text-gray-900 text-lg">Cup-Mode Styring</h2>
                  </div>
                  <CupModeControl />
                </div>
              </div>
            )}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'tasks' && <TasksTab />}
            {activeTab === 'badges' && <BadgesTab />}
            {activeTab === 'shifts' && <CupShiftsTab />}
            {activeTab === 'content' && <ContentTab />}
            {activeTab === 'notes' && <AdminNotesTab />}
            {activeTab === 'history' && <AdminHistoryTab />}
            {activeTab === 'guide' && <AdminGuideTab />}
            {activeTab === 'features' && <AdminFeaturesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Cup Vagter Tab ───────────────────────────────────────────────────────────
function CupShiftsTab() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newShift, setNewShift] = useState({ title: '', date: '', startTime: '', endTime: '', icon: '⚽', maxSignups: 3 })

  useEffect(() => {
    getAdminShifts()
      .then(({ data }) => setShifts(data || []))
      .catch(() => setShifts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newShift.title || !newShift.date) { toast.error('Udfyld titel og dato'); return }
    try {
      const { data } = await createAdminShift(newShift)
      setShifts(s => [...s, data])
      setNewShift({ title: '', date: '', startTime: '', endTime: '', icon: '⚽', maxSignups: 3 })
      toast.success('Vagt oprettet! ✅')
    } catch { toast.error('Fejl') }
  }

  const handleDelete = async () => {
    try {
      await deleteAdminShift(deleteTarget)
      setShifts(s => s.filter(x => x.id !== deleteTarget))
      toast.success('Vagt slettet')
    } catch { toast.error('Fejl') }
    setDeleteTarget(null)
  }

  if (loading) return <div className="py-6 text-center"><InlineSpinner size={24} /></div>

  return (
    <div className="space-y-4">
      <ConfirmModal open={!!deleteTarget} title="Slet vagt?" message="Vagten slettes permanent."
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} danger />
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <h4 className="font-black text-gray-700">Opret ny vagt</h4>
        <input placeholder="Vagtens titel" value={newShift.title}
          onChange={e => setNewShift({ ...newShift, title: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
          <input placeholder="Ikon" value={newShift.icon} onChange={e => setNewShift({ ...newShift, icon: e.target.value })}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
          <input type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
          <input type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
            className="border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gray-600">Max tilmeldte:</span>
          <input type="number" min="1" max="20" value={newShift.maxSignups}
            onChange={e => setNewShift({ ...newShift, maxSignups: parseInt(e.target.value) })}
            className="w-20 border-2 border-gray-200 rounded-xl px-3 py-2 font-semibold text-sm" />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
          className="w-full bg-cup-blue text-white font-black py-3 rounded-xl flex items-center justify-center gap-2">
          <Plus size={16} /> Opret vagt
        </motion.button>
      </div>
      {shifts.map(s => (
        <div key={s.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="font-black text-gray-900">{s.title}</p>
              <p className="text-gray-400 text-xs font-semibold">{s.date} · {s.startTime}–{s.endTime}</p>
            </div>
          </div>
          <button onClick={() => setDeleteTarget(s.id)} className="text-red-400 p-2"><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}
