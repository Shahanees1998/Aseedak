'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Message } from 'primereact/message'
import { TabView, TabPanel } from 'primereact/tabview'
import { Checkbox } from 'primereact/checkbox'
import { Badge } from 'primereact/badge'
import AvatarDisplay from '@/components/AvatarDisplay'
import { useTranslations } from 'next-intl'

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const t = useTranslations('admin')
  const [words, setWords] = useState<Word[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [characterPacks, setCharacterPacks] = useState<CharacterPack[]>([])
  const [wordDecks, setWordDecks] = useState<WordDeck[]>([])
  const [loading, setLoading] = useState(true)
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
  const [message, setMessage] = useState('')

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
    { label: 'Avatar 10', value: 'IMAGE10' }
  ]

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
        setUserForm({ firstName: '', lastName: '', username: '', email: '', avatar: 'IMAGE1', isActive: true })
        fetchData()
      } else {
        const error = await response.json()
        setMessage(error.message || 'Error saving user')
      }
    } catch (error) {
      setMessage('Error saving user')
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
        setMessage(editingPack ? 'Character pack updated successfully!' : 'Character pack created successfully!')
        setPackDialogVisible(false)
        setEditingPack(null)
        setPackForm({ name: '', description: '', imageUrl: '', price: 0, isActive: true })
        fetchData()
      } else {
        const data = await response.json()
        setMessage(data.message || 'Error saving character pack')
      }
    } catch (error) {
      setMessage('Error saving character pack')
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
        setMessage(editingCharacter ? 'Character updated successfully!' : 'Character created successfully!')
        setCharacterDialogVisible(false)
        setEditingCharacter(null)
        setCharacterForm({ name: '', description: '', imageUrl: '', price: 0, packId: '', isUnlocked: false })
        fetchData()
      } else {
        const data = await response.json()
        setMessage(data.message || 'Error saving character')
      }
    } catch (error) {
      setMessage('Error saving character')
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
        setMessage(editingDeck ? 'Word deck updated successfully!' : 'Word deck created successfully!')
        setDeckDialogVisible(false)
        setEditingDeck(null)
        setDeckForm({ name: '', description: '', category: '', difficulty: 'easy', price: 0, isActive: true })
        fetchData()
      } else {
        const data = await response.json()
        setMessage(data.message || 'Error saving word deck')
      }
    } catch (error) {
      setMessage('Error saving word deck')
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
          setMessage('Character pack deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          setMessage(data.message || 'Error deleting character pack')
        }
      } catch (error) {
        setMessage('Error deleting character pack')
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
          setMessage('Character deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          setMessage(data.message || 'Error deleting character')
        }
      } catch (error) {
        setMessage('Error deleting character')
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
          setMessage('Word deck deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          setMessage(data.message || 'Error deleting word deck')
        }
      } catch (error) {
        setMessage('Error deleting word deck')
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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('title')}</h1>
          <p className="text-gray-300">{t('subtitle')}</p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6">
            <Message 
              severity="success" 
              text={message} 
              className="mb-2"
            />
            <Button 
              label="Dismiss" 
              size="small"
              onClick={() => setMessage('')}
              className="p-button-text p-button-sm"
            />
          </div>
        )}

        {/* Tabs */}
        <TabView>
          {/* Words Tab */}
          <TabPanel header={t('wordsTab')}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">{t('wordsTitle')}</h2>
                  <Button
                    label={t('addWord')}
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
                  emptyMessage={t('noWords')}
                >
                  <Column field="word1" header={t('word1')} sortable />
                  <Column field="word2" header={t('word2')} sortable />
                  <Column field="word3" header={t('word3')} sortable />
                  <Column field="category" header={t('category')} sortable />
                  <Column field="difficulty" header={t('difficulty')} sortable />
                  <Column 
                    field="isActive" 
                    header={t('status')} 
                    body={(rowData) => (
                      <Badge 
                        value={rowData.isActive ? t('active') : t('inactive')} 
                        severity={rowData.isActive ? 'success' : 'secondary'} 
                      />
                    )}
                  />
                  <Column header={t('actions')} body={wordActionsBodyTemplate} />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* Users Tab */}
          <TabPanel header={t('usersTab')}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-white">{t('usersTitle')}</h2>
                  <Button
                    label={t('addUser')}
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
                  emptyMessage={t('noUsers')}
                >
                  <Column field="username" header={t('username')} sortable />
                  <Column field="firstName" header={t('firstName')} sortable />
                  <Column field="lastName" header={t('lastName')} sortable />
                  <Column field="email" header={t('email')} sortable />
                  <Column header={t('avatar')} body={avatarBodyTemplate} />
                  <Column field="gamesPlayed" header={t('gamesPlayed')} sortable />
                  <Column field="gamesWon" header={t('gamesWon')} sortable />
                  <Column field="totalKills" header={t('totalKills')} sortable />
                  <Column header={t('status')} body={statusBodyTemplate} />
                  <Column header={t('actions')} body={actionsBodyTemplate} />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* Character Packs Tab */}
          <TabPanel header={t('characterPacksTab')}>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Character Packs</h3>
                  <Button 
                    label="Add Pack" 
                    icon="pi pi-plus"
                    onClick={() => {
                      setEditingPack(null)
                      setPackForm({ name: '', description: '', imageUrl: '', price: 0, isActive: true })
                      setPackDialogVisible(true)
                    }}
                    className="p-button-primary"
                  />
                </div>

                <DataTable 
                  value={characterPacks} 
                  paginator 
                  rows={10}
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Name" sortable />
                  <Column field="description" header="Description" />
                  <Column field="price" header="Price" body={priceTemplate} sortable />
                  <Column field="isActive" header="Status" body={statusTemplate} />
                  <Column field="characters.length" header="Characters" />
                  <Column 
                    header="Actions" 
                    body={(rowData) => (
                      <div className="flex gap-2">
                        <Button 
                          icon="pi pi-pencil" 
                          className="p-button-sm p-button-warning"
                          onClick={() => editPack(rowData)}
                        />
                        <Button 
                          icon="pi pi-trash" 
                          className="p-button-sm p-button-danger"
                          onClick={() => deletePack(rowData.id)}
                        />
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* Characters Tab */}
          <TabPanel header="Characters">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Characters</h3>
                  <Button 
                    label="Add Character" 
                    icon="pi pi-plus"
                    onClick={() => {
                      setEditingCharacter(null)
                      setCharacterForm({ name: '', description: '', imageUrl: '', price: 0, packId: '', isUnlocked: false })
                      setCharacterDialogVisible(true)
                    }}
                    className="p-button-primary"
                  />
                </div>

                <DataTable 
                  value={characterPacks.flatMap(pack => 
                    pack.characters.map(char => ({ ...char, packName: pack.name }))
                  )} 
                  paginator 
                  rows={10}
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Name" sortable />
                  <Column field="packName" header="Pack" sortable />
                  <Column field="description" header="Description" />
                  <Column field="price" header="Price" body={priceTemplate} sortable />
                  <Column field="isUnlocked" header="Unlocked" body={(rowData) => rowData.isUnlocked ? 'Yes' : 'No'} />
                  <Column 
                    header="Actions" 
                    body={(rowData) => (
                      <div className="flex gap-2">
                        <Button 
                          icon="pi pi-pencil" 
                          className="p-button-sm p-button-warning"
                          onClick={() => editCharacter(rowData)}
                        />
                        <Button 
                          icon="pi pi-trash" 
                          className="p-button-sm p-button-danger"
                          onClick={() => deleteCharacter(rowData.id)}
                        />
                      </div>
                    )}
                  />
                </DataTable>
              </div>
            </Card>
          </TabPanel>

          {/* Word Decks Tab */}
          <TabPanel header="Word Decks">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-white">Word Decks</h3>
                  <Button 
                    label="Add Deck" 
                    icon="pi pi-plus"
                    onClick={() => {
                      setEditingDeck(null)
                      setDeckForm({ name: '', description: '', category: '', difficulty: 'easy', price: 0, isActive: true })
                      setDeckDialogVisible(true)
                    }}
                    className="p-button-primary"
                  />
                </div>

                <DataTable 
                  value={wordDecks} 
                  paginator 
                  rows={10}
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Name" sortable />
                  <Column field="category" header="Category" sortable />
                  <Column field="difficulty" header="Difficulty" sortable />
                  <Column field="price" header="Price" body={priceTemplate} sortable />
                  <Column field="wordCount" header="Words" sortable />
                  <Column field="isActive" header="Status" body={statusTemplate} />
                  <Column 
                    header="Actions" 
                    body={(rowData) => (
                      <div className="flex gap-2">
                        <Button 
                          icon="pi pi-pencil" 
                          className="p-button-sm p-button-warning"
                          onClick={() => editDeck(rowData)}
                        />
                        <Button 
                          icon="pi pi-trash" 
                          className="p-button-sm p-button-danger"
                          onClick={() => deleteDeck(rowData.id)}
                        />
                      </div>
                    )}
                  />
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
  )
}
