import api from './axios'

export const getUsers = () => api.get('/users')
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const updateProfile = (data) => api.put('/users/profile', data)
export const uploadAvatar = (formData) =>
  api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const generateInvite = (teamId) => api.post('/users/invite', { teamId })
