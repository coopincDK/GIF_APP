import api from './axios'

export const getVolunteers = (matchDate) => api.get(`/volunteers?matchDate=${matchDate}`)
export const signupVolunteer = (data) => api.post('/volunteers', data)
export const cancelVolunteer = (id) => api.delete(`/volunteers/${id}`)
export const confirmVolunteer = (id) => api.put(`/volunteers/${id}/confirm`)
