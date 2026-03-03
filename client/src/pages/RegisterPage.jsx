import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { register, validateInvite } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { InlineSpinner } from '../components/ui/LoadingSpinner'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()
  const token = params.get('token')

  const [inviteData, setInviteData] = useState(null)
  const [inviteError, setInviteError] = useState(false)
  const [validating, setValidating] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })

  useEffect(() => {
    if (!token) { setInviteError(true); setValidating(false); return }
    validateInvite(token)
      .then(({ data }) => { setInviteData(data); setValidating(false) })
      .catch(() => { setInviteError(true); setValidating(false) })
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) { toast.error('Udfyld alle felter!'); return }
    if (form.password.length < 6) { toast.error('Password skal være mindst 6 tegn'); return }
    setLoading(true)
    try {
      const { data } = await register({ ...form, inviteToken: token })
      login(data.token, data.user)
      toast.success('Konto oprettet! Velkommen! 🎉')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Der opstod en fejl')
    } finally {
      setLoading(false)
    }
  }

  if (validating) return <LoadingSpinner message="Validerer invitation..." />

  if (inviteError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-sm w-full"
        >
          <span className="text-6xl block mb-4">❌</span>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ugyldig invitation</h2>
          <p className="text-gray-500 font-medium mb-6">
            Invitationslinket er ugyldigt eller udløbet. Kontakt din træner for et nyt link.
          </p>
          <Link to="/login" className="block bg-primary text-white font-black py-3 rounded-2xl">
            → Gå til log ind
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="text-2xl font-black text-gray-900">Opret konto</h1>
          {inviteData?.teamName && (
            <div className="mt-2 bg-primary/10 text-primary font-black text-sm px-4 py-2 rounded-2xl inline-block">
              ⚽ {inviteData.teamName}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
          {[
            { key: 'name', label: '👤 Navn', type: 'text', placeholder: 'Dit fulde navn' },
            { key: 'email', label: '📧 Email', type: 'email', placeholder: 'din@email.dk' },
            { key: 'phone', label: '📱 Telefon', type: 'tel', placeholder: '12 34 56 78' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-black text-gray-700 mb-1.5">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:border-primary"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-black text-gray-700 mb-1.5">🔒 Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 tegn"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:border-primary pr-12"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full animated-gradient text-white font-black py-4 rounded-2xl text-lg shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <InlineSpinner /> : '🌟 Opret konto'}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 text-sm font-semibold mt-4">
          Har du allerede en konto?{' '}
          <Link to="/login" className="text-primary font-black underline">Log ind →</Link>
        </p>
      </motion.div>
    </div>
  )
}
