'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Card } from 'primereact/card'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { Checkbox } from 'primereact/checkbox'
import { Message } from 'primereact/message'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Badge } from 'primereact/badge'
import { Avatar } from 'primereact/avatar'
import { MultiSelect } from 'primereact/multiselect'
import { TabView, TabPanel } from 'primereact/tabview'
import { useToast } from '@/store/toast.context'
import Link from 'next/link'
import Image from 'next/image'


interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  avatar: string
  isActive: boolean
}

export default function CreateRoomPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    maxPlayers: 8,
    timeLimit: 60,
    privateRoom: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Fetch users on component mount
  useEffect(() => {
    if (user) {
      fetchUsers()
    }
  }, [user])

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      // Only fetch users if the current user is an admin
      if (user?.role === 'ADMIN') {
        const response = await fetch('/api/admin/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
          setFilteredUsers(data.users || [])
        } else {
          showToast('error', 'Error', 'Failed to fetch users')
        }
      } else {
        // For non-admin users, show empty list or fetch public user list
        setUsers([])
        setFilteredUsers([])
        showToast('info', 'Info', 'User selection is only available for admin users')
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/game-rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          invitedUsers: selectedUsers.map(u => u.id)
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast('success', 'Success', 'Room created successfully!')
        router.push(`/game/${data.room.code}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to create room')
        showToast('error', 'Error', errorData.message || 'Failed to create room')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      showToast('error', 'Error', 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const toggleUserSelection = (selectedUser: User) => {
    // Don't allow selecting the room creator
    if (selectedUser.id === user?.id) {
      showToast('warn', 'Warning', 'You are automatically included as the room creator')
      return
    }

    if (selectedUsers.find(u => u.id === selectedUser.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== selectedUser.id))
    } else {
      if (selectedUsers.length < formData.maxPlayers - 1) { // -1 for room creator
        setSelectedUsers(prev => [...prev, selectedUser])
      } else {
        showToast('warn', 'Warning', `Maximum ${formData.maxPlayers - 1} additional players can be selected`)
      }
    }
  }

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const avatarBodyTemplate = (rowData: User) => {
    return (
      <div className="flex align-items-center">
        <Image 
          src={`/images/${rowData.avatar}.png`} 
          alt={rowData.avatar} 
          width={32} 
          height={32}
          className="border-round"
        />
      </div>
    )
  }

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Badge 
        value={rowData.isActive ? 'Active' : 'Inactive'} 
        severity={rowData.isActive ? 'success' : 'secondary'} 
      />
    )
  }

  const actionBodyTemplate = (rowData: User) => {
    const isSelected = selectedUsers.find(u => u.id === rowData.id)
    const isCurrentUser = rowData.id === user?.id
    
    if (isCurrentUser) {
      return (
        <Badge 
          value="Room Creator" 
          severity="info" 
          className="text-xs"
        />
      )
    }
    
    return (
      <Button
        icon={isSelected ? "pi pi-check" : "pi pi-plus"}
        className={`p-button-rounded p-button-text p-button-sm ${
          isSelected ? 'p-button-success' : 'p-button-primary'
        }`}
        onClick={() => toggleUserSelection(rowData)}
        tooltip={isSelected ? "Remove from selection" : "Add to selection"}
        tooltipOptions={{ position: 'top' }}
      />
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  // The useRequireAuth hook will handle redirecting to login if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Game Room</h1>
          <p className="text-gray-300">Set up your word elimination game and invite players</p>
        </div>

        {/* Error Message */}
        {error && (
          <Message 
            severity="error" 
            text={error} 
            className="mb-6"
          />
        )}

        {/* Tabbed Interface */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <div className="p-8">
            <TabView>
              {/* Room Settings Tab */}
              <TabPanel header="Room Settings">
                <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white mb-2">Room Name</label>
                <InputText
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter room name"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2">Max Players</label>
                  <InputNumber
                    value={formData.maxPlayers}
                    onValueChange={(e) => handleInputChange('maxPlayers', e.value)}
                    min={2}
                    max={8}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Time Limit (seconds)</label>
                  <InputNumber
                    value={formData.timeLimit}
                    onValueChange={(e) => handleInputChange('timeLimit', e.value)}
                    min={30}
                    max={300}
                    className="w-full"
                  />
                </div>
              </div>


              <div className="flex items-center">
                <Checkbox
                  inputId="privateRoom"
                  checked={formData.privateRoom}
                  onChange={(e) => handleInputChange('privateRoom', e.checked)}
                />
                <label htmlFor="privateRoom" className="ml-2 text-white">
                  Private room (requires room code to join)
                </label>
              </div>

                  <div className="flex space-x-4">
                    <Link href="/" className="flex-1">
                      <Button
                        label="Cancel"
                        className="w-full p-button-outlined p-button-secondary"
                      />
                    </Link>
                    <Button
                      type="submit"
                      label="Create Room"
                      loading={loading}
                      className="flex-1 p-button-primary"
                    />
                  </div>
                </form>
              </TabPanel>

              {/* User Selection Tab */}
              <TabPanel header={`Select Players (${selectedUsers.length}/${formData.maxPlayers - 1})`}>
                <div className="space-y-6">
                  {/* Search Bar */}
                  <div>
                    <label className="block text-white mb-2">Search Users</label>
                    <InputText
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by username, name, or email..."
                      className="w-full"
                    />
                  </div>

                  {/* Room Creator & Selected Users */}
                  <div>
                    <h4 className="text-white mb-3">
                      Players ({selectedUsers.length + 1}/{formData.maxPlayers})
                    </h4>
                    
                    {/* Room Creator */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex align-items-center bg-blue-500/30 p-2 rounded-lg border border-blue-400">
                        <Image 
                          src={`/images/${user?.profileImage || 'IMAGE1'}.png`} 
                          alt={user?.profileImage || 'IMAGE1'} 
                          width={24} 
                          height={24}
                          className="border-round mr-2"
                        />
                        <span className="text-white text-sm mr-2">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'} (You)</span>
                        <Badge 
                          value="Creator" 
                          severity="info" 
                          className="text-xs"
                        />
                      </div>
                    </div>

                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedUsers.map(selectedUser => (
                          <div key={selectedUser.id} className="flex align-items-center bg-white/20 p-2 rounded-lg">
                            <Image 
                              src={`/images/${selectedUser.avatar}.png`} 
                              alt={selectedUser.avatar} 
                              width={24} 
                              height={24}
                              className="border-round mr-2"
                            />
                            <span className="text-white text-sm mr-2">{selectedUser.username}</span>
                            <Button
                              icon="pi pi-times"
                              className="p-button-rounded p-button-text p-button-sm p-button-danger"
                              onClick={() => removeSelectedUser(selectedUser.id)}
                              tooltip="Remove"
                              tooltipOptions={{ position: 'top' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Users Table */}
                  <div>
                    <h4 className="text-white mb-3">Available Users</h4>
                    <DataTable
                      value={filteredUsers}
                      loading={loadingUsers}
                      paginator
                      rows={10}
                      rowsPerPageOptions={[5, 10, 25]}
                      className="p-datatable-sm"
                      emptyMessage="No users found"
                    >
                      <Column header="Avatar" body={avatarBodyTemplate} style={{ width: '80px' }} />
                      <Column field="username" header="Username" sortable />
                      <Column field="firstName" header="First Name" sortable />
                      <Column field="lastName" header="Last Name" sortable />
                      <Column field="email" header="Email" sortable />
                      <Column header="Status" body={statusBodyTemplate} />
                      <Column header="Action" body={actionBodyTemplate} style={{ width: '80px' }} />
                    </DataTable>
                  </div>
                </div>
              </TabPanel>
            </TabView>
          </div>
        </Card>

        {/* Game Rules */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mt-8">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Game Rules</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Each player gets 3 words and a target to eliminate</li>
              <li>• Guess words to eliminate your target</li>
              <li>• Target confirms if the guess is correct</li>
              <li>• Eliminated player's target becomes yours</li>
              <li>• Last player standing wins!</li>
              <li>• Game starts when room reaches max players</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  )
}
