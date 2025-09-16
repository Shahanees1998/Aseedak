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
import { useTranslation } from '@/hooks/useTranslation'

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

export default function GameRoomsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation()
  
  const [gameRooms, setGameRooms] = useState<GameRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([])
  const [waitingRooms, setWaitingRooms] = useState<GameRoom[]>([])

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
        const rooms = data.gameRooms || []
        setGameRooms(rooms)
        setActiveRooms(rooms.filter((room: GameRoom) => room.status === 'IN_PROGRESS'))
        setWaitingRooms(rooms.filter((room: GameRoom) => room.status === 'WAITING'))
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
        label = t('game.gameRoom.waiting')
        break
      case 'STARTING':
        severity = 'warning'
        label = t('game.gameRoom.starting')
        break
      case 'IN_PROGRESS':
        severity = 'success'
        label = t('game.gameRoom.inProgress')
        break
      case 'FINISHED':
        severity = 'info'
        label = t('game.gameRoom.finished')
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
          <h5>{t('admin.activeGameRooms')}</h5>
          <p className="text-color-secondary">{t('admin.activeGameRoomsSubtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-12">
        <div className="grid">
          <div className="col-12 md:col-4">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.totalRooms')}</span>
                  <div className="text-900 font-medium text-xl">{gameRooms.length}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-users text-blue-500"></i>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-4">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.activeGames')}</span>
                  <div className="text-900 font-medium text-xl">{activeRooms.length}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-play text-green-500"></i>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-4">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.waitingRooms')}</span>
                  <div className="text-900 font-medium text-xl">{waitingRooms.length}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-clock text-orange-500"></i>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Active Rooms Table */}
      <div className="col-12">
        <Card>
          <h5>{t('admin.allGameRooms')}</h5>
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
            <Column field="code" header={t('admin.roomCode')} sortable style={{ width: '120px' }} />
            <Column field="name" header={t('admin.roomName')} sortable />
            <Column field="status" header={t('admin.status')} body={statusTemplate} sortable style={{ width: '120px' }} />
            <Column field="players" header={t('admin.players')} body={playersTemplate} style={{ width: '100px' }} />
            <Column field="currentRound" header={t('admin.round')} sortable style={{ width: '80px' }} />
            <Column field="timeLimit" header={t('admin.timeLimit')} sortable style={{ width: '100px' }} />
            <Column field="creator" header={t('admin.creator')} body={creatorTemplate} />
            <Column field="duration" header={t('admin.duration')} body={durationTemplate} style={{ width: '120px' }} />
            <Column field="createdAt" header={t('admin.created')} sortable style={{ width: '150px' }} />
          </DataTable>
        </Card>
      </div>
    </div>
  )
}
