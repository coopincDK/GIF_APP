import api from './axios'

// Indstillinger
export const getSettings = () => api.get('/admin/settings')
export const setCupModeOverride = (override) =>
  api.put('/admin/settings/cup-mode', { override })

// Brugerstyring
export const getAdminUsers = () => api.get('/admin/users')
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`)
export const generateInviteLink = (data) => api.post('/admin/invite', data)

// Opgaver
export const getAdminTasks = () => api.get('/admin/tasks')
export const createAdminTask = (data) => api.post('/admin/tasks', data)
export const deleteAdminTask = (id) => api.delete(`/admin/tasks/${id}`)

// Badges
export const getAdminBadges = () => api.get('/admin/badges')
export const awardBadgeToUser = (userId, badgeId) =>
  api.post('/admin/badges/award', { userId, badgeId })

// Cup vagter
export const getAdminShifts = () => api.get('/admin/cup/shifts')
export const createAdminShift = (data) => api.post('/admin/cup/shifts', data)
export const deleteAdminShift = (id) => api.delete(`/admin/cup/shifts/${id}`)
