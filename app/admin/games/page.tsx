'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Badge } from 'primereact/badge'
import { Button } from 'primereact/button'
import { useToast } from '@/store/toast.context'

interface GameRoom {
  id: string
  name: string
  code: string
  maxPlayers: number
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED'
  currentRound: number
  timeLimit: number
  playerCount: number
  creator: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  createdAt: string
  startedAt?: string
  finishedAt?: string
}

export default function GamesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !authLoading) {
      fetchGameRooms()
    } else if (!authLoading) {
      router.push('/auth/login')
    }
  }, [user, authLoading])

  const fetchGameRooms = async () => {
    try {
      const response = await fetch('/api/admin/game-rooms')
      if (response.ok) {
        const data = await response.json()
        setGameRooms(data.gameRooms || [])
      } else {
        showToast('error', 'Error', 'Failed to fetch game rooms')
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to fetch game rooms')
    } finally {
      setLoading(false)
    }
  }

  const statusTemplate = (rowData: GameRoom) => {
    let severity: 'success' | 'info' | 'warning' | 'danger' = 'info'
    let label: string = rowData.status

    switch (rowData.status) {
      case 'WAITING':
        severity = 'info'
        label = 'Waiting'
        break
      case 'STARTING':
        severity = 'warning'
        label = 'Starting'
        break
      case 'IN_PROGRESS':
        severity = 'success'
        label = 'In Progress'
        break
      case 'FINISHED':
        severity = 'info'
        label = 'Finished'
        break
    }

    return <Badge value={label} severity={severity} />
  }

  const playersTemplate = (rowData: GameRoom) => {
    return `${rowData.playerCount}/${rowData.maxPlayers}`
  }

  const creatorTemplate = (rowData: GameRoom) => {
    return `${rowData.creator.firstName} ${rowData.creator.lastName} (@${rowData.creator.username})`
  }

  const durationTemplate = (rowData: GameRoom) => {
    if (rowData.startedAt && rowData.finishedAt) {
      const start = new Date(rowData.startedAt)
      const end = new Date(rowData.finishedAt)
      const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60) // minutes
      return `${duration}m`
    } else if (rowData.startedAt) {
      const start = new Date(rowData.startedAt)
      const now = new Date()
      const duration = Math.round((now.getTime() - start.getTime()) / 1000 / 60) // minutes
      return `${duration}m (ongoing)`
    }
    return '-'
  }

  const actionTemplate = (rowData: GameRoom) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Details"
          tooltipOptions={{ position: 'top' }}
        />
        {rowData.status === 'WAITING' && (
          <Button
            icon="pi pi-play"
            size="small"
            severity="success"
            tooltip="Start Game"
            tooltipOptions={{ position: 'top' }}
          />
        )}
        {rowData.status === 'IN_PROGRESS' && (
          <Button
            icon="pi pi-stop"
            size="small"
            severity="danger"
            tooltip="End Game"
            tooltipOptions={{ position: 'top' }}
          />
        )}
      </div>
    )
  }

  if (authLoading || loading) {
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
          <h5>Game Rooms Management</h5>
          <p className="text-color-secondary">Monitor and manage all active game rooms</p>
        </div>
      </div>

      <div className="col-12">
        <Card>
          <DataTable 
            value={gameRooms} 
            paginator 
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            className="p-datatable-sm"
            emptyMessage="No game rooms found"
            sortField="createdAt"
            sortOrder={-1}
          >
            <Column field="code" header="Room Code" sortable style={{ width: '120px' }} />
            <Column field="name" header="Room Name" sortable />
            <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
            <Column field="players" header="Players" body={playersTemplate} style={{ width: '100px' }} />
            <Column field="currentRound" header="Round" sortable style={{ width: '80px' }} />
            <Column field="timeLimit" header="Time Limit" sortable style={{ width: '100px' }} />
            <Column field="creator" header="Creator" body={creatorTemplate} />
            <Column field="duration" header="Duration" body={durationTemplate} style={{ width: '120px' }} />
            <Column field="createdAt" header="Created" sortable style={{ width: '150px' }} />
            <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
          </DataTable>
        </Card>
      </div>
    </div>
  )
}
