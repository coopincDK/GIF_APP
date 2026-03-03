import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from '../api/axios'
import { useCupMode } from '../hooks/useCupMode'
import { useAuth } from '../hooks/useAuth'
import CupCountdown from '../components/ui/CupCountdown'
import toast from 'react-hot-toast'

const iconMap = { tent: '⛺', food: '🌭', recycling: '♻️', parking: '🚧' }

export default function CupCommandPage() {
  const { cupStatus } = useCupMode()
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newShift, setNewShift] = useState({ title: '', description: '', shift_date: '2026-07-23', start_time: '09:00', end_time: '12:00', max_volunteers: 2, icon_type: 'tent' })

  useEffect(() => { fetchShifts() }, [])

  async function fetchShifts() {
    try {
      const res = await axios.get('/cup/shifts')
      setShifts(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(shiftId, isSignedUp) {
    try {
      if (isSignedUp) {
        await axios.delete(`/cup/shifts/${shiftId}/signup`)
        toast.success('Du er afmeldt vagten')
      } else {
        const res = await axios.post(`/cup/shifts/${shiftId}/signup`)
        toast.success(res.data.message)
        if (res.data.new_badge) toast.success(`🏅 Nyt badge: ${res.data.new_badge.name}!`, { duration: 5000 })
      }
      fetchShifts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Fejl')
    }
  }

  async function handleAddShift(e) {
    e.preventDefault()
    try {
      await axios.post('/cup/shifts', newShift)
      toast.success('Vagt oprettet! ⛺')
      setShowAddForm(false)
      fetchShifts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Fejl')
    }
  }

  async function handleDeleteShift(shiftId) {
    if (!confirm('Slet denne vagt?')) return
    try {
      await axios.delete(`/cup/shifts/${shiftId}`)
      toast.success('Vagt slettet')
      fetchShifts()
    } catch (err) {
      toast.error('Fejl ved sletning')
    }
  }

  const isCupActive = cupStatus?.active

  return (
    <div className={`min-h-screen pb-32 ${isCupActive ? 'bg-blue-950' : 'bg-green-50'}`}>
      {/* Header */}
      <div className={`px-4 pt-6 pb-8 ${isCupActive ? 'bg-gradient-to-br from-blue-900 to-blue-700' : 'bg-gradient-to-br from-green-700 to-green-500'}`}>
        <div className="flex justify-center mb-3">
          <img src="/assets/kattegat-cup-logo-ny-blaa.png" alt="Kattegat Cup" className="h-16 object-contain" onError={e => e.target.style.display='none'} />
        </div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`text-2xl font-black text-center mb-1 ${isCupActive ? 'text-yellow-400' : 'text-white'}`}>
          🏆 Kattegat Cup
        </motion.h1>
        <p className={`text-center text-sm ${isCupActive ? 'text-blue-200' : 'text-green-100'}`}>
          {isCupActive ? 'ÅRETS VIGTIGSTE MISSION!' : 'Grenå IF 40-års jubilæum · 23. juli 2026'}
        </p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Nedtælling */}
        <CupCountdown />

        {/* Ikke aktiv endnu */}
        {!isCupActive && user?.role !== 'admin' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-md text-center">
            <div className="text-5xl mb-3">⏳</div>
            <h2 className="font-black text-gray-800 text-lg mb-2">Cup-Mode åbner snart!</h2>
            <p className="text-gray-500 text-sm">Vagttilmelding åbner 4 uger før Kattegat Cup (25. juni 2026)</p>
          </motion.div>
        )}

        {/* Vagter */}
        {(isCupActive || user?.role === 'admin') && (
          <>
            <div className="flex items-center justify-between">
              <h2 className={`font-black text-lg ${isCupActive ? 'text-yellow-400' : 'text-gray-800'}`}>⛺ Frivilligvagter</h2>
              {user?.role === 'admin' && (
                <button onClick={() => setShowAddForm(!showAddForm)} className="bg-yellow-400 text-blue-900 font-black px-4 py-2 rounded-xl text-sm shadow-md">
                  + Ny vagt
                </button>
              )}
            </div>

            {/* Tilføj vagt form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddShift} className="bg-white rounded-2xl p-4 shadow-md space-y-3">
                  <input value={newShift.title} onChange={e => setNewShift({...newShift, title: e.target.value})} placeholder="Vagtens navn" required className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold" />
                  <input value={newShift.description} onChange={e => setNewShift({...newShift, description: e.target.value})} placeholder="Beskrivelse (valgfri)" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={newShift.shift_date} onChange={e => setNewShift({...newShift, shift_date: e.target.value})} className="border-2 border-gray-200 rounded-xl px-3 py-2 font-bold" />
                    <select value={newShift.icon_type} onChange={e => setNewShift({...newShift, icon_type: e.target.value})} className="border-2 border-gray-200 rounded-xl px-3 py-2 font-bold">
                      <option value="tent">⛺ Telt</option>
                      <option value="food">🌭 Mad</option>
                      <option value="recycling">♻️ Affald</option>
                      <option value="parking">🚧 Parkering</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="time" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})} className="border-2 border-gray-200 rounded-xl px-3 py-2 font-bold" />
                    <input type="time" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})} className="border-2 border-gray-200 rounded-xl px-3 py-2 font-bold" />
                    <input type="number" min="1" max="20" value={newShift.max_volunteers} onChange={e => setNewShift({...newShift, max_volunteers: parseInt(e.target.value)})} placeholder="Max" className="border-2 border-gray-200 rounded-xl px-3 py-2 font-bold" />
                  </div>
                  <button type="submit" className="w-full bg-blue-800 text-yellow-400 font-black py-3 rounded-xl">Opret vagt ⛺</button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Vagt liste */}
            {loading ? (
              <div className="flex justify-center py-8"><div className="text-4xl animate-spin">⚽</div></div>
            ) : shifts.length === 0 ? (
              <div className={`text-center py-12 ${isCupActive ? 'text-blue-300' : 'text-gray-400'}`}>
                <div className="text-5xl mb-3">📋</div>
                <p className="font-bold">Ingen vagter oprettet endnu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift, i) => {
                  const isSignedUp = shift.volunteers?.some(v => v.user_id === user?.user_id)
                  return (
                    <motion.div key={shift.shift_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`rounded-2xl p-4 shadow-md ${isCupActive ? 'bg-blue-800 border border-blue-600' : 'bg-white'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{iconMap[shift.icon_type] || '⛺'}</span>
                          <div>
                            <h3 className={`font-black ${isCupActive ? 'text-yellow-400' : 'text-gray-800'}`}>{shift.title}</h3>
                            <p className={`text-xs ${isCupActive ? 'text-blue-200' : 'text-gray-500'}`}>{shift.shift_date} · {shift.start_time}–{shift.end_time}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${shift.is_full ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {shift.signup_count}/{shift.max_volunteers}
                          </span>
                          {user?.role === 'admin' && (
                            <button onClick={() => handleDeleteShift(shift.shift_id)} className="text-red-400 text-lg">🗑️</button>
                          )}
                        </div>
                      </div>
                      {shift.description && <p className={`text-sm mb-3 ${isCupActive ? 'text-blue-200' : 'text-gray-500'}`}>{shift.description}</p>}
                      {shift.volunteers?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {shift.volunteers.map(v => (
                            <span key={v.user_id} className={`text-xs px-2 py-1 rounded-full font-bold ${isCupActive ? 'bg-blue-700 text-blue-100' : 'bg-green-100 text-green-700'}`}>✓ {v.name}</span>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleSignup(shift.shift_id, isSignedUp)}
                        disabled={shift.is_full && !isSignedUp}
                        className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                          isSignedUp ? 'bg-red-100 text-red-600' :
                          shift.is_full ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                          isCupActive ? 'bg-yellow-400 text-blue-900' : 'bg-green-600 text-white'
                        }`}
                      >
                        {isSignedUp ? '❌ Afmeld mig' : shift.is_full ? '🔒 Fuldt besat' : '🌟 Tilmeld mig!'}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
