import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

// Public axios uden auth — cup/status skal være tilgængeligt uden login
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 5000,
})

export const CupModeContext = createContext(null)

const CUP_DATE = new Date('2026-07-23T10:00:00')
const AUTO_ACTIVATE_DATE = new Date('2026-06-25T00:00:00')

export function CupModeProvider({ children }) {
  const [override, setOverride] = useState('auto')
  const [active, setActive] = useState(false)
  const [daysUntilCup, setDaysUntilCup] = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef(null)

  const calculateDaysUntilCup = () => {
    const now = new Date()
    const diff = CUP_DATE - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const determineActive = (ov) => {
    if (ov === 'on') return true
    if (ov === 'off') return false
    return new Date() >= AUTO_ACTIVATE_DATE
  }

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await publicApi.get('/cup/status')
      const ov = data.override ?? 'auto'
      setOverride(ov)
      setActive(determineActive(ov))
    } catch {
      // Fallback — ingen crash, ingen loop
      setActive(new Date() >= AUTO_ACTIVATE_DATE)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshStatus = useCallback(async (newOverride) => {
    if (newOverride !== undefined) {
      setOverride(newOverride)
      setActive(determineActive(newOverride))
    } else {
      await fetchStatus()
    }
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus()
    setDaysUntilCup(calculateDaysUntilCup())

    // Poll hvert 30 sek
    intervalRef.current = setInterval(() => {
      fetchStatus()
      setDaysUntilCup(calculateDaysUntilCup())
    }, 30000)

    return () => clearInterval(intervalRef.current)
  }, [fetchStatus])

  return (
    <CupModeContext.Provider value={{
      active, override, daysUntilCup, loading,
      cupDate: CUP_DATE, autoActivateDate: AUTO_ACTIVATE_DATE,
      refreshStatus,
      cupStatus: { active, override, daysUntilCup },
    }}>
      {children}
    </CupModeContext.Provider>
  )
}
