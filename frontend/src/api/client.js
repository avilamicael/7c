import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Interceptor para renovar token automaticamente
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // lógica de refresh token
    }
    return Promise.reject(err)
  }
)

export default api