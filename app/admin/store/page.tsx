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

interface Word {
  id: string
  word1: string
  word2: string
  word3: string
  isActive: boolean
  createdAt: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [wordDialogVisible, setWordDialogVisible] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [wordForm, setWordForm] = useState({
    word1: '',
    word2: '',
    word3: '',
    isActive: true
  })
  const { showToast } = useToast()


  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const wordsRes = await fetch('/api/admin/words')

      if (wordsRes.ok) {
        const wordsData = await wordsRes.json()
        setWords(wordsData.words)
      }
    } catch (error) {
      console.error('Error fetching words:', error)
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
              <h5>{t('admin.wordsBankManagement')}</h5>
              <p className="text-color-secondary">{t('admin.wordsBankDescription')}</p>
            </div>
            <Button
              label={t('admin.addWord')}
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
            emptyMessage={t('admin.noWords')}
          >
            <Column field="word1" header={t('admin.word1')} sortable />
            <Column field="word2" header={t('admin.word2')} sortable />
            <Column field="word3" header={t('admin.word3')} sortable />
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
            <Column header={t('admin.actions')} body={wordActionsBodyTemplate} />
          </DataTable>
        </div>
      </div>


      {/* Word Dialog */}
      <Dialog
        header={editingWord ? t('admin.editWord') : t('admin.addWord')}
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
                    <label htmlFor="word1" className="block text-900 font-medium mb-2">{t('admin.word1')} *</label>
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
                    <label htmlFor="word2" className="block text-900 font-medium mb-2">{t('admin.word2')} *</label>
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
                    <label htmlFor="word3" className="block text-900 font-medium mb-2">{t('admin.word3')} *</label>
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
              <div className="p-3 border-round mb-3" style={{ backgroundColor: '#CB112210', border: '1px solid #CB112240' }}>
                <p className="text-sm m-0" style={{ color: '#CB1122' }}>
                  <strong>Note:</strong> All three words are mandatory. Each word set will be randomly assigned to players during games.
                </p>
              </div>
            </div>


            <div className="col-12">
              <div className="flex justify-content-end gap-2 mt-3">
                <Button
                  label={t('common.cancel')}
                  onClick={() => setWordDialogVisible(false)}
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


