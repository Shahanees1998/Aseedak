'use client'

import { useState, useRef } from 'react'
import { Button } from 'primereact/button'
import { ProgressBar } from 'primereact/progressbar'
import { Message } from 'primereact/message'
import { Avatar } from 'primereact/avatar'
import { useAuth } from '@/hooks/useAuth'

interface ProfileImageUploadProps {
  currentImageUrl?: string
  onImageUpdate?: (imageUrl: string) => void
  size?: 'normal' | 'large' | 'xlarge'
  className?: string
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
  size = 'xlarge',
  className = ''
}: ProfileImageUploadProps) {
  const { user, refreshUser } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      setMessageType('error')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setMessage('File size too large. Maximum size is 5MB.')
      setMessageType('error')
      return
    }

    await uploadImage(file)
  }

  const uploadImage = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('image', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (response.ok) {
        setMessage('Profile image uploaded successfully!')
        setMessageType('success')
        
        // Refresh user data to get updated profile image
        await refreshUser()

        // Call callback if provided
        if (onImageUpdate) {
          onImageUpdate(data.imageUrl)
        }
      } else {
        setMessage(data.message || 'Upload failed')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Upload failed. Please try again.')
      setMessageType('error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteImage = async () => {
    if (!currentImageUrl) return

    try {
      const response = await fetch('/api/upload/profile-image', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Profile image deleted successfully!')
        setMessageType('success')
        
        // Refresh user data to get updated profile image
        await refreshUser()

        // Call callback if provided
        if (onImageUpdate) {
          onImageUpdate('')
        }
      } else {
        setMessage(data.message || 'Delete failed')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Delete failed. Please try again.')
      setMessageType('error')
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`profile-image-upload ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Current Profile Image */}
        <div className="relative">
          <Avatar
            image={currentImageUrl}
            icon="pi pi-user"
            size={size}
            shape="circle"
            className="border-2 border-white shadow-lg"
          />
          
          {/* Upload Overlay */}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <ProgressBar 
                value={uploadProgress} 
                className="w-16 h-16"
                showValue={false}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            label="Upload Image"
            icon="pi pi-upload"
            onClick={triggerFileSelect}
            disabled={uploading}
            size="small"
            className="p-button-primary"
          />
          
          {currentImageUrl && (
            <Button
              label="Delete"
              icon="pi pi-trash"
              onClick={deleteImage}
              disabled={uploading}
              size="small"
              className="p-button-danger"
            />
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Message */}
        {message && (
          <Message
            severity={messageType}
            text={message}
            className="w-full"
          />
        )}

        {/* File Requirements */}
        <div className="text-xs text-gray-500 text-center">
          <p>Supported formats: JPEG, PNG, WebP</p>
          <p>Maximum size: 5MB</p>
        </div>
      </div>
    </div>
  )
}
