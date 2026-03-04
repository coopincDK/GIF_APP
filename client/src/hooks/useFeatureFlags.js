import { useState, useEffect, useContext, createContext } from 'react'
import { getFeatures } from '../api/features'

const FeatureFlagsContext = createContext({})

// Default: alle features ON (fallback hvis API fejler)
const DEFAULT_FLAGS = {
  spin_wheel: true,
  volunteer_board: true,
  task_swap: true,
  weekly_awards: true,
  badges: true,
  team_page: true,
  leaderboard: true,
  daily_fact: true,
  coach_corner: true,
  schedule: true,
  upcoming_match: true,
  superliga_widget: true,
  cup_mode: true,
}

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState(DEFAULT_FLAGS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getFeatures()
      .then(({ data }) => {
        // Merge med defaults så nye flags altid er ON
        setFlags({ ...DEFAULT_FLAGS, ...data })
      })
      .catch(() => {
        // Fejl: brug defaults (alle ON)
        setFlags(DEFAULT_FLAGS)
      })
      .finally(() => setLoaded(true))
  }, [])

  return (
    <FeatureFlagsContext.Provider value={{ flags, setFlags, loaded }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext)
}
