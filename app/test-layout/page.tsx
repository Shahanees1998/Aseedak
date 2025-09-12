'use client'

import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Badge } from 'primereact/badge'
import { useToast } from '@/store/toast.context'

export default function TestLayoutPage() {
  const { showToast } = useToast()

  const testData = [
    { id: 1, name: 'Test User 1', status: 'Active', role: 'Admin' },
    { id: 2, name: 'Test User 2', status: 'Inactive', role: 'User' },
    { id: 3, name: 'Test User 3', status: 'Active', role: 'Moderator' },
  ]

  const statusBodyTemplate = (rowData: any) => {
    return (
      <Badge 
        value={rowData.status} 
        severity={rowData.status === 'Active' ? 'success' : 'danger'} 
      />
    )
  }

  const handleTestToast = () => {
    showToast('success', 'Test Success', 'This is a test toast message!')
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>Layout Test Page</h5>
          <p className="text-color-secondary">This page tests the new layout system integration.</p>
          
          <div className="flex gap-2 mb-4">
            <Button 
              label="Test Toast" 
              icon="pi pi-bell" 
              onClick={handleTestToast}
              className="p-button-primary"
            />
            <Button 
              label="Test Button" 
              icon="pi pi-check" 
              className="p-button-secondary"
            />
          </div>

          <DataTable 
            value={testData} 
            paginator 
            rows={5}
            className="p-datatable-sm"
          >
            <Column field="id" header="ID" sortable />
            <Column field="name" header="Name" sortable />
            <Column field="role" header="Role" sortable />
            <Column header="Status" body={statusBodyTemplate} />
          </DataTable>
        </div>
      </div>
    </div>
  )
}
