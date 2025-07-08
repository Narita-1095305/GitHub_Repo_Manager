import axios from 'axios'
import type { Repository, User, RepositoryUpdateRequest, ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: () => {
    window.location.href = `${API_BASE_URL}/api/auth/github`
  },
  
  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
    localStorage.removeItem('auth_token')
  },
  
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me')
    return response.data.data
  },
}

export const repositoryApi = {
  getRepositories: async (): Promise<Repository[]> => {
    const response = await api.get<ApiResponse<Repository[]>>('/repositories')
    return response.data.data
  },
  
  updateRepository: async (
    id: number,
    updates: RepositoryUpdateRequest
  ): Promise<Repository> => {
    const response = await api.patch<ApiResponse<Repository>>(
      `/repositories/${id}`,
      updates
    )
    return response.data.data
  },
  
  deleteRepository: async (id: number): Promise<void> => {
    await api.delete(`/repositories/${id}`)
  },
}

export default api