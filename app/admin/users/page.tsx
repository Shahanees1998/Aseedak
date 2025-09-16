'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Dropdown } from 'primereact/dropdown'
import { Badge } from 'primereact/badge'
import AvatarDisplay from '@/components/AvatarDisplay'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatar: string
  role: string
  isActive: boolean
  gamesPlayed: number
  gamesWon: number
  totalKills: number
  createdAt: string
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userDialogVisible, setUserDialogVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    avatar: 'IMAGE1',
    isActive: true
  })

  const avatarOptions = [
    { label: 'Avatar 1', value: 'IMAGE1' },
    { label: 'Avatar 2', value: 'IMAGE2' },
    { label: 'Avatar 3', value: 'IMAGE3' },
    { label: 'Avatar 4', value: 'IMAGE4' },
    { label: 'Avatar 5', value: 'IMAGE5' },
    { label: 'Avatar 6', value: 'IMAGE6' },
    { label: 'Avatar 7', value: 'IMAGE7' },
    { label: 'Avatar 8', value: 'IMAGE8' },
    { label: 'Avatar 9', value: 'IMAGE9' },
    { label: 'Avatar 10', value: 'IMAGE10' },
    { label: 'Avatar 11', value: 'IMAGE11' },
    { label: 'Avatar 12', value: 'IMAGE12' },
    { label: 'Avatar 13', value: 'IMAGE13' },
    { label: 'Avatar 14', value: 'IMAGE14' },
    { label: 'Avatar 15', value: 'IMAGE15' },
    { label: 'Avatar 16', value: 'IMAGE16' },
  ]

  useEffect(() => {
    if (authLoading) return
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchUsers()
  }, [user, authLoading, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      showToast('error', 'Error', 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        showToast('success', 'Success', editingUser ? 'User updated successfully!' : 'User created successfully!')
        setUserDialogVisible(false)
        setEditingUser(null)
        setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'IMAGE1', isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error saving user')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving user')
    }
  }

  const editUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isActive: user.isActive
    })
    setUserDialogVisible(true)
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        showToast('success', 'Success', `User ${!isActive ? 'activated' : 'suspended'} successfully!`)
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error updating user status')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error updating user status')
    }
  }

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Badge 
        value={rowData.isActive ? 'Active' : 'Suspended'} 
        severity={rowData.isActive ? 'success' : 'danger'} 
      />
    )
  }

  const avatarBodyTemplate = (rowData: User) => {
    return (
      <div className="flex items-center">
        <AvatarDisplay 
          avatarType={rowData.avatar || 'IMAGE1'}
          size="normal" 
          className="mr-2"
        />
        <span className="capitalize">{(rowData.avatar || 'IMAGE1').toLowerCase()}</span>
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: User) => {
    return (
      <div className="flex space-x-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => editUser(rowData)}
        />
        <Button
          icon={rowData.isActive ? "pi pi-ban" : "pi pi-check"}
          className={`p-button-rounded p-button-text p-button-sm ${
            rowData.isActive ? 'p-button-danger' : 'p-button-success'
          }`}
          onClick={() => toggleUserStatus(rowData.id, rowData.isActive)}
        />
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>User Management</h5>
          <p className="text-color-secondary">Manage all users in the system</p>
        </div>
      </div>

      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h6 className="m-0">All Users</h6>
            <Button
              label="Add New User"
              icon="pi pi-plus"
              onClick={() => {
                setEditingUser(null)
                setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'IMAGE1', isActive: true })
                setUserDialogVisible(true)
              }}
              className="p-button-primary"
            />
          </div>

          <DataTable
            value={users}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage="No users found"
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column field="username" header="Username" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="gamesPlayed" header="Games Played" sortable />
            <Column field="gamesWon" header="Games Won" sortable />
            <Column field="totalKills" header="Total Kills" sortable />
            <Column header="Status" body={statusBodyTemplate} />
            <Column header="Actions" body={actionsBodyTemplate} />
          </DataTable>
        </Card>
      </div>

      {/* User Dialog */}
        <Dialog
          header={editingUser ? "Edit User" : "Add New User"}
          visible={userDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setUserDialogVisible(false)}
        >
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">First Name</label>
                <InputText
                  value={userForm.firstName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="First Name"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Last Name</label>
                <InputText
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Username</label>
                <InputText
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Email</label>
                <InputText
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2">Avatar</label>
              <Dropdown
                value={userForm.avatar}
                onChange={(e) => setUserForm(prev => ({ ...prev, avatar: e.value }))}
                options={avatarOptions}
                placeholder="Select Avatar"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={userForm.isActive}
                onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-white">Active</label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                label="Cancel"
                onClick={() => setUserDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button
                label={editingUser ? "Update" : "Create"}
                type="submit"
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>
    </div>
  )
}
