'use client'

import { useState } from 'react'
import type { Repository } from '@/types'

interface BulkOperationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (action: 'makePrivate' | 'makePublic' | 'archive' | 'unarchive' | 'delete') => void
  repositories: Repository[]
  loading: boolean
}

export default function BulkOperationModal({
  isOpen,
  onClose,
  onConfirm,
  repositories,
  loading
}: BulkOperationModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const [selectedAction, setSelectedAction] = useState<'makePrivate' | 'makePublic' | 'archive' | 'unarchive' | 'delete' | null>(null)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedAction === 'delete') {
      if (confirmText !== 'DELETE') {
        return
      }
    }
    if (selectedAction) {
      onConfirm(selectedAction)
    }
  }

  const getActionDescription = () => {
    switch (selectedAction) {
      case 'makePrivate':
        return 'これらのリポジトリをPrivateに変更します'
      case 'makePublic':
        return 'これらのリポジトリをPublicに変更します'
      case 'archive':
        return 'これらのリポジトリをアーカイブします'
      case 'unarchive':
        return 'これらのリポジトリのアーカイブを解除します'
      case 'delete':
        return '⚠️ これらのリポジトリを完全に削除します。この操作は取り消せません！'
      default:
        return '操作を選択してください'
    }
  }

  const isDeleteAction = selectedAction === 'delete'
  const canConfirm = selectedAction && (!isDeleteAction || confirmText === 'DELETE')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          一括操作 ({repositories.length}個のリポジトリ)
        </h3>

        {/* Repository List */}
        <div className="mb-4 max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
          {repositories.map((repo) => (
            <div key={repo.id} className="text-sm text-gray-600 py-1">
              {repo.full_name}
            </div>
          ))}
        </div>

        {/* Action Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            実行する操作を選択:
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="makePrivate"
                checked={selectedAction === 'makePrivate'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mr-2"
              />
              Privateに変更
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="makePublic"
                checked={selectedAction === 'makePublic'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mr-2"
              />
              Publicに変更
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="archive"
                checked={selectedAction === 'archive'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mr-2"
              />
              アーカイブ
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="unarchive"
                checked={selectedAction === 'unarchive'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mr-2"
              />
              アーカイブ解除
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="delete"
                checked={selectedAction === 'delete'}
                onChange={(e) => setSelectedAction(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-red-600 font-medium">削除</span>
            </label>
          </div>
        </div>

        {/* Action Description */}
        <div className={`mb-4 p-3 rounded ${isDeleteAction ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-sm ${isDeleteAction ? 'text-red-800' : 'text-blue-800'}`}>
            {getActionDescription()}
          </p>
        </div>

        {/* Delete Confirmation */}
        {isDeleteAction && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-red-700 mb-2">
              削除を確認するため「DELETE」と入力してください:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="DELETE"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${
              isDeleteAction 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {loading ? '実行中...' : '実行'}
          </button>
        </div>
      </div>
    </div>
  )
}