import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import axios from '../api/axios'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user?.name || '', phone_number: user?.phone_number || '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await axios.put(`/users/${user.user_id}`, form)
      setUser(prev => ({ ...prev, ...res.data }))
      toast.success('Profil opdateret! ✅')
      setEditing(false)
    } catch (err) {
      toast.error('Kunne ikke gemme')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    try {
      const res = await axios.post(`/users/${user.user_id}/avatar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUser(prev => ({ ...prev, profile_picture_url: res.data.profile_picture_url }))
      toast.success('Profilbillede opdateret! 📸')
    } catch (err) {
      toast.error('Kunne ikke uploade billede')
    } finally {
      setUploading(false)
    }
  }

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'
  const avatarUrl = user?.profile_picture_url
    ? `${backendUrl}${user.profile_picture_url}`
    : null

  return (
    <div className="min-h-screen bg-green-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 px-4 pt-6 pb-16">
        <h1 className="text-2xl font-black text-white text-center">👤 Min Profil</h1>
      </div>

      {/* Avatar */}
      <div className="flex justify-center -mt-12 mb-4">
        <div className="relative">
          <motion.div whileTap={{ scale: 0.95 }} className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-green-200 cursor-pointer"
            onClick={() => document.getElementById('avatar-input').click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                {user?.name?.[0]?.toUpperCase() || '👤'}
              </div>
            )}
          </motion.div>
          <div className="absolute bottom-0 right-0 bg-green-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-sm shadow-md">
            {uploading ? '⏳' : '📷'}
          </div>
          <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Profil kort */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-800 text-lg">Oplysninger</h2>
            <button onClick={() => setEditing(!editing)} className={`px-4 py-2 rounded-xl font-bold text-sm ${editing ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
              {editing ? 'Annuller' : '✏️ Rediger'}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Navn</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 font-bold mt-1" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Telefon</label>
                <input value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} placeholder="+45 12 34 56 78" className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 mt-1" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-green-600 text-white font-black py-3 rounded-xl">
                {saving ? '⏳ Gemmer...' : '✅ Gem ændringer'}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Navn</p>
                  <p className="font-black text-gray-800">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">📧</span>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                  <p className="font-bold text-gray-700">{user?.email}</p>
                </div>
              </div>
              {user?.phone_number && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Telefon</p>
                    <p className="font-bold text-gray-700">{user.phone_number}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{user?.role === 'admin' ? '⭐' : '👦'}</span>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Rolle</p>
                  <p className="font-bold text-gray-700">{user?.role === 'admin' ? 'Admin / Holdleder' : 'Forælder / Spiller'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Log ud */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={logout}
          className="w-full bg-red-50 border-2 border-red-200 text-red-600 font-black py-4 rounded-2xl text-lg shadow-sm">
          🚪 Log ud
        </motion.button>
      </div>
    </div>
  )
}
