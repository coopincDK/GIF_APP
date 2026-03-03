import api from './axios'

export const getFootball  = () => api.get('/football')
export const syncFootball = () => api.post('/football/sync')
