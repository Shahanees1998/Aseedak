'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { TabView, TabPanel } from 'primereact/tabview'
import { Checkbox } from 'primereact/checkbox'
import { Badge } from 'primereact/badge'
import { Chart } from 'primereact/chart'
import AvatarDisplay from '@/components/AvatarDisplay'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/store/toast.context'

interface Word {
  id: string
  word1: string
  word2: string
  word3: string
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

interface CharacterPack {
  id: string
  name: string
  description: string
  imageUrl: string
  price: number
  isActive: boolean
  characters: Character[]
}

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  price: number
  isUnlocked: boolean
  packId?: string
}

interface WordDeck {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  price: number
  isActive: boolean
  wordCount: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [characterPacks, setCharacterPacks] = useState<CharacterPack[]>([])
  const [wordDecks, setWordDecks] = useState<WordDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalRevenue: 0,
    activeUsers: 0
  })
  const [wordDialogVisible, setWordDialogVisible] = useState(false)
  const [userDialogVisible, setUserDialogVisible] = useState(false)
  const [packDialogVisible, setPackDialogVisible] = useState(false)
  const [characterDialogVisible, setCharacterDialogVisible] = useState(false)
  const [deckDialogVisible, setDeckDialogVisible] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingPack, setEditingPack] = useState<CharacterPack | null>(null)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingDeck, setEditingDeck] = useState<WordDeck | null>(null)
  const [wordForm, setWordForm] = useState({
    word1: '',
    word2: '',
    word3: '',
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
  const [packForm, setPackForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    isActive: true
  })
  const [characterForm, setCharacterForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    packId: '',
    isUnlocked: false
  })
  const [deckForm, setDeckForm] = useState({
    name: '',
    description: '',
    category: '',
    difficulty: 'easy',
    price: 0,
    isActive: true
  })
  const { showToast } = useToast()

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
    { label: 'Colors', value: 'colors' },
    { label: 'Sports', value: 'sports' },
    { label: 'Movies', value: 'movies' },
    { label: 'Music', value: 'music' }
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
    { label: 'Avatar 10', value: 'IMAGE10' },
    { label: 'Avatar 11', value: 'IMAGE11' },
    { label: 'Avatar 12', value: 'IMAGE12' },
    { label: 'Avatar 13', value: 'IMAGE13' },
    { label: 'Avatar 14', value: 'IMAGE14' },
    { label: 'Avatar 15', value: 'IMAGE15' },
    { label: 'Avatar 16', value: 'IMAGE16' },
  ]

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [wordsRes, usersRes, packsRes, decksRes] = await Promise.all([
        fetch('/api/admin/words'),
        fetch('/api/admin/users'),
        fetch('/api/admin/character-packs'),
        fetch('/api/admin/word-decks')
      ])

      if (wordsRes.ok) {
        const wordsData = await wordsRes.json()
        setWords(wordsData.words)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users)
        
        // Update stats based on actual data
        const totalUsers = usersData.users.length
        const activeUsers = usersData.users.filter((user: User) => user.isActive).length
        const totalGames = usersData.users.reduce((sum: number, user: User) => sum + (user.gamesPlayed || 0), 0)
        const totalRevenue = usersData.users.reduce((sum: number, user: User) => {
          // Assuming each user has some revenue calculation - adjust as needed
          return sum + (user.gamesPlayed || 0) * 100 // Example: $1 per game
        }, 0)
        
        setStats({
          totalUsers,
          totalGames,
          totalRevenue,
          activeUsers
        })
      }

      if (packsRes.ok) {
        const packsData = await packsRes.json()
        setCharacterPacks(packsData.characterPacks)
      }

      if (decksRes.ok) {
        const decksData = await decksRes.json()
        setWordDecks(decksData.wordDecks)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const url = editingWord ? `/api/admin/words/${editingWord.id}` : '/api/admin/words'
      const method = editingWord ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordForm)
      })

      if (response.ok) {
        showToast('success', 'Success', 'Word saved successfully!')
        setWordDialogVisible(false)
        setEditingWord(null)
        setWordForm({ word1: '', word2: '', word3: '', isActive: true })
        fetchData()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error saving word')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving word')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        showToast('success', 'Success', 'User saved successfully!')
        setUserDialogVisible(false)
        setEditingUser(null)
        setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'IMAGE1', isActive: true })
        fetchData()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error saving user')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving user')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingPack ? `/api/admin/character-packs/${editingPack.id}` : '/api/admin/character-packs'
      const method = editingPack ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packForm)
      })

      if (response.ok) {
        showToast('success', 'Success', editingPack ? 'Character pack updated successfully!' : 'Character pack created successfully!')
        setPackDialogVisible(false)
        setEditingPack(null)
        setPackForm({ name: '', description: '', imageUrl: '', price: 0, isActive: true })
        fetchData()
      } else {
        const data = await response.json()
        showToast('error', 'Error', data.message || 'Error saving character pack')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving character pack')
    }
  }

  const handleCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingCharacter ? `/api/admin/characters/${editingCharacter.id}` : '/api/admin/characters'
      const method = editingCharacter ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterForm)
      })

      if (response.ok) {
        showToast('success', 'Success', editingCharacter ? 'Character updated successfully!' : 'Character created successfully!')
        setCharacterDialogVisible(false)
        setEditingCharacter(null)
        setCharacterForm({ name: '', description: '', imageUrl: '', price: 0, packId: '', isUnlocked: false })
        fetchData()
      } else {
        const data = await response.json()
        showToast('error', 'Error', data.message || 'Error saving character')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving character')
    }
  }

  const handleDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingDeck ? `/api/admin/word-decks/${editingDeck.id}` : '/api/admin/word-decks'
      const method = editingDeck ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deckForm)
      })

      if (response.ok) {
        showToast('success', 'Success', editingDeck ? 'Word deck updated successfully!' : 'Word deck created successfully!')
        setDeckDialogVisible(false)
        setEditingDeck(null)
        setDeckForm({ name: '', description: '', category: '', difficulty: 'easy', price: 0, isActive: true })
        fetchData()
      } else {
        const data = await response.json()
        showToast('error', 'Error', data.message || 'Error saving word deck')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving word deck')
    }
  }

  const editWord = (word: Word) => {
    setEditingWord(word)
    setWordForm({
      word1: word.word1,
      word2: word.word2,
      word3: word.word3,
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
        showToast('success', 'Success', `User ${!isActive ? 'activated' : 'suspended'} successfully!`)
        fetchData()
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
       <Image src={`/images/${rowData.avatar}.png`} alt={rowData.avatar} width={32} height={32} />
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: User) => {
    const isCurrentUser = user && user.id === rowData.id
    
    return (
      <div className="flex gap-2">
        {!isCurrentUser && (
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-sm"
            onClick={() => editUser(rowData)}
            tooltip="Edit User"
            tooltipOptions={{ position: 'top' }}
          />
        )}
    { !isCurrentUser &&   <Button
          icon={rowData.isActive ? "pi pi-ban" : "pi pi-check"}
          className={`p-button-rounded p-button-text p-button-sm ${
            rowData.isActive ? 'p-button-danger' : 'p-button-success'
          }`}
          onClick={() => toggleUserStatus(rowData.id, rowData.isActive)}
          tooltip={rowData.isActive ? "Suspend User" : "Activate User"}
          tooltipOptions={{ position: 'top' }}
          disabled={!!isCurrentUser}
        />}
        {!isCurrentUser && (
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-sm p-button-danger"
            onClick={() => deleteUser(rowData.id)}
            tooltip="Delete User"
            tooltipOptions={{ position: 'top' }}
          />
        )}
        {/* {isCurrentUser && (
          <span className="text-500 text-sm p-2">
            <i className="pi pi-info-circle mr-1"></i>
            Current User
          </span>
        )} */}
      </div>
    )
  }

  const wordActionsBodyTemplate = (rowData: Word) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => editWord(rowData)}
          tooltip="Edit Word"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => deleteWord(rowData.id)}
          tooltip="Delete Word"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    )
  }

  const editPack = (pack: CharacterPack) => {
    setEditingPack(pack)
    setPackForm({
      name: pack.name,
      description: pack.description,
      imageUrl: pack.imageUrl,
      price: pack.price,
      isActive: pack.isActive
    })
    setPackDialogVisible(true)
  }

  const editCharacter = (character: Character) => {
    setEditingCharacter(character)
    setCharacterForm({
      name: character.name,
      description: character.description,
      imageUrl: character.imageUrl,
      price: character.price,
      packId: character.packId || '',
      isUnlocked: character.isUnlocked
    })
    setCharacterDialogVisible(true)
  }

  const editDeck = (deck: WordDeck) => {
    setEditingDeck(deck)
    setDeckForm({
      name: deck.name,
      description: deck.description,
      category: deck.category,
      difficulty: deck.difficulty,
      price: deck.price,
      isActive: deck.isActive
    })
    setDeckDialogVisible(true)
  }

  const deletePack = async (id: string) => {
    if (confirm('Are you sure you want to delete this character pack?')) {
      try {
        const response = await fetch(`/api/admin/character-packs/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Character pack deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting character pack')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting character pack')
      }
    }
  }

  const deleteCharacter = async (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        const response = await fetch(`/api/admin/characters/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Character deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting character')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting character')
      }
    }
  }

  const deleteDeck = async (id: string) => {
    if (confirm('Are you sure you want to delete this word deck?')) {
      try {
        const response = await fetch(`/api/admin/word-decks/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Word deck deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting word deck')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting word deck')
      }
    }
  }

  const deleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`/api/admin/users/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'User deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting user')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting user')
      }
    }
  }

  const deleteWord = async (id: string) => {
    if (confirm('Are you sure you want to delete this word set?')) {
      try {
        const response = await fetch(`/api/admin/words/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Word set deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting word set')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting word set')
      }
    }
  }

  const priceTemplate = (rowData: any) => {
    return `$${(rowData.price / 100).toFixed(2)}`
  }

  const statusTemplate = (rowData: any) => {
    return (
      <span className={`badge ${rowData.isActive ? 'badge-success' : 'badge-danger'}`}>
        {rowData.isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p className="mt-3 text-color-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      {/* Stats Cards */}
      <div className="col-12">
        <div className="grid">
          <div className="col-12 md:col-6 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Total Users</span>
                  <div className="text-900 font-medium text-xl">{stats.totalUsers}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-users text-blue-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Total Games</span>
                  <div className="text-900 font-medium text-xl">{stats.totalGames}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-gamepad text-orange-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Revenue</span>
                  <div className="text-900 font-medium text-xl">${(stats.totalRevenue / 100).toFixed(2)}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-dollar text-cyan-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <div className="card mb-0">
              <div className="flex justify-content-between mb-3">
                <div>
                  <span className="block text-500 font-medium mb-3">Active Users</span>
                  <div className="text-900 font-medium text-xl">{stats.activeUsers}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-user text-purple-500 text-xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="col-12">
        <div className="card">
          <h5>Quick Actions</h5>
          <p className="text-color-secondary">Create game rooms and play games</p>
          <div className="flex gap-3 mt-4">
            <Button
              label="Create Game Room"
              icon="pi pi-plus"
              onClick={() => window.open('/create-room', '_blank')}
              className="p-button-primary"
              tooltip="Create a new game room to play with other users"
              tooltipOptions={{ position: 'top' }}
            />
            <Button
              label="Join Game Room"
              icon="pi pi-sign-in"
              onClick={() => {
                const roomCode = prompt('Enter room code to join:')
                if (roomCode) {
                  window.open(`/game/${roomCode}`, '_blank')
                }
              }}
              className="p-button-outlined p-button-primary"
              tooltip="Join an existing game room using room code"
              tooltipOptions={{ position: 'top' }}
            />
            <Button
              label="View All Games"
              icon="pi pi-list"
              onClick={() => window.open('/admin/games', '_blank')}
              className="p-button-outlined p-button-secondary"
              tooltip="View all active game rooms and their status"
              tooltipOptions={{ position: 'top' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-12">
        <div className="card">
          <h5>Admin Dashboard</h5>
          <p className="text-color-secondary">Manage words, users, character packs, and word decks</p>


          {/* Tabs */}
          <TabView>
            {/* Words Tab */}
            <TabPanel header="Words Management">
              <div className="flex justify-content-between align-items-center mb-4">
                <h6 className="m-0">Word Sets</h6>
                <Button
                  label="Add New Word Set"
                  icon="pi pi-plus"
                  onClick={() => {
                    setEditingWord(null)
                    setWordForm({ word1: '', word2: '', word3: '', isActive: true })
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
            </TabPanel>

            {/* Users Tab */}
            <TabPanel header="Users Management">
              <div className="flex justify-content-between align-items-center mb-4">
                <h6 className="m-0">Users</h6>
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
            </TabPanel>
          </TabView>

        {/* Word Dialog */}
        <Dialog
          header={editingWord ? "Edit Word Set" : "Add New Word Set"}
          visible={wordDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setWordDialogVisible(false)}
        >
          <form onSubmit={handleWordSubmit}>
            <div className="grid">
              <div className="col-12">
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="word1" className="block text-900 font-medium mb-2">Word 1 *</label>
                      <InputText
                        id="word1"
                        value={wordForm.word1}
                        onChange={(e) => setWordForm(prev => ({ ...prev, word1: e.target.value }))}
                        placeholder="Enter word 1"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="word2" className="block text-900 font-medium mb-2">Word 2 *</label>
                      <InputText
                        id="word2"
                        value={wordForm.word2}
                        onChange={(e) => setWordForm(prev => ({ ...prev, word2: e.target.value }))}
                        placeholder="Enter word 2"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-4">
                    <div className="field">
                      <label htmlFor="word3" className="block text-900 font-medium mb-2">Word 3 *</label>
                      <InputText
                        id="word3"
                        value={wordForm.word3}
                        onChange={(e) => setWordForm(prev => ({ ...prev, word3: e.target.value }))}
                        placeholder="Enter word 3"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12">
                <div className="p-3 border-round bg-blue-50 border-1 border-blue-200 mb-3">
                  <p className="text-blue-800 text-sm m-0">
                    <strong>Note:</strong> All three words are mandatory. Each word set will be randomly assigned to players during games.
                  </p>
                </div>
              </div>
              

              <div className="col-12">
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button
                    label="Cancel"
                    onClick={() => setWordDialogVisible(false)}
                    className="p-button-secondary"
                    type="button"
                    disabled={submitting}
                  />
                  <Button
                    label="Save"
                    type="submit"
                    className="p-button-primary"
                    loading={submitting}
                    disabled={submitting}
                  />
                </div>
              </div>
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
          <form onSubmit={handleUserSubmit}>
            <div className="grid">
              <div className="col-12">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label htmlFor="firstName" className="block text-900 font-medium mb-2">First Name *</label>
                      <InputText
                        id="firstName"
                        value={userForm.firstName}
                        onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label htmlFor="lastName" className="block text-900 font-medium mb-2">Last Name *</label>
                      <InputText
                        id="lastName"
                        value={userForm.lastName}
                        onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12">
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label htmlFor="username" className="block text-900 font-medium mb-2">Username *</label>
                      <InputText
                        id="username"
                        value={userForm.username}
                        onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="Enter username"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-12 md:col-6">
                    <div className="field">
                      <label htmlFor="email" className="block text-900 font-medium mb-2">Email *</label>
                      <InputText
                        id="email"
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email"
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12">
                <div className="field">
                  <label htmlFor="avatar" className="block text-900 font-medium mb-2">Avatar *</label>
                  <Dropdown
                    id="avatar"
                    value={userForm.avatar}
                    onChange={(e) => setUserForm(prev => ({ ...prev, avatar: e.value }))}
                    options={avatarOptions}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button
                    label="Cancel"
                    onClick={() => setUserDialogVisible(false)}
                    className="p-button-secondary"
                    type="button"
                    disabled={submitting}
                  />
                  <Button
                    label="Save"
                    type="submit"
                    className="p-button-primary"
                    loading={submitting}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          </form>
        </Dialog>

        {/* Character Pack Dialog */}
        <Dialog 
          header={editingPack ? "Edit Character Pack" : "Add Character Pack"}
          visible={packDialogVisible} 
          onHide={() => setPackDialogVisible(false)}
          style={{ width: '50vw' }}
        >
          <form onSubmit={handlePackSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Name</label>
              <InputText
                value={packForm.name}
                onChange={(e) => setPackForm({ ...packForm, name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Description</label>
              <InputTextarea
                value={packForm.description}
                onChange={(e) => setPackForm({ ...packForm, description: e.target.value })}
                className="w-full"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Image URL</label>
              <InputText
                value={packForm.imageUrl}
                onChange={(e) => setPackForm({ ...packForm, imageUrl: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Price (cents)</label>
              <InputNumber
                value={packForm.price}
                onValueChange={(e) => setPackForm({ ...packForm, price: e.value || 0 })}
                className="w-full"
                min={0}
                required
              />
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={packForm.isActive}
                onChange={(e) => setPackForm({ ...packForm, isActive: e.checked || false })}
              />
              <label className="ml-2 text-white">Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                label="Cancel" 
                onClick={() => setPackDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button 
                type="submit" 
                label={editingPack ? "Update" : "Create"}
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>

        {/* Character Dialog */}
        <Dialog 
          header={editingCharacter ? "Edit Character" : "Add Character"}
          visible={characterDialogVisible} 
          onHide={() => setCharacterDialogVisible(false)}
          style={{ width: '50vw' }}
        >
          <form onSubmit={handleCharacterSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Name</label>
              <InputText
                value={characterForm.name}
                onChange={(e) => setCharacterForm({ ...characterForm, name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Description</label>
              <InputTextarea
                value={characterForm.description}
                onChange={(e) => setCharacterForm({ ...characterForm, description: e.target.value })}
                className="w-full"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Image URL</label>
              <InputText
                value={characterForm.imageUrl}
                onChange={(e) => setCharacterForm({ ...characterForm, imageUrl: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Pack</label>
              <Dropdown
                value={characterForm.packId}
                onChange={(e) => setCharacterForm({ ...characterForm, packId: e.value })}
                options={characterPacks.map(pack => ({ label: pack.name, value: pack.id }))}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Price (cents)</label>
              <InputNumber
                value={characterForm.price}
                onValueChange={(e) => setCharacterForm({ ...characterForm, price: e.value || 0 })}
                className="w-full"
                min={0}
                required
              />
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={characterForm.isUnlocked}
                onChange={(e) => setCharacterForm({ ...characterForm, isUnlocked: e.checked || false })}
              />
              <label className="ml-2 text-white">Unlocked by default</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                label="Cancel" 
                onClick={() => setCharacterDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button 
                type="submit" 
                label={editingCharacter ? "Update" : "Create"}
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>

        {/* Word Deck Dialog */}
        <Dialog 
          header={editingDeck ? "Edit Word Deck" : "Add Word Deck"}
          visible={deckDialogVisible} 
          onHide={() => setDeckDialogVisible(false)}
          style={{ width: '50vw' }}
        >
          <form onSubmit={handleDeckSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-2">Name</label>
              <InputText
                value={deckForm.name}
                onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Description</label>
              <InputTextarea
                value={deckForm.description}
                onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                className="w-full"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Category</label>
              <Dropdown
                value={deckForm.category}
                onChange={(e) => setDeckForm({ ...deckForm, category: e.value })}
                options={categoryOptions}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Difficulty</label>
              <Dropdown
                value={deckForm.difficulty}
                onChange={(e) => setDeckForm({ ...deckForm, difficulty: e.value })}
                options={difficultyOptions}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-white mb-2">Price (cents)</label>
              <InputNumber
                value={deckForm.price}
                onValueChange={(e) => setDeckForm({ ...deckForm, price: e.value || 0 })}
                className="w-full"
                min={0}
                required
              />
            </div>
            <div className="flex items-center">
              <Checkbox
                checked={deckForm.isActive}
                onChange={(e) => setDeckForm({ ...deckForm, isActive: e.checked || false })}
              />
              <label className="ml-2 text-white">Active</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                label="Cancel" 
                onClick={() => setDeckDialogVisible(false)}
                className="p-button-secondary"
              />
              <Button 
                type="submit" 
                label={editingDeck ? "Update" : "Create"}
                className="p-button-primary"
              />
            </div>
          </form>
        </Dialog>
        </div>
      </div>
    </div>
  )
}
