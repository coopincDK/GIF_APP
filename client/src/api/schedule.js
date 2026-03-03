import api from './axios'

export const getSchedule  = () => api.get('/schedule')
export const syncSchedule = () => api.post('/schedule/sync')
