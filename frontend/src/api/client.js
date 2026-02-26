import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request: injeta access token ────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response: renova token automaticamente ──────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refresh = sessionStorage.getItem('refresh')

      if (!refresh) {
        isRefreshing = false
        logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/auth/refresh/', { refresh })
        const newAccess = data.access
        const newRefresh = data.refresh

        sessionStorage.setItem('access', newAccess)
        if (newRefresh) sessionStorage.setItem('refresh', newRefresh)

        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
        processQueue(null, newAccess)
        originalRequest.headers.Authorization = `Bearer ${newAccess}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export function logout() {
  const refresh = sessionStorage.getItem('refresh')
  if (refresh) {
    // fire-and-forget: invalida na blacklist
    axios.post('/api/auth/logout/', { refresh }).catch(() => {})
  }
  sessionStorage.removeItem('access')
  sessionStorage.removeItem('refresh')
  sessionStorage.removeItem('usuario')
  window.location.href = '/login'
}

export default api