import api from './axios'

export const getFeatures     = () => api.get('/features')
export const getFeaturesFull = () => api.get('/features/full')
export const setFeature      = (key, enabled) => api.put(`/features/${key}`, { enabled })
