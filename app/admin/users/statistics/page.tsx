'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Chart } from 'primereact/chart'
import { Badge } from 'primereact/badge'
import AvatarDisplay from '@/components/AvatarDisplay'
import { useToast } from '@/store/toast.context'
import { useTranslation } from '@/hooks/useTranslation'

interface UserStats {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string
  avatar: string
  gamesPlayed: number
  gamesWon: number
  totalKills: number
  winRate: number
  isActive: boolean
  createdAt: string
}

interface Statistics {
  totalUsers: number
  activeUsers: number
  totalGames: number
  totalRevenue: number
  averageWinRate: number
  topPlayers: UserStats[]
  recentActivity: any[]
}

export default function UserStatistics() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const { t } = useTranslation()
  
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    totalRevenue: 0,
    averageWinRate: 0,
    topPlayers: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState({})
  const [chartOptions, setChartOptions] = useState({})

  useEffect(() => {
    if (user && !authLoading) {
      fetchStatistics()
    } else if (!authLoading) {
      router.push('/auth/login')
    }
  }, [user, authLoading])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/users/statistics')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        prepareChartData(data)
      } else {
        showToast('error', 'Error', 'Failed to fetch statistics')
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = (data: Statistics) => {
    // Win rate distribution chart
    const winRateRanges = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ]

    data.topPlayers.forEach(player => {
      if (player.winRate <= 20) winRateRanges[0].count++
      else if (player.winRate <= 40) winRateRanges[1].count++
      else if (player.winRate <= 60) winRateRanges[2].count++
      else if (player.winRate <= 80) winRateRanges[3].count++
      else winRateRanges[4].count++
    })

    setChartData({
      labels: winRateRanges.map(range => range.range),
      datasets: [
        {
          label: t('admin.numberOfPlayers'),
          data: winRateRanges.map(range => range.count),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }
      ]
    })

    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    })
  }

  const winRateTemplate = (rowData: UserStats) => {
    const percentage = rowData.winRate.toFixed(1)
    let severity: 'success' | 'info' | 'warning' | 'danger' = 'info'
    
    if (rowData.winRate >= 70) severity = 'success'
    else if (rowData.winRate >= 50) severity = 'info'
    else if (rowData.winRate >= 30) severity = 'warning'
    else severity = 'danger'

    return <Badge value={`${percentage}%`} severity={severity} />
  }

  const statusTemplate = (rowData: UserStats) => {
    return (
      <Badge 
        value={rowData.isActive ? t('admin.active') : t('admin.inactive')} 
        severity={rowData.isActive ? 'success' : 'danger'} 
      />
    )
  }

  const avatarTemplate = (rowData: UserStats) => {
    return <AvatarDisplay avatarType={rowData.avatar} size="normal" />
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
          <h5>{t('admin.userStatisticsDashboard')}</h5>
          <p className="text-color-secondary">{t('admin.userStatisticsSubtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-12">
        <div className="grid">
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.totalUsers')}</span>
                  <div className="text-900 font-medium text-xl">{stats.totalUsers}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-users text-blue-500"></i>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-3">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.activeUsers')}</span>
                  <div className="text-900 font-medium text-xl">{stats.activeUsers}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-check-circle text-green-500"></i>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-3">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.totalGames')}</span>
                  <div className="text-900 font-medium text-xl">{stats.totalGames}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-play text-orange-500"></i>
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 md:col-3">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">{t('admin.avgWinRate')}</span>
                  <div className="text-900 font-medium text-xl">{stats.averageWinRate.toFixed(1)}%</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-chart-line text-purple-500"></i>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="col-12 lg:col-6">
        <Card>
          <h5>{t('admin.winRateDistribution')}</h5>
          <div style={{ height: '300px' }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="col-12 lg:col-6">
        <Card>
          <h5>{t('admin.topPerformers')}</h5>
          <DataTable 
            value={stats.topPlayers.slice(0, 5)} 
            className="p-datatable-sm"
            emptyMessage={t('admin.noDataAvailable')}
          >
            <Column field="avatar" header={t('admin.avatar')} body={avatarTemplate} style={{ width: '60px' }} />
            <Column field="username" header={t('admin.username')} />
            <Column field="gamesWon" header={t('admin.gamesWon')} />
            <Column field="totalKills" header={t('admin.totalKills')} />
            <Column field="winRate" header={t('admin.winRate')} body={winRateTemplate} />
          </DataTable>
        </Card>
      </div>

      {/* Detailed User Stats Table */}
      <div className="col-12">
        <Card>
          <h5>{t('admin.allUsersStatistics')}</h5>
          <DataTable 
            value={stats.topPlayers} 
            paginator 
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage={t('admin.noUsersFound')}
          >
            <Column field="avatar" header={t('admin.avatar')} body={avatarTemplate} style={{ width: '60px' }} />
            <Column field="username" header={t('admin.username')} sortable />
            <Column field="firstName" header={t('admin.firstName')} sortable />
            <Column field="lastName" header={t('admin.lastName')} sortable />
            <Column field="email" header={t('admin.email')} sortable />
            <Column field="gamesPlayed" header={t('admin.gamesPlayed')} sortable />
            <Column field="gamesWon" header={t('admin.gamesWon')} sortable />
            <Column field="totalKills" header={t('admin.totalKills')} sortable />
            <Column field="winRate" header={t('admin.winRate')} body={winRateTemplate} sortable />
            <Column field="isActive" header={t('admin.status')} body={statusTemplate} sortable />
          </DataTable>
        </Card>
      </div>
    </div>
  )
}
