import { createContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('gif_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await getMe()
      setUser(data)
    } catch {
      localStorage.removeItem('gif_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = (token, userData) => {
    localStorage.setItem('gif_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('gif_token')
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, isAdmin, isAuthenticated, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}
