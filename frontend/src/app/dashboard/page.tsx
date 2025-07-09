'use client'

import { useState, useEffect } from 'react'
import { repositoryApi } from '@/lib/api'
import type { Repository, BulkOperationResult } from '@/types'
import BulkOperationModal from '@/components/BulkOperationModal'
import RepositoryManageModal from '@/components/RepositoryManageModal'

export default function Dashboard() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRepos, setTotalRepos] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [allRepositories, setAllRepositories] = useState<Repository[]>([])
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)

  useEffect(() => {
    loadRepositories()
  }, [])

  useEffect(() => {
    if (!Array.isArray(repositories)) {
      setFilteredRepos([])
      return
    }
    
    if (searchQuery.trim() === '') {
      setFilteredRepos(repositories)
    } else {
      const filtered = repositories.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredRepos(filtered)
    }
  }, [searchQuery, repositories])

  const loadNextPage = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadRepositories(currentPage + 1)
    }
  }

  const loadRepositories = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true)
        setRepositories([])
        setAllRepositories([])
        setHasLoadedAll(false)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      
      const { repositories: repos, pagination } = await repositoryApi.getRepositories(page, 30)
      
      if (page === 1) {
        setRepositories(repos)
        setAllRepositories(repos)
      } else {
        setRepositories(prev => [...prev, ...repos])
        setAllRepositories(prev => [...prev, ...repos])
      }
      
      setCurrentPage(page)
      setTotalPages(Math.ceil(pagination.total / 30))
      setTotalRepos(pagination.total)
      
      // Check if we've loaded all repositories
      const totalLoaded = page === 1 ? repos.length : repositories.length + repos.length
      if (totalLoaded >= pagination.total) {
        setHasLoadedAll(true)
      } else {
        setHasLoadedAll(false)
      }
      
      // Debug logging
      console.log('Debug info:', {
        page,
        reposLoaded: repos.length,
        totalRepos: totalLoaded,
        paginationTotal: pagination.total,
        hasLoadedAll: totalLoaded >= pagination.total
      })
      
    } catch (err) {
      setError('Failed to load repositories')
      console.error('Error loading repositories:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadAllRepositories = async () => {
    try {
      setLoadingMore(true)
      setError(null)
      
      const allRepos = await repositoryApi.getAllRepositories()
      setRepositories(allRepos)
      setAllRepositories(allRepos)
      setHasLoadedAll(true)
      setTotalRepos(allRepos.length)
      
    } catch (err) {
      setError('Failed to load all repositories')
      console.error('Error loading all repositories:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSelectRepo = (repoId: number) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId)
    } else {
      newSelected.add(repoId)
    }
    setSelectedRepos(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRepos.size === filteredRepos.length) {
      setSelectedRepos(new Set())
    } else {
      setSelectedRepos(new Set(filteredRepos.map(repo => repo.id)))
    }
  }

  const getSelectedRepositories = () => {
    return Array.isArray(repositories) ? repositories.filter(repo => selectedRepos.has(repo.id)) : []
  }

  const handleBulkOperation = async (action: 'makePrivate' | 'makePublic' | 'archive' | 'unarchive' | 'delete') => {
    setBulkLoading(true)
    try {
      const selectedRepositories = getSelectedRepositories()
      const repoData = selectedRepositories.map(repo => ({
        owner: repo.owner.login,
        name: repo.name
      }))

      let result: BulkOperationResult

      if (action === 'delete') {
        result = await repositoryApi.bulkDeleteRepositories(repoData)
      } else {
        const updates: { private?: boolean; archived?: boolean } = {}
        
        switch (action) {
          case 'makePrivate':
            updates.private = true
            break
          case 'makePublic':
            updates.private = false
            break
          case 'archive':
            updates.archived = true
            break
          case 'unarchive':
            updates.archived = false
            break
        }

        result = await repositoryApi.bulkUpdateRepositories(repoData, updates)
      }

      // Show notification
      const successMessage = `${result.success}個のリポジトリが正常に処理されました`
      const errorMessage = result.failed > 0 ? `${result.failed}個のリポジトリでエラーが発生しました` : ''
      
      setNotification({
        message: errorMessage ? `${successMessage}。${errorMessage}` : successMessage,
        type: result.failed > 0 ? 'error' : 'success'
      })

      // Clear selection and refresh
      setSelectedRepos(new Set())
      setShowBulkModal(false)
      await loadRepositories()

    } catch (err) {
      console.error('Bulk operation failed:', err)
      setNotification({
        message: '一括操作に失敗しました',
        type: 'error'
      })
    } finally {
      setBulkLoading(false)
    }
  }

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleManageRepository = (repository: Repository) => {
    setSelectedRepository(repository)
    setShowManageModal(true)
  }

  const handleCloseManageModal = () => {
    setShowManageModal(false)
    setSelectedRepository(null)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={loadRepositories}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Repository Dashboard</h1>
            <p className="text-gray-600">
              Manage your GitHub repositories 
              {totalRepos > 0 && (
                <span className="ml-2 text-sm">
                  ({repositories.length} of {totalRepos} loaded)
                </span>
              )}
            </p>
          </div>
          {!hasLoadedAll && totalRepos > repositories.length && (
            <button
              onClick={loadAllRepositories}
              disabled={loadingMore}
              className="btn-primary"
            >
              {loadingMore ? 'Loading...' : 'Load All Repositories'}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search repositories</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => loadRepositories(1)}
              className="btn-secondary"
            >
              Refresh
            </button>
            {!hasLoadedAll && currentPage < totalPages && (
              <button
                onClick={loadNextPage}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Operations */}
      {selectedRepos.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedRepos.size}個のリポジトリが選択されています
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedRepos(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                選択解除
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="btn-primary text-sm"
              >
                一括操作
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repository Grid */}
      {filteredRepos.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search terms.' : 'Get started by creating a new repository.'}
          </p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              checked={selectedRepos.size === filteredRepos.length && filteredRepos.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              すべて選択 ({filteredRepos.length}個)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRepos.map((repo) => (
              <div key={repo.id} className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                selectedRepos.has(repo.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}>
                {/* Repository Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedRepos.has(repo.id)}
                      onChange={() => handleSelectRepo(repo.id)}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">
                          {repo.name}
                        </a>
                      </h3>
                      <p className="text-sm text-gray-500 truncate">{repo.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {repo.private ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    )}
                    {repo.archived && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Archived
                      </span>
                    )}
                  </div>
                </div>

              {/* Description */}
              {repo.description && (
                <p className="text-sm text-gray-600 mb-4" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>{repo.description}</p>
              )}

              {/* Repository Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  {repo.language && (
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                      {repo.language}
                    </div>
                  )}
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {repo.stargazers_count}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    {repo.forks_count}
                  </div>
                </div>
              </div>

              {/* Updated Date */}
              <div className="text-xs text-gray-400">
                Updated {formatDate(repo.updated_at)}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => handleManageRepository(repo)}
                  className="btn-secondary text-xs flex-1"
                >
                  Manage
                </button>
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs flex-1 text-center"
                >
                  View on GitHub
                </a>
              </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination Info and Load More */}
      {!hasLoadedAll && repositories.length > 0 && (
        <div className="mt-8 flex items-center justify-center space-x-4">
          <span className="text-sm text-gray-600">
            Showing {repositories.length} of {totalRepos} repositories
          </span>
          {currentPage < totalPages && (
            <button
              onClick={loadNextPage}
              disabled={loadingMore}
              className="btn-primary"
            >
              {loadingMore ? 'Loading...' : `Load More (Page ${currentPage + 1})`}
            </button>
          )}
        </div>
      )}

      {hasLoadedAll && repositories.length > 0 && (
        <div className="mt-8 text-center">
          <span className="text-sm text-gray-600">
            All {totalRepos} repositories loaded
          </span>
        </div>
      )}

      {/* Bulk Operation Modal */}
      <BulkOperationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkOperation}
        repositories={getSelectedRepositories()}
        loading={bulkLoading}
      />

      {/* Repository Manage Modal */}
      <RepositoryManageModal
        isOpen={showManageModal}
        onClose={handleCloseManageModal}
        repository={selectedRepository}
        onUpdate={() => loadRepositories(1)}
      />
    </div>
  )
}