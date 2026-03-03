import api from './axios'

export const getCupStatus = () => api.get('/cup/status')
export const getCupShifts = () => api.get('/cup/shifts')
export const createShift = (data) => api.post('/cup/shifts', data)
export const deleteShift = (id) => api.delete(`/cup/shifts/${id}`)
export const signUpForShift = (shiftId) => api.post(`/cup/shifts/${shiftId}/signup`)
export const cancelShiftSignup = (shiftId) => api.delete(`/cup/shifts/${shiftId}/signup`)
