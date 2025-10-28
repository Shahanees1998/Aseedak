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
import { InputNumber } from 'primereact/inputnumber'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface Character {
  id: string
  name: string
  description: string
  imageUrl: string
  isActive: boolean
  isPaid: boolean
  price: number
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
    isActive: true,
    isPaid: false,
    price: 0
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
      showToast('error', t('common.error'), t('admin.characters.errorFetching'))
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
        showToast('success', t('common.success'), t('admin.characters.imageUploadedSuccess'))
      } else {
        const error = await response.json()
        showToast('error', t('common.error'), error.message || t('admin.characters.errorUploading'))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      showToast('error', t('common.error'), t('admin.characters.errorUploading'))
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
        showToast('success', t('common.success'), editingCharacter ? t('admin.characters.characterUpdated') : t('admin.characters.characterCreated'))
        setCharacterDialogVisible(false)
        setEditingCharacter(null)
        setCharacterForm({ name: '', description: '', imageUrl: '', isActive: true, isPaid: false, price: 0 })
        fetchCharacters()
      } else {
        const error = await response.json()
        showToast('error', t('common.error'), error.message || t('admin.characters.errorSaving'))
      }
    } catch (error) {
      showToast('error', t('common.error'), t('admin.characters.errorSaving'))
    }
  }

  const editCharacter = (character: Character) => {
    setEditingCharacter(character)
    setCharacterForm({
      name: character.name,
      description: character.description,
      imageUrl: character.imageUrl,
      isActive: character.isActive,
      isPaid: character.isPaid,
      price: character.price
    })
    setCharacterDialogVisible(true)
  }

  const deleteCharacter = async (id: string) => {
    if (confirm(t('admin.characters.confirmDelete'))) {
      try {
        const response = await fetch(`/api/admin/characters/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', t('common.success'), t('admin.characters.characterDeleted'))
          fetchCharacters()
        } else {
          const data = await response.json()
          showToast('error', t('common.error'), data.message || t('admin.characters.errorDeleting'))
        }
      } catch (error) {
        showToast('error', t('common.error'), t('admin.characters.errorDeleting'))
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
        showToast('success', t('common.success'), !isActive ? t('admin.characters.characterActivated') : t('admin.characters.characterDeactivated'))
        fetchCharacters()
      } else {
        const error = await response.json()
        showToast('error', t('common.error'), error.message || t('admin.characters.errorUpdatingStatus'))
      }
    } catch (error) {
      showToast('error', t('common.error'), t('admin.characters.errorUpdatingStatus'))
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
        value={rowData.isActive ? t('admin.characters.active') : t('admin.characters.inactive')} 
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
          tooltip={t('admin.characters.editTooltip')}
          tooltipOptions={{ position: 'top' }}
          onClick={() => editCharacter(rowData)}
        />
        <Button
          icon={rowData.isActive ? "pi pi-ban" : "pi pi-check"}
          size="small"
          severity={rowData.isActive ? "danger" : "success"}
          tooltip={rowData.isActive ? t('admin.characters.deactivateTooltip') : t('admin.characters.activateTooltip')}
          tooltipOptions={{ position: 'top' }}
          onClick={() => toggleCharacterStatus(rowData.id, rowData.isActive)}
        />
        <Button
          icon="pi pi-trash"
          size="small"
          severity="danger"
          tooltip={t('admin.characters.deleteTooltip')}
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
          <p className="mt-3 text-color-secondary">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>{t('admin.characters.title')}</h5>
          <p className="text-color-secondary">{t('admin.characters.subtitle')}</p>
        </div>
      </div>

      <div className="col-12">
        <Card>
          <div className="flex justify-content-between align-items-center mb-4">
            <h6 className="m-0">{t('admin.characters.charactersList')}</h6>
            <Button
              label={t('admin.characters.addNewCharacter')}
              icon="pi pi-plus"
              onClick={() => {
                setEditingCharacter(null)
                setCharacterForm({ name: '', description: '', imageUrl: '', isActive: true, isPaid: false, price: 0 })
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
            emptyMessage={t('admin.characters.noCharacters')}
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column header={t('admin.characters.image')} body={imageBodyTemplate} style={{ width: '80px' }} />
            <Column field="name" header={t('admin.characters.name')} sortable />
            <Column field="description" header={t('admin.characters.description')} />
            <Column header={t('admin.characters.isPaid')} body={(rowData: Character) => (
              <Badge 
                value={rowData.isPaid ? t('admin.characters.paid') : t('admin.characters.free')} 
                severity={rowData.isPaid ? 'warning' : 'success'} 
              />
            )} style={{ width: '100px' }} />
            <Column field="price" header={t('admin.characters.price')} sortable body={(rowData: Character) => `$${(rowData.price / 100).toFixed(2)}`} style={{ width: '100px' }} />
            <Column header={t('admin.characters.status')} body={statusBodyTemplate} style={{ width: '100px' }} />
            <Column field="createdAt" header={t('admin.characters.created')} sortable style={{ width: '150px' }} />
            <Column header={t('admin.characters.actions')} body={actionsBodyTemplate} style={{ width: '120px' }} />
          </DataTable>
        </Card>
      </div>

      {/* Character Dialog */}
        <Dialog
          header={editingCharacter ? t('admin.characters.editCharacter') : t('admin.characters.addNewCharacter')}
          visible={characterDialogVisible}
          style={{ width: '50vw' }}
          onHide={() => setCharacterDialogVisible(false)}
        >
          <form onSubmit={handleCharacterSubmit}>
            <div className="grid">
              <div className="col-12">
                <div className="field">
                  <label htmlFor="characterName" className="block text-900 font-medium mb-2">{t('admin.characters.characterName')} *</label>
                  <InputText
                    id="characterName"
                    value={characterForm.name}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('admin.characters.characterNamePlaceholder')}
                    required
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="col-12">
                <div className="field">
                  <label htmlFor="characterDescription" className="block text-900 font-medium mb-2">{t('admin.characters.description')}</label>
                  <InputTextarea
                    id="characterDescription"
                    value={characterForm.description}
                    onChange={(e) => setCharacterForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t('admin.characters.descriptionPlaceholder')}
                    rows={3}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="field">
                  <div className="flex align-items-center">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={characterForm.isPaid}
                      onChange={(e) => setCharacterForm(prev => ({ ...prev, isPaid: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="isPaid" className="text-900 font-medium">{t('admin.characters.isPaidCharacter')}</label>
                  </div>
                </div>
              </div>

              {characterForm.isPaid && (
                <div className="col-12">
                  <div className="field">
                    <label htmlFor="characterPrice" className="block text-900 font-medium mb-2">{t('admin.characters.price')} (cents) *</label>
                    <InputNumber
                      id="characterPrice"
                      value={characterForm.price}
                      onValueChange={(e) => setCharacterForm(prev => ({ ...prev, price: e.value || 0 }))}
                      mode="decimal"
                      min={0}
                      suffix=" ¢"
                      className="w-full"
                      required
                    />
                    <small className="text-color-secondary">{t('admin.characters.priceHint')}</small>
                  </div>
                </div>
              )}

              <div className="col-12">
                <div className="field">
                  <label className="block text-900 font-medium mb-2">{t('admin.characters.characterImage')} *</label>
                  
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
                          <p className="text-sm font-medium mb-1">{t('admin.characters.imageUploaded')}</p>
                          <p className="text-xs text-color-secondary">{t('admin.characters.clickToPreview')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="mb-3 p-3 border-round" style={{ backgroundColor: '#e3f2fd' }}>
                      <div className="flex align-items-center gap-2">
                        <i className="pi pi-spin pi-spinner text-primary"></i>
                        <span className="text-sm">{t('admin.characters.uploadingImage')}</span>
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
                    chooseLabel={t('admin.characters.chooseImage')}
                    disabled={uploadingImage}
                    className="w-full"
                    auto={true}
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button
                    label={t('common.cancel')}
                    onClick={() => setCharacterDialogVisible(false)}
                    className="p-button-secondary"
                    type="button"
                  />
                  <Button
                    label={editingCharacter ? t('common.update') : t('common.create')}
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
