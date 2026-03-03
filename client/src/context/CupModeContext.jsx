import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { getCupStatus } from '../api/cup'

export const CupModeContext = createContext(null)

// Cup dato: 23. juli 2026. Auto-mode aktiveres 4 uger før = 25. juni 2026
const CUP_DATE = new Date('2026-07-23T10:00:00')
const AUTO_ACTIVATE_DATE = new Date('2026-06-25T00:00:00')

export function CupModeProvider({ children }) {
  const [override, setOverride] = useState('auto') // 'on' | 'off' | 'auto'
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
    // auto: aktivér hvis vi er forbi AUTO_ACTIVATE_DATE
    return new Date() >= AUTO_ACTIVATE_DATE
  }

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await getCupStatus()
      const ov = data.override ?? 'auto'
      setOverride(ov)
      setActive(determineActive(ov))
    } catch {
      // Fallback til lokal beregning
      setActive(determineActive(override))
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  // Opdater override lokalt og hent nyt fra backend
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

    // Polling hvert 30 sekunder
    intervalRef.current = setInterval(() => {
      fetchStatus()
      setDaysUntilCup(calculateDaysUntilCup())
    }, 30000)

    return () => clearInterval(intervalRef.current)
  }, [fetchStatus])

  return (
    <CupModeContext.Provider value={{
      active,
      override,
      daysUntilCup,
      loading,
      cupDate: CUP_DATE,
      autoActivateDate: AUTO_ACTIVATE_DATE,
      refreshStatus,
    }}>
      {children}
    </CupModeContext.Provider>
  )
}
