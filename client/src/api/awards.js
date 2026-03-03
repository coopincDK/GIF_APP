import api from './axios'

export const getWeekAwards = (week, year) => api.get(`/awards/week?week=${week}&year=${year}`)
export const createAward = (data) => api.post('/awards', data)
export const deleteAward = (id) => api.delete(`/awards/${id}`)
export const getYearStats = (year) => api.get(`/awards/stats/year?year=${year}`)
