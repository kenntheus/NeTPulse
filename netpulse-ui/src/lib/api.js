import axios from 'axios'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// Attach bearer token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('netpulse_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('netpulse_token')
      localStorage.removeItem('netpulse_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api