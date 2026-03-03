import api from './axios'

export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (data) =>
  api.post('/auth/register', data)

export const getMe = () =>
  api.get('/auth/me')

export const validateInvite = (token) =>
  api.get(`/auth/invite/${token}`)

export const logout = () =>
  api.post('/auth/logout')
