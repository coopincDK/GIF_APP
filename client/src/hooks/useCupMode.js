import { useContext } from 'react'
import { CupModeContext } from '../context/CupModeContext'

export function useCupMode() {
  const ctx = useContext(CupModeContext)
  if (!ctx) throw new Error('useCupMode must be used within CupModeProvider')
  return ctx
}
