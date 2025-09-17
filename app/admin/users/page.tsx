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
import { Badge } from 'primereact/badge'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface User {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
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
    isActive: true
  })


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
      showToast('error', t('common.error'), t('admin.users.errorFetching'))
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
        showToast('success', t('common.success'), editingUser ? t('admin.users.userUpdated') : t('admin.users.userCreated'))
        setUserDialogVisible(false)
        setEditingUser(null)
        setUserForm({ firstName: '', lastName: '', username: '', email: '', isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', t('common.error'), error.message || t('admin.users.errorSaving'))
      }
    } catch (error) {
      showToast('error', t('common.error'), t('admin.users.errorSaving'))
    }
  }

  const editUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
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
        showToast('success', t('common.success'), !isActive ? t('admin.users.userActivated') : t('admin.users.userSuspended'))
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', t('common.error'), error.message || t('admin.users.errorUpdatingStatus'))
      }
    } catch (error) {
      showToast('error', t('common.error'), t('admin.users.errorUpdatingStatus'))
    }
  }

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Badge 
        value={rowData.isActive ? t('admin.users.active') : t('admin.users.suspended')} 
        severity={rowData.isActive ? 'success' : 'danger'} 
      />
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
          <h5>{t('admin.users.title')}</h5>
          <p className="text-color-secondary">{t('admin.users.subtitle')}</p>
        </div>
      </div>

      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h6 className="m-0">{t('admin.users.usersList')}</h6>
          </div>

          <DataTable
            value={users}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage={t('admin.users.noUsers')}
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column field="username" header={t('admin.users.username')} sortable />
            <Column field="email" header={t('admin.users.email')} sortable />
            <Column field="gamesPlayed" header={t('admin.users.gamesPlayed')} sortable />
            <Column field="gamesWon" header={t('admin.users.gamesWon')} sortable />
            <Column field="totalKills" header={t('admin.users.totalKills')} sortable />
            <Column header={t('admin.users.status')} body={statusBodyTemplate} />
            <Column header={t('admin.users.actions')} body={actionsBodyTemplate} />
          </DataTable>
        </Card>
      </div>

      {/* User Dialog */}
        <Dialog
          header={editingUser ? t('admin.users.editUser') : t('admin.users.addNewUser')}
          visible={userDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setUserDialogVisible(false)}
        >
          <form onSubmit={handleUserSubmit}>
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="firstName" className="block text-900 font-medium mb-2">{t('admin.users.firstName')} *</label>
                  <InputText
                    id="firstName"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder={t('admin.users.firstNamePlaceholder')}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="lastName" className="block text-900 font-medium mb-2">{t('admin.users.lastName')} *</label>
                  <InputText
                    id="lastName"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder={t('admin.users.lastNamePlaceholder')}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="username" className="block text-900 font-medium mb-2">{t('admin.users.username')} *</label>
                  <InputText
                    id="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder={t('admin.users.usernamePlaceholder')}
                    className="w-full"
                    required
                  />
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="field">
                  <label htmlFor="email" className="block text-900 font-medium mb-2">{t('admin.users.email')} *</label>
                  <InputText
                    id="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t('admin.users.emailPlaceholder')}
                    type="email"
                    className="w-full"
                    required
                  />
                </div>
              </div>


              <div className="col-12">
                <div className="field-checkbox">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-900">{t('admin.users.active')}</label>
                </div>
              </div>

              <div className="col-12">
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button
                    label={t('common.cancel')}
                    onClick={() => setUserDialogVisible(false)}
                    className="p-button-secondary"
                    type="button"
                  />
                  <Button
                    label={editingUser ? t('common.update') : t('common.create')}
                    type="submit"
                    className="p-button-primary"
                  />
                </div>
              </div>
            </div>
          </form>
        </Dialog>
    </div>
  )
}
