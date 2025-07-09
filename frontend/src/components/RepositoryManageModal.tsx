'use client'

import { useState } from 'react'
import { repositoryApi } from '@/lib/api'
import type { Repository } from '@/types'

interface RepositoryManageModalProps {
  isOpen: boolean
  onClose: () => void
  repository: Repository | null
  onUpdate: () => void
}

export default function RepositoryManageModal({
  isOpen,
  onClose,
  repository,
  onUpdate
}: RepositoryManageModalProps) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  if (!isOpen || !repository) return null

  const handleVisibilityToggle = async () => {
    if (!repository) return
    
    setLoading(true)
    try {
      await repositoryApi.updateRepository(repository.id, {
        private: !repository.private,
        owner: repository.owner.login,
        name: repository.name
      })
      
      setNotification({
        message: `リポジトリを${repository.private ? 'Public' : 'Private'}に変更しました`,
        type: 'success'
      })
      
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to update repository visibility:', error)
      setNotification({
        message: '可視性の変更に失敗しました',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!repository) return
    
    setLoading(true)
    try {
      await repositoryApi.updateRepository(repository.id, {
        archived: !repository.archived,
        owner: repository.owner.login,
        name: repository.name
      })
      
      setNotification({
        message: `リポジトリを${repository.archived ? 'アンアーカイブ' : 'アーカイブ'}しました`,
        type: 'success'
      })
      
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to update repository archive status:', error)
      setNotification({
        message: 'アーカイブ状態の変更に失敗しました',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!repository || deleteConfirmText !== repository.name) return
    
    setLoading(true)
    try {
      await repositoryApi.deleteRepository(repository.id, repository.owner.login, repository.name)
      
      setNotification({
        message: 'リポジトリを削除しました',
        type: 'success'
      })
      
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Failed to delete repository:', error)
      setNotification({
        message: 'リポジトリの削除に失敗しました',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetDeleteConfirm = () => {
    setShowDeleteConfirm(false)
    setDeleteConfirmText('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            リポジトリ管理
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-3 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Repository Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium text-gray-900">{repository.name}</h4>
          <p className="text-sm text-gray-600">{repository.full_name}</p>
          {repository.description && (
            <p className="text-sm text-gray-500 mt-1">{repository.description}</p>
          )}
          <div className="flex items-center space-x-2 mt-2">
            {repository.private ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Private
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Public
              </span>
            )}
            {repository.archived && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Archived
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!showDeleteConfirm ? (
          <div className="space-y-3">
            {/* Visibility Toggle */}
            <button
              onClick={handleVisibilityToggle}
              disabled={loading}
              className={`w-full p-3 rounded-md text-left hover:bg-gray-50 border transition-colors ${
                repository.private ? 'border-green-200 hover:border-green-300' : 'border-red-200 hover:border-red-300'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">
                    {repository.private ? 'Publicに変更' : 'Privateに変更'}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {repository.private ? 'リポジトリを公開します' : 'リポジトリを非公開にします'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Archive Toggle */}
            <button
              onClick={handleArchiveToggle}
              disabled={loading}
              className={`w-full p-3 rounded-md text-left hover:bg-gray-50 border transition-colors ${
                repository.archived ? 'border-blue-200 hover:border-blue-300' : 'border-yellow-200 hover:border-yellow-300'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-gray-900">
                    {repository.archived ? 'アンアーカイブ' : 'アーカイブ'}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {repository.archived ? 'リポジトリのアーカイブを解除します' : 'リポジトリをアーカイブします'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="w-full p-3 rounded-md text-left hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-medium text-red-900">削除</h5>
                  <p className="text-sm text-red-600">リポジトリを完全に削除します</p>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          /* Delete Confirmation */
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h5 className="font-medium text-red-900 mb-2">⚠️ 危険な操作</h5>
              <p className="text-sm text-red-800 mb-3">
                この操作は取り消せません。リポジトリとその全ての内容が完全に削除されます。
              </p>
              <p className="text-sm text-red-800">
                削除を確認するため、リポジトリ名「<strong>{repository.name}</strong>」を入力してください：
              </p>
            </div>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={repository.name}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={resetDeleteConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || deleteConfirmText !== repository.name}
                className="flex-1 px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '削除中...' : '削除'}
              </button>
            </div>
          </div>
        )}

        {/* Close Button */}
        {!showDeleteConfirm && (
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}