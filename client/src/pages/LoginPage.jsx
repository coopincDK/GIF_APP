import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { login as loginApi } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { InlineSpinner } from '../components/ui/LoadingSpinner'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { toast.error('Udfyld alle felter!'); return }
    setLoading(true)
    try {
      const { data } = await loginApi(form.email, form.password)
      login(data.token, data.user)
      toast.success(`Velkommen, ${data.user.name}! ⚽`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Forkert email eller password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Baggrunds bolde */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-5xl opacity-10 floating-ball"
          style={{
            left: `${15 + i * 18}%`,
            top: `${10 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          ⚽
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl border-4 border-white mb-4"
          >
            <img
              src="/assets/logo.jpg"
              alt="GIF Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.parentElement.innerHTML = '<div class="w-full h-full bg-primary flex items-center justify-center text-5xl">⚽</div>'
              }}
            />
          </motion.div>
          <h1 className="text-3xl font-black text-primary">GIF Hold-Helte</h1>
          <p className="text-gray-500 font-semibold text-sm mt-1">Grenå IF U10/U11 ⚽🔥</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-1.5">📧 Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="din@email.dk"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-1.5">🔒 Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold text-gray-900 focus:outline-none focus:border-primary transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
              >
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
            {loading ? <InlineSpinner /> : '⚽ Hop ind!'}
          </motion.button>
        </form>

        <p className="text-center text-gray-500 font-semibold mt-4 text-sm">
          Ny på holdet?{' '}
          <Link to="/register" className="text-primary font-black underline">
            Opret dig her 👋
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
