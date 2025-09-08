'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { Badge } from 'primereact/badge'
import AvatarDisplay from '@/components/AvatarDisplay'
import { TabView, TabPanel } from 'primereact/tabview'

interface Word {
  id: string
  word1: string
  word2: string
  word3: string
  category: string
  difficulty: string
  isActive: boolean
  createdAt: string
}

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

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' }
]

const categoryOptions = [
  { label: 'Animals', value: 'animals' },
  { label: 'Food', value: 'food' },
  { label: 'Objects', value: 'objects' },
  { label: 'Places', value: 'places' },
  { label: 'Actions', value: 'actions' },
  { label: 'Colors', value: 'colors' }
]

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
  { label: 'Avatar 10', value: 'IMAGE10' }
]

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [words, setWords] = useState<Word[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [wordDialogVisible, setWordDialogVisible] = useState(false)
  const [userDialogVisible, setUserDialogVisible] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [wordForm, setWordForm] = useState({
    word1: '',
    word2: '',
    word3: '',
    category: '',
    difficulty: 'easy',
    isActive: true
  })
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    avatar: 'IMAGE1',
    isActive: true
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [wordsRes, usersRes] = await Promise.all([
        fetch('/api/admin/words'),
        fetch('/api/admin/users')
      ])

      if (wordsRes.ok) {
        const wordsData = await wordsRes.json()
        setWords(wordsData.words)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingWord ? `/api/admin/words/${editingWord.id}` : '/api/admin/words'
      const method = editingWord ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordForm)
      })

      if (response.ok) {
        setMessage('Word saved successfully!')
        setWordDialogVisible(false)
        setEditingWord(null)
        setWordForm({ word1: '', word2: '', word3: '', category: '', difficulty: 'easy', isActive: true })
        fetchData()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Error saving word')
      }
    } catch (error) {
      setMessage('Error saving word')
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
        setMessage('User saved successfully!')
        setUserDialogVisible(false)
        setEditingUser(null)
        setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'WARRIOR', isActive: true })
        fetchData()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Error saving user')
      }
    } catch (error) {
      setMessage('Error saving user')
    }
  }

  const editWord = (word: Word) => {
    setEditingWord(word)
    setWordForm({
      word1: word.word1,
      word2: word.word2,
      word3: word.word3,
      category: word.category,
      difficulty: word.difficulty,
      isActive: word.isActive
    })
    setWordDialogVisible(true)
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
        setMessage(`User ${!isActive ? 'activated' : 'suspended'} successfully!`)
        fetchData()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Error updating user status')
      }
    } catch (error) {
      setMessage('Error updating user status')
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
          avatarType={rowData.avatar}
          size="small" 
          className="mr-2"
        />
        <span className="capitalize">{rowData.avatar.toLowerCase()}</span>
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

  const wordActionsBodyTemplate = (rowData: Word) => {
    return (
      <div className="flex space-x-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => editWord(rowData)}
        />
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-300">Manage words, users, and game settings</p>
        </div>

        {/* Message */}
        {message && (
          <Message 
            severity="success" 
            text={message} 
            className="mb-6"
            onClose={() => setMessage('')}
          />
        )}

        {/* Tabs */}
        <TabView>
          {/* Words Tab */}
          <TabPanel header="Words Management">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">Word Sets</h2>
                  <Button
                    label="Add New Word Set"
                    icon="pi pi-plus"
                    onClick={() => {
                      setEditingWord(null)
                      setWordForm({ word1: '', word2: '', word3: '', category: '', difficulty: 'easy', isActive: true })
                      setWordDialogVisible(true)
                    }}
                    className="p-button-primary"
                  />
                </div>

                <DataTable
                  value={words}
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  className="p-datatable-sm"
                  emptyMessage="No words found"
                >
                  <Column field="word1" header="Word 1" sortable />
                  <Column field="word2" header="Word 2" sortable />
                  <Column field="word3" header="Word 3" sortable />
                  <Column field="category" header="Category" sortable />
                  <Column field="difficulty" header="Difficulty" sortable />
                  <Column 
                    field="isActive" 
                    header="Status" 
                    body={(rowData) => (
                      <Badge 
                        value={rowData.isActive ? 'Active' : 'Inactive'} 
                        severity={rowData.isActive ? 'success' : 'secondary'} 
                      />
                    )}
                  />
                  <Column header="Actions" body={wordActionsBodyTemplate} />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel header="Users Management">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">Users</h2>
                  <Button
                    label="Add New User"
                    icon="pi pi-plus"
                    onClick={() => {
                      setEditingUser(null)
                      setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'WARRIOR', isActive: true })
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
                >
                  <Column field="username" header="Username" sortable />
                  <Column field="firstName" header="First Name" sortable />
                  <Column field="lastName" header="Last Name" sortable />
                  <Column field="email" header="Email" sortable />
                  <Column header="Avatar" body={avatarBodyTemplate} />
                  <Column field="gamesPlayed" header="Games Played" sortable />
                  <Column field="gamesWon" header="Games Won" sortable />
                  <Column field="totalKills" header="Total Kills" sortable />
                  <Column header="Status" body={statusBodyTemplate} />
                  <Column header="Actions" body={actionsBodyTemplate} />
                </DataTable>
              </div>
            </Card>
          </TabPanel>
        </TabView>

        {/* Word Dialog */}
        <Dialog
          header={editingWord ? "Edit Word Set" : "Add New Word Set"}
          visible={wordDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setWordDialogVisible(false)}
        >
          <form onSubmit={handleWordSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white mb-2">Word 1</label>
                <InputText
                  value={wordForm.word1}
                  onChange={(e) => setWordForm(prev => ({ ...prev, word1: e.target.value }))}
                  placeholder="Enter word 1"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Word 2</label>
                <InputText
                  value={wordForm.word2}
                  onChange={(e) => setWordForm(prev => ({ ...prev, word2: e.target.value }))}
                  placeholder="Enter word 2"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Word 3</label>
                <InputText
                  value={wordForm.word3}
                  onChange={(e) => setWordForm(prev => ({ ...prev, word3: e.target.value }))}
                  placeholder="Enter word 3"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Category</label>
                <Dropdown
                  value={wordForm.category}
                  onChange={(e) => setWordForm(prev => ({ ...prev, category: e.value }))}
                  options={categoryOptions}
                  placeholder="Select category"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Difficulty</label>
                <Dropdown
                  value={wordForm.difficulty}
                  onChange={(e) => setWordForm(prev => ({ ...prev, difficulty: e.value }))}
                  options={difficultyOptions}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                label="Cancel"
                onClick={() => setWordDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button
                label="Save"
                type="submit"
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>

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
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Last Name</label>
                <InputText
                  value={userForm.lastName}
                  onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
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
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-white mb-2">Email</label>
                <InputText
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
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
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                label="Cancel"
                onClick={() => setUserDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button
                label="Save"
                type="submit"
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>
      </div>
    </div>
  )
}
