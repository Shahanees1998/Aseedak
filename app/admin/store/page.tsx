'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { InputText } from 'primereact/inputtext'
import { Dialog } from 'primereact/dialog'
import { Badge } from 'primereact/badge'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface DeckCard {
  word1: string
  word2: string
  word3: string
  isActive?: boolean
}

interface WordDeck {
  id: string
  name: string
  description: string
  price: number
  isActive: boolean
  wordCount: number
  words?: DeckCard[]
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [decks, setDecks] = useState<WordDeck[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deckDialogVisible, setDeckDialogVisible] = useState(false)
  const [editingDeck, setEditingDeck] = useState<WordDeck | null>(null)
  const [deckForm, setDeckForm] = useState({
    description: '',
    price: 0,
    isActive: true,
    cards: [] as DeckCard[]
  })
  const { showToast } = useToast()


  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/word-decks')
      if (res.ok) {
        const data = await res.json()
        setDecks(data.wordDecks)
      }
    } catch (error) {
      console.error('Error fetching decks:', error)
    } finally {
      setLoading(false)
    }
  }


  const handleDeckSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingDeck ? `/api/admin/word-decks/${editingDeck.id}` : '/api/admin/word-decks'
      const method = editingDeck ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDeck ? {
          description: deckForm.description,
          price: deckForm.price,
          isActive: deckForm.isActive,
          cards: deckForm.cards
        } : deckForm)
      })

      if (response.ok) {
        showToast('success', 'Success', editingDeck ? 'Deck updated successfully!' : 'Deck created successfully!')
        setDeckDialogVisible(false)
        setEditingDeck(null)
        setDeckForm({ description: '', price: 0, isActive: true, cards: [] })
        fetchData()
      } else {
        const error = await response.json()
        showToast('error', 'Error', error.message || 'Error saving deck')
      }
    } catch (error) {
      showToast('error', 'Error', 'Error saving deck')
    } finally {
      setSubmitting(false)
    }
  }


  const editDeck = async (deck: WordDeck) => {
    // Fetch deck with words for editing
    setEditingDeck(deck)
    try {
      const res = await fetch(`/api/admin/word-decks?search=${encodeURIComponent(deck.name)}`)
      if (res.ok) {
        const data = await res.json()
        const full = (data.wordDecks as WordDeck[]).find(d => d.id === deck.id)
        setDeckForm({
          description: full?.description || deck.description,
          price: full?.price ?? deck.price,
          isActive: full?.isActive ?? deck.isActive,
          cards: (full?.words as DeckCard[]) || []
        })
      } else {
        setDeckForm({ description: deck.description, price: deck.price, isActive: deck.isActive, cards: [] })
      }
    } catch {
      setDeckForm({ description: deck.description, price: deck.price, isActive: deck.isActive, cards: [] })
    }
    setDeckDialogVisible(true)
  }

  const deleteDeck = async (id: string) => {
    if (confirm('Are you sure you want to delete this word set?')) {
      try {
        const response = await fetch(`/api/admin/word-decks/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          showToast('success', 'Success', 'Deck deleted successfully!')
          fetchData()
        } else {
          const data = await response.json()
          showToast('error', 'Error', data.message || 'Error deleting deck')
        }
      } catch (error) {
        showToast('error', 'Error', 'Error deleting deck')
      }
    }
  }

  const deckActionsBodyTemplate = (rowData: WordDeck) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-sm"
          onClick={() => editDeck(rowData)}
          tooltip="Edit Deck"
          tooltipOptions={{ position: 'top' }}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-sm p-button-danger"
          onClick={() => deleteDeck(rowData.id)}
          tooltip="Delete Deck"
          tooltipOptions={{ position: 'top' }}
        />
      </div>
    )
  }



  if (loading) {
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
          <div className='flex justify-content-between align-items-center mb-8'>
            <div className='flex-col'>
              <h5>Decks Management</h5>
              <p className="text-color-secondary">Create decks with multiple word cards.</p>
            </div>
            <Button
              label="Add Deck"
              icon="pi pi-plus"
              onClick={() => {
                setEditingDeck(null)
                setDeckForm({ description: '', price: 0, isActive: true, cards: [] })
                setDeckDialogVisible(true)
              }}
              className="p-button-primary"
            />
          </div>

          <DataTable
            value={decks}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage="No decks"
          >
            <Column field="name" header="Name" sortable />
            <Column field="description" header="Description" sortable />
            <Column field="price" header="Price" sortable body={(row) => `$${(row.price/100).toFixed(2)}`} />
            <Column field="wordCount" header="# Cards" sortable />
            <Column
              field="isActive"
              header={t('admin.status')}
              body={(rowData) => (
                <Badge
                  value={rowData.isActive ? t('admin.active') : t('admin.inactive')}
                  severity={rowData.isActive ? 'success' : 'secondary'}
                />
              )}
            />
            <Column header={t('admin.actions')} body={deckActionsBodyTemplate} />
          </DataTable>
        </div>
      </div>


      {/* Deck Dialog */}
      <Dialog
        header={editingDeck ? 'Edit Deck' : 'Add Deck'}
        visible={deckDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setDeckDialogVisible(false)}
      >
        <form onSubmit={handleDeckSubmit}>
          <div className="grid">
            <div className="col-12">
              <div className="field">
                <label className="block text-900 font-medium mb-2">Description *</label>
                <InputText
                  value={deckForm.description}
                  onChange={(e) => setDeckForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter deck description"
                  className="w-full"
                  required
                />
              </div>
              <div className="grid">
                <div className="col-12 md:col-10">
                  <div className="field">
                    <label className="block text-900 font-medium mb-2">Price (in cents) *</label>
                    <InputText
                      value={String(deckForm.price)}
                      onChange={(e) => setDeckForm(prev => ({ ...prev, price: Number(e.target.value || 0) }))}
                      placeholder="e.g. 0 for free"
                      className="w-full"
                      required
                    />
                  </div>
                </div>
                <div className="col-12 md:col-2">
                  <div className="field">
                    <label className="block text-900 font-medium mb-2">Status</label>
                    <div className="flex justify-content-end">
                      <Button
                        type="button"
                        label={deckForm.isActive ? 'Active' : 'Inactive'}
                        className={deckForm.isActive ? 'p-button-success' : 'p-button-secondary'}
                        onClick={() => setDeckForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                        aria-label={deckForm.isActive ? 'Active' : 'Inactive'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="flex justify-content-between align-items-center mb-3">
                <h6 className="m-0">Cards</h6>
                <Button
                  type="button"
                  icon="pi pi-plus"
                  label="Add Card"
                  onClick={() => setDeckForm(prev => ({ ...prev, cards: [...prev.cards, { word1: '', word2: '', word3: '', isActive: true }] }))}
                />
              </div>
              {deckForm.cards.length === 0 && (
                <div className="p-2 border-1 border-dashed border-200 border-round text-600">No cards added yet.</div>
              )}
              {deckForm.cards.map((c, idx) => (
                <div key={idx} className="grid mb-3">
                  {/* Row 1: words */}
                  <div className="col-12 md:col-4">
                    <InputText value={c.word1} placeholder="Word 1" className="w-full" onChange={(e) => {
                      const v = e.target.value; setDeckForm(prev => { const cards = [...prev.cards]; cards[idx] = { ...cards[idx], word1: v }; return { ...prev, cards }; })
                    }} />
                  </div>
                  <div className="col-12 md:col-4">
                    <InputText value={c.word2} placeholder="Word 2" className="w-full" onChange={(e) => {
                      const v = e.target.value; setDeckForm(prev => { const cards = [...prev.cards]; cards[idx] = { ...cards[idx], word2: v }; return { ...prev, cards }; })
                    }} />
                  </div>
                  <div className="col-12 md:col-4">
                    <InputText value={c.word3} placeholder="Word 3" className="w-full" onChange={(e) => {
                      const v = e.target.value; setDeckForm(prev => { const cards = [...prev.cards]; cards[idx] = { ...cards[idx], word3: v }; return { ...prev, cards }; })
                    }} />
                  </div>

                  {/* Row 2: actions aligned right, no background */}
                  <div className="col-12">
                    <div className="flex justify-content-end gap-2">
                      <Button
                        type="button"
                        icon={c.isActive ? 'pi pi-eye' : 'pi pi-eye-slash'}
                        className="p-button-text p-button-plain"
                        onClick={() => {
                          setDeckForm(prev => { const cards = [...prev.cards]; cards[idx] = { ...cards[idx], isActive: !cards[idx].isActive }; return { ...prev, cards }; })
                        }}
                        aria-label={c.isActive ? 'Active' : 'Inactive'}
                      />
                      <Button
                        type="button"
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger"
                        onClick={() => {
                          setDeckForm(prev => ({ ...prev, cards: prev.cards.filter((_, i) => i !== idx) }))
                        }}
                        aria-label="Delete card"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>



            <div className="col-12">
              <div className="flex justify-content-end gap-2 mt-3">
                <Button
                  label={t('common.cancel')}
                  onClick={() => setDeckDialogVisible(false)}
                  className="p-button-secondary"
                  type="button"
                  disabled={submitting}
                />
                <Button
                  label={t('common.save')}
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
    </div>
  )
}


