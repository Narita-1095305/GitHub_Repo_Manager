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
  getRepositories: async (page: number = 1, perPage: number = 30): Promise<{ repositories: Repository[], pagination: { page: number, per_page: number, total: number } }> => {
    const response = await api.get<ApiResponse<{ data: Repository[], pagination: { page: number, per_page: number, total: number } }>>(`/repositories?page=${page}&per_page=${perPage}`)
    
    // Handle the nested data structure from backend
    const data = response.data.data
    return {
      repositories: Array.isArray(data?.data) ? data.data : [],
      pagination: data?.pagination || { page: 1, per_page: 30, total: 0 }
    }
  },

  getAllRepositories: async (): Promise<Repository[]> => {
    const allRepos: Repository[] = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const { repositories, pagination } = await repositoryApi.getRepositories(page, 100)
      allRepos.push(...repositories)
      
      hasMore = repositories.length === 100 && page * 100 < pagination.total
      page++
    }
    
    return allRepos
  },
  
  updateRepository: async (
    id: number,
    updates: RepositoryUpdateRequest & { owner: string; name: string }
  ): Promise<Repository> => {
    const response = await api.patch<ApiResponse<Repository>>(
      `/repositories/${id}`,
      updates
    )
    return response.data.data
  },
  
  deleteRepository: async (id: number, owner: string, name: string): Promise<void> => {
    await api.delete(`/repositories/${id}`, {
      data: { owner, name }
    })
  },

  bulkUpdateRepositories: async (
    repositories: Array<{ owner: string; name: string }>,
    updates: { private?: boolean; archived?: boolean }
  ): Promise<BulkOperationResult> => {
    const response = await api.post<ApiResponse<BulkOperationResult>>('/repositories/bulk-update', {
      repositories,
      updates
    })
    return response.data.data
  },

  bulkDeleteRepositories: async (
    repositories: Array<{ owner: string; name: string }>
  ): Promise<BulkOperationResult> => {
    const response = await api.post<ApiResponse<BulkOperationResult>>('/repositories/bulk-delete', {
      repositories
    })
    return response.data.data
  },
}

export default api