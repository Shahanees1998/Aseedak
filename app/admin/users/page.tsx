'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main admin page which has user management
    router.push('/admin')
  }, [router])

  return (
    <div className="flex justify-content-center align-items-center" style={{ height: '50vh' }}>
      <div className="text-center">
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        <p className="mt-3">Redirecting to admin dashboard...</p>
      </div>
    </div>
  )
}
