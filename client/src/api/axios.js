import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor – tilføj JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gif_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – håndter 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gif_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
