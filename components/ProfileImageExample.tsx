'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ProfileImageUpload from './ProfileImageUpload'
import { Card } from 'primereact/card'

export default function ProfileImageExample() {
  const { user } = useAuth()
  const [currentImageUrl, setCurrentImageUrl] = useState(user?.profileImage || '')

  const handleImageUpdate = (imageUrl: string) => {
    setCurrentImageUrl(imageUrl)
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card title="Profile Image Upload" className="text-center">
        <div className="space-y-6">
          {/* Profile Image Upload Component */}
          <ProfileImageUpload
            currentImageUrl={currentImageUrl}
            onImageUpdate={handleImageUpdate}
            size="xlarge"
          />

          {/* Current User Info */}
          <div className="text-sm text-gray-600">
            <p><strong>Username:</strong> {user?.firstName || 'N/A'}</p>
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
            <p><strong>Avatar:</strong> {user?.profileImage || 'N/A'}</p>
            {currentImageUrl && (
              <p><strong>Profile Image:</strong> Uploaded ✅</p>
            )}
          </div>

          {/* Image URL Display */}
          {currentImageUrl && (
            <div className="bg-gray-100 p-3 rounded">
              <p className="text-xs text-gray-500 mb-2">Image URL:</p>
              <p className="text-xs break-all">{currentImageUrl}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
