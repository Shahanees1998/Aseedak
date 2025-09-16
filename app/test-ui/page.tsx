'use client'

import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'
import { useToast } from '@/store/toast.context'

export default function TestUIPage() {
  const { showToast } = useToast()

  const handleTestToast = () => {
    showToast('success', 'Test Success', 'UI integration is working!')
  }

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h5>UI Integration Test</h5>
          <p className="text-color-secondary">Testing the integrated UI system from primochatadmin.</p>
          
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

          <div className="grid">
            <div className="col-12 md:col-6 lg:col-3">
              <div className="card mb-0">
                <div className="flex justify-content-between mb-3">
                  <div>
                    <span className="block text-500 font-medium mb-3">Test Stat</span>
                    <div className="text-900 font-medium text-xl">123</div>
                  </div>
                  <div className="flex align-items-center justify-content-center border-round" style={{ width: '2.5rem', height: '2.5rem', backgroundColor: '#CB112220' }}>
                    <i className="pi pi-users text-xl" style={{ color: '#CB1122' }}></i>
                  </div>
                </div>
                <span className="text-green-500 font-medium">+20% </span>
                <span className="text-500">since last test</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Badge value="Success" severity="success" className="mr-2" />
            <Badge value="Warning" severity="warning" className="mr-2" />
            <Badge value="Error" severity="danger" className="mr-2" />
            <Badge value="Info" severity="info" />
          </div>
        </div>
      </div>
    </div>
  )
}
