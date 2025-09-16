'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dialog } from 'primereact/dialog'
import { FileUpload } from 'primereact/fileupload'
import { Image } from 'primereact/image'
import { Badge } from 'primereact/badge'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  isActive: boolean
  createdAt: string
}

export default function CharactersManagement() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [characterDialogVisible, setCharacterDialogVisible] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [characterForm, setCharacterForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (authLoading) return
    
    if (!user || user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchCharacters()
  }, [user, authLoading, router])

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/admin/characters')
      if (response.ok) {
        const data = await response.json()
        setCharacters(data.characters || [])
      }
    } catch (error) {
      console.error('Error fetching characters:', error)
      showToast('error', 'Error', 'Failed to fetch characters')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: any) => {
    const file = event.files[0]
    if (!file) return

    setUploadingImage(true)
    
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload/character-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCharacterForm(prev => ({ ...prev, imageUrl: data.imageUrl }))
        showToast('success', 'Success', 'Image uploaded successfully!')
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast('error', 'Error', 'Failed to upload image')
    } finally {
      setUploadingImage(false)
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
        setCharacterForm({ name: '', description: '', imageUrl: '', isActive: true })
        fetchCharacters()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error saving character')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving character')
    }
  }

  const editCharacter = (character: Character) => {
    setEditingCharacter(character)
    setCharacterForm({
      name: character.name,
      description: character.description,
      imageUrl: character.imageUrl,
      isActive: character.isActive
    })
    setCharacterDialogVisible(true)
  }

  const deleteCharacter = async (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      try {
        const response = await fetch(`/api/admin/characters/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Character deleted successfully!')
          fetchCharacters()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting character')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting character')
      }
    }
  }

  const toggleCharacterStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/characters/${id}/toggle-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        showToast('success', 'Success', `Character ${!isActive ? 'activated' : 'deactivated'} successfully!`)
        fetchCharacters()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error updating character status')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error updating character status')
    }
  }

  const imageBodyTemplate = (rowData: Character) => {
    return (
      <div className="flex items-center">
        {rowData.imageUrl ? (
          <Image
            src={rowData.imageUrl}
            alt={rowData.name}
            width="40"
            height="40"
            className="rounded-full object-cover"
            preview
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <i className="pi pi-image text-gray-500"></i>
          </div>
        )}
      </div>
    )
  }

  const statusBodyTemplate = (rowData: Character) => {
    return (
      <Badge 
        value={rowData.isActive ? 'Active' : 'Inactive'} 
        severity={rowData.isActive ? 'success' : 'secondary'} 
      />
    )
  }

  const actionsBodyTemplate = (rowData: Character) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          size="small"
          severity="info"
          tooltip="Edit Character"
          tooltipOptions={{ position: 'top' }}
          onClick={() => editCharacter(rowData)}
        />
        <Button
          icon={rowData.isActive ? "pi pi-ban" : "pi pi-check"}
          size="small"
          severity={rowData.isActive ? "danger" : "success"}
          tooltip={rowData.isActive ? "Deactivate" : "Activate"}
          tooltipOptions={{ position: 'top' }}
          onClick={() => toggleCharacterStatus(rowData.id, rowData.isActive)}
        />
        <Button
          icon="pi pi-trash"
          size="small"
          severity="danger"
          tooltip="Delete Character"
          tooltipOptions={{ position: 'top' }}
          onClick={() => deleteCharacter(rowData.id)}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <p className="mt-3 text-color-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>Characters Management</h5>
          <p className="text-color-secondary">Manage character avatars for the game</p>
        </div>
      </div>

      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h6 className="m-0">Characters</h6>
            <Button
              label="Add New Character"
              icon="pi pi-plus"
              onClick={() => {
                setEditingCharacter(null)
                setCharacterForm({ name: '', description: '', imageUrl: '', isActive: true })
                setCharacterDialogVisible(true)
              }}
              className="p-button-primary"
            />
          </div>

          <DataTable
            value={characters}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage="No characters found"
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column header="Image" body={imageBodyTemplate} style={{ width: '80px' }} />
            <Column field="name" header="Name" sortable />
            <Column field="description" header="Description" />
            <Column header="Status" body={statusBodyTemplate} style={{ width: '100px' }} />
            <Column field="createdAt" header="Created" sortable style={{ width: '150px' }} />
            <Column header="Actions" body={actionsBodyTemplate} style={{ width: '120px' }} />
          </DataTable>
        </Card>
      </div>

      {/* Character Dialog */}
        <Dialog
          header={editingCharacter ? "Edit Character" : "Add New Character"}
          visible={characterDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setCharacterDialogVisible(false)}
        >
          <form onSubmit={handleCharacterSubmit}>
            <div className="grid">
              <div className="col-12">
                <div className="field">
                  <label htmlFor="characterName" className="block text-900 font-medium mb-2">Character Name *</label>
                  <InputText
                    id="characterName"
                    value={characterForm.name}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter character name"
                    required
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="col-12">
                <div className="field">
                  <label htmlFor="characterDescription" className="block text-900 font-medium mb-2">Description</label>
                  <InputTextarea
                    id="characterDescription"
                    value={characterForm.description}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter character description"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="field">
                  <label className="block text-900 font-medium mb-2">Character Image *</label>
                  
                  {/* Image Preview */}
                  {characterForm.imageUrl && (
                    <div className="mb-3 p-3 border-round" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="flex align-items-center gap-3">
                        <Image
                          src={characterForm.imageUrl}
                          alt="Character preview"
                          width="80"
                          height="80"
                          className="rounded-lg object-cover border-1"
                          preview
                        />
                        <div>
                          <p className="text-sm font-medium mb-1">Image uploaded successfully!</p>
                          <p className="text-xs text-color-secondary">Click image to preview</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="mb-3 p-3 border-round" style={{ backgroundColor: '#e3f2fd' }}>
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-spin pi-spinner text-primary"></i>
                        <span className="text-sm">Uploading image...</span>
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  <FileUpload
                    mode="basic"
                    name="character-image"
                    accept="image/*"
                    maxFileSize={5000000}
                    customUpload={true}
                    uploadHandler={handleImageUpload}
                    chooseLabel="Choose Image"
                    disabled={uploadingImage}
                    className="w-full"
                    auto={true}
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button
                    label="Cancel"
                    onClick={() => setCharacterDialogVisible(false)}
                    className="p-button-secondary"
                    type="button"
                  />
                  <Button
                    label={editingCharacter ? "Update" : "Create"}
                    type="submit"
                    className="p-button-primary"
                    disabled={!characterForm.name || !characterForm.imageUrl}
                  />
                </div>
              </div>
            </div>
          </form>
        </Dialog>
    </div>
  )
}
