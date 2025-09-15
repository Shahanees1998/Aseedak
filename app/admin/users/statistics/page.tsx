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
          label: 'Number of Players',
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
        value={rowData.isActive ? 'Active' : 'Inactive'} 
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
          <h5>User Statistics Dashboard</h5>
          <p className="text-color-secondary">Comprehensive analytics and user performance metrics</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-12">
        <div className="grid">
          <div className="col-12 md:col-3">
            <Card>
              <div className="flex justify-content-between align-items-center">
                <div>
                  <span className="block text-500 font-medium mb-3">Total Users</span>
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
                  <span className="block text-500 font-medium mb-3">Active Users</span>
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
                  <span className="block text-500 font-medium mb-3">Total Games</span>
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
                  <span className="block text-500 font-medium mb-3">Avg Win Rate</span>
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
          <h5>Win Rate Distribution</h5>
          <div style={{ height: '300px' }}>
            <Chart type="doughnut" data={chartData} options={chartOptions} />
          </div>
        </Card>
      </div>

      <div className="col-12 lg:col-6">
        <Card>
          <h5>Top Performers</h5>
          <DataTable 
            value={stats.topPlayers.slice(0, 5)} 
            className="p-datatable-sm"
            emptyMessage="No data available"
          >
            <Column field="avatar" header="Avatar" body={avatarTemplate} style={{ width: '60px' }} />
            <Column field="username" header="Username" />
            <Column field="gamesWon" header="Wins" />
            <Column field="totalKills" header="Kills" />
            <Column field="winRate" header="Win Rate" body={winRateTemplate} />
          </DataTable>
        </Card>
      </div>

      {/* Detailed User Stats Table */}
      <div className="col-12">
        <Card>
          <h5>All Users Statistics</h5>
          <DataTable 
            value={stats.topPlayers} 
            paginator 
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            className="p-datatable-sm"
            emptyMessage="No users found"
          >
            <Column field="avatar" header="Avatar" body={avatarTemplate} style={{ width: '60px' }} />
            <Column field="username" header="Username" sortable />
            <Column field="firstName" header="First Name" sortable />
            <Column field="lastName" header="Last Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="gamesPlayed" header="Games Played" sortable />
            <Column field="gamesWon" header="Games Won" sortable />
            <Column field="totalKills" header="Total Kills" sortable />
            <Column field="winRate" header="Win Rate" body={winRateTemplate} sortable />
            <Column field="isActive" header="Status" body={statusTemplate} sortable />
          </DataTable>
        </Card>
      </div>
    </div>
  )
}
