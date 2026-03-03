import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/ui/LoadingSpinner'
import AppShell from './components/layout/AppShell'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import SpinWheelPage from './pages/SpinWheelPage'
import TreasurePage from './pages/TreasurePage'
import TeamBannerPage from './pages/TeamBannerPage'
import CoachCornerPage from './pages/CoachCornerPage'
import CupCommandPage from './pages/CupCommandPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import YearStatsPage from './pages/YearStatsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Logger ind..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppShell>{children}</AppShell>
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Logger ind..." />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <AppShell>{children}</AppShell>
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Indlæser..." />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public — ingen AppShell */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Protected — AppShell med TopBar + BottomNav */}
        <Route path="/"        element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/treasure" element={<ProtectedRoute><TreasurePage /></ProtectedRoute>} />
        <Route path="/team"    element={<ProtectedRoute><TeamBannerPage /></ProtectedRoute>} />
        <Route path="/coach"   element={<ProtectedRoute><CoachCornerPage /></ProtectedRoute>} />
        <Route path="/cup"     element={<ProtectedRoute><CupCommandPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Admin only — AppShell med TopBar + BottomNav */}
        <Route path="/spin"  element={<AdminRoute><SpinWheelPage /></AdminRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/year-stats" element={<AdminRoute><YearStatsPage /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
