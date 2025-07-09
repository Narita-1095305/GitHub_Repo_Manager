export interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  archived: boolean
  html_url: string
  clone_url: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  language: string | null
  forks_count: number
  open_issues_count: number
  default_branch: string
  owner: {
    login: string
    avatar_url: string
    html_url: string
  }
}

export interface User {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
  html_url: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface RepositoryUpdateRequest {
  private?: boolean
  archived?: boolean
}

export interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export interface BulkOperationResult {
  updated?: Repository[]
  deleted?: string[]
  errors: string[]
  total: number
  success: number
  failed: number
}

export interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  repositories: Repository[]
  title: string
  message: string
}