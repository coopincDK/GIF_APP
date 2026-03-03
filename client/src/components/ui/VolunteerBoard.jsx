import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getVolunteers, signupVolunteer, cancelVolunteer } from '../../api/volunteers'
import { useAuth } from '../../hooks/useAuth'

const TYPES = [
  { id: 'frugt',    label: 'Frugt med',  emoji: '🍎', desc: 'Medbring frugt til holdet' },
  { id: 'kage',     label: 'Kage med',   emoji: '🎂', desc: 'Medbring kage efter kampen' },
  { id: 'koersel',  label: 'Kørsel',     emoji: '🚗', desc: 'Kør andre spillere til kamp' },
  { id: 'fotos',    label: 'Fotos',      emoji: '📸', desc: 'Tag billeder til holdet' },
]

function getNextSaturday() {
  const d = new Date()
  const day = d.getDay()
  const diff = (6 - day + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export default function VolunteerBoard() {
  const { user } = useAuth()
  const [matchDate, setMatchDate] = useState(getNextSaturday())
  const [grouped, setGrouped] = useState({})
  const [mySignups, setMySignups] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    getVolunteers(matchDate)
      .then(({ data }) => {
        setGrouped(data.grouped || {})
        const mine = {}
        Object.entries(data.grouped || {}).forEach(([type, signups]) => {
          const found = signups.find(s => s.user_id === user?.user_id)
          if (found) mine[type] = found.signup_id
        })
        setMySignups(mine)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [matchDate])

  const handleSignup = async (type) => {
    try {
      await signupVolunteer({ volunteerType: type, matchDate })
      toast.success('Du er tilmeldt! 🙋')
      fetchData()
    } catch (err) {
      if (err.response?.status === 409) toast.error('Du er allerede tilmeldt!')
      else toast.error('Kunne ikke tilmelde')
    }
  }

  const handleCancel = async (type) => {
    const id = mySignups[type]
    if (!id) return
    try {
      await cancelVolunteer(id)
      toast.success('Afmeldt!')
      fetchData()
    } catch {
      toast.error('Kunne ikke afmelde')
    }
  }

  return (
    <section className="px-4 mt-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-black text-gray-800">🙋 Frivillige</h2>
        <input
          type="date"
          value={matchDate}
          onChange={e => setMatchDate(e.target.value)}
          className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border-0 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {TYPES.map((t, i) => {
          const signups = grouped[t.id] || []
          const isMine = !!mySignups[t.id]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`bg-white rounded-2xl shadow-sm border-2 p-3 ${isMine ? 'border-primary' : 'border-gray-100'}`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <p className="font-black text-gray-800 text-sm">{t.label}</p>
              <p className="text-gray-400 text-[10px] mb-2">{t.desc}</p>

              {/* Tilmeldte */}
              {signups.length > 0 ? (
                <div className="flex flex-wrap gap-1 mb-2">
                  {signups.map(s => (
                    <span key={s.signup_id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      s.confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {s.user_name?.split(' ')[0]}
                      {s.confirmed ? ' ✓' : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-300 text-[10px] mb-2 italic">Ingen endnu</p>
              )}

              {/* Knap */}
              {isMine ? (
                <button
                  onClick={() => handleCancel(t.id)}
                  className="w-full text-[11px] font-black py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-200"
                >
                  Afmeld
                </button>
              ) : (
                <button
                  onClick={() => handleSignup(t.id)}
                  className="w-full text-[11px] font-black py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20"
                >
                  Meld mig! 🙋
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
