'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Toast } from 'primereact/toast'
import { useRef } from 'react'

interface AdminNotification {
  type: string
  title: string
  message: string
  timestamp: string
  data?: any
}

export default function AdminNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const toast = useRef<Toast>(null)

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      return
    }

    // Initialize Pusher for admin notifications
    const initializeAdminNotifications = async () => {
      try {
        // Check if Pusher is configured
        if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUBLIC_PUSHER_CLUSTER) {
          console.warn('⚠️ Pusher not configured - admin notifications disabled')
          return
        }

        const Pusher = (await import('pusher-js')).default

        // Get the JWT token from cookies
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]

        const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        })

        const adminChannelName = `admin-${user.id}`
        console.log('📡 Admin subscribing to channel:', adminChannelName)
        
        const adminChannel = pusherInstance.subscribe(adminChannelName)
        
        // Connection status
        pusherInstance.connection.bind('connected', () => {
          console.log('✅ Admin Pusher connected successfully')
          setIsConnected(true)
        })
        
        pusherInstance.connection.bind('disconnected', () => {
          console.log('❌ Admin Pusher disconnected')
          setIsConnected(false)
        })
        
        pusherInstance.connection.bind('error', (error: any) => {
          console.error('❌ Admin Pusher connection error:', error)
        })

        // Listen for new user registration notifications
        adminChannel.bind('new-user-registration', (data: AdminNotification) => {
          console.log('👤 New user registration notification:', data)
          setNotifications(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 notifications
          
          // Show toast notification
          if (toast.current) {
            toast.current.show({
              severity: 'info',
              summary: data.title,
              detail: data.message,
              life: 5000
            })
          }
        })

        // Listen for new game room creation notifications
        adminChannel.bind('new-game-room', (data: AdminNotification) => {
          console.log('🎮 New game room notification:', data)
          setNotifications(prev => [data, ...prev.slice(0, 9)]) // Keep last 10 notifications
          
          // Show toast notification
          if (toast.current) {
            toast.current.show({
              severity: 'success',
              summary: data.title,
              detail: data.message,
              life: 5000
            })
          }
        })

        // Listen for game room status changes
        adminChannel.bind('game-room-status-change', (data: AdminNotification) => {
          console.log('🎮 Game room status change notification:', data)
          setNotifications(prev => [data, ...prev.slice(0, 9)])
          
          if (toast.current) {
            toast.current.show({
              severity: 'warn',
              summary: data.title,
              detail: data.message,
              life: 5000
            })
          }
        })

        // Listen for user statistics updates
        adminChannel.bind('user-statistics-update', (data: AdminNotification) => {
          console.log('📊 User statistics update notification:', data)
          setNotifications(prev => [data, ...prev.slice(0, 9)])
          
          if (toast.current) {
            toast.current.show({
              severity: 'info',
              summary: data.title,
              detail: data.message,
              life: 5000
            })
          }
        })

        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up admin notifications')
          pusherInstance.disconnect()
        }

      } catch (error) {
        console.error('❌ Error initializing admin notifications:', error)
      }
    }

    initializeAdminNotifications()

  }, [user])

  // Don't render anything if user is not admin
  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <Toast ref={toast} />
      
      {/* Connection status indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 Admin Notifications Active' : '🔴 Admin Notifications Offline'}
        </div>
      </div>

      {/* Recent notifications panel (optional - can be added to admin dashboard) */}
      {notifications.length > 0 && (
        <div className="fixed top-16 right-4 z-40 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Recent Admin Notifications</h3>
          </div>
          <div className="p-2">
            {notifications.map((notification, index) => (
              <div key={index} className="p-2 mb-2 bg-gray-50 rounded text-xs">
                <div className="font-medium text-gray-900">{notification.title}</div>
                <div className="text-gray-600 mt-1">{notification.message}</div>
                <div className="text-gray-400 mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

