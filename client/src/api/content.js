import api from './axios'

export const getRules  = () => api.get('/content/rules')
export const getFacts  = () => api.get('/content/facts')
export const getJokes  = () => api.get('/content/jokes')
export const createRule = (data) => api.post('/content/rules', data)
export const updateRule = (id, data) => api.put(`/content/rules/${id}`, data)
export const deleteRule = (id) => api.delete(`/content/rules/${id}`)
export const createFact = (data) => api.post('/content/facts', data)
export const updateFact = (id, data) => api.put(`/content/facts/${id}`, data)
export const deleteFact = (id) => api.delete(`/content/facts/${id}`)
