import api from './axios'

export const getTasks = () => api.get('/tasks')
export const getMyTasks = () => api.get('/tasks/my')
export const createTask = (data) => api.post('/tasks', data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)
export const completeTask = (id) => api.patch(`/tasks/${id}/complete`)
export const assignTask = (taskId, userId) => api.patch(`/tasks/${taskId}/assign`, { userId })
export const requestSwap = (taskId) => api.post(`/tasks/${taskId}/swap-request`)
export const acceptSwap = (taskId) => api.post(`/tasks/${taskId}/swap-accept`)
export const spinWheel = () => api.post('/tasks/spin')
export const saveWheelResult = (assignments) => api.post('/tasks/spin/save', { assignments })
export const getLaundryCounts = () => api.get('/tasks/laundry-counts')
