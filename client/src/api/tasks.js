import api from './axios'

export const getTasks       = ()              => api.get('/tasks')
export const getMyTasks     = ()              => api.get('/tasks')          // backend returnerer alle holdets opgaver
export const getOpenSwaps   = ()              => api.get('/tasks/swaps/open')
export const createTask     = (data)          => api.post('/tasks', data)
export const deleteTask     = (id)            => api.delete(`/tasks/${id}`)
export const completeTask   = (id)            => api.post(`/tasks/${id}/complete`)
export const assignTask     = (taskId, userId)=> api.patch(`/tasks/${taskId}/assign`, { userId })
export const requestSwap    = (taskId)        => api.post(`/tasks/${taskId}/offer-swap`)
export const acceptSwap     = (taskId)        => api.post(`/tasks/${taskId}/accept-swap`)
export const spinWheel      = ()              => api.post('/tasks/spin')
export const saveWheelResult= (assignments)   => api.post('/tasks/spin/confirm', { assignments })
export const getLaundryCounts = ()            => api.get('/tasks/laundry-counts')
