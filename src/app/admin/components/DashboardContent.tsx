import { useState, useEffect } from "react"
import Axios from "@/utils/Axios"

interface AnalyticsData {
  users: {
    total: number
    newToday: number
    newThisWeek: number
    newThisMonth: number
    activeSubscriptions: number
  }
  orders: {
    total: number
    completed: number
    pending: number
    failed: number
    today: number
    thisMonth: number
  }
  revenue: {
    total: number
    monthly: number
  }
  tokens: {
    distributed: number
    used: number
  }
  resources: {
    total: number
    active: number
    byType: Array<{ _id: string; count: number }>
  }
  leads: {
    total: number
    active: number
  }
  recentUsers: Array<{ _id: string; name: string; email: string; createdAt: string }>
}

export default function DashboardContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    try {
      const response = await Axios.get('/admin/analytics')
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="bg-white border-l-4 border-blue-600 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">Overview of your platform analytics</p>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics?.users?.total || 0}</h3>
              <p className="text-gray-600 text-sm">Total Users</p>
              <p className="text-green-600 text-xs font-medium">+{analytics?.users?.newThisMonth || 0} this month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics?.orders?.total || 0}</h3>
              <p className="text-gray-600 text-sm">Total Orders</p>
              <p className="text-green-600 text-xs font-medium">{analytics?.orders?.completed || 0} completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">₹{analytics?.revenue?.total || 0}</h3>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-green-600 text-xs font-medium">₹{analytics?.revenue?.monthly || 0} this month</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{analytics?.resources?.total || 0}</h3>
              <p className="text-gray-600 text-sm">Total Resources</p>
              <p className="text-blue-600 text-xs font-medium">{analytics?.resources?.active || 0} active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Usage</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-900">Distributed</span>
              <span className="font-medium ">{analytics?.tokens?.distributed || 0}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-600">Used</span>
              <span className="font-medium">{analytics?.tokens?.used || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Utilization</span>
              <span className="font-medium text-blue-600">
                {analytics?.tokens?.distributed ? ((analytics.tokens.used / analytics.tokens.distributed) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriptions</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-medium text-green-600">{analytics?.users?.activeSubscriptions || 0}</span>
            </div>
            <div className="flex justify-between text-gray-900">
              <span className="text-gray-600 ">Total Users</span>
              <span className="font-medium">{analytics?.users?.total || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Today</h3>
          <div className="space-y-2 text-gray-900">
            <div className="flex justify-between ">
              <span className="text-gray-600">Today</span>
              <span className="font-medium">{analytics?.orders?.today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">{analytics?.orders?.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed</span>
              <span className="font-medium text-red-600">{analytics?.orders?.failed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {analytics?.recentUsers?.length ? (
              analytics.recentUsers.map((user) => (
                <div key={user._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{user.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-600">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">No recent users</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Types</h3>
          <div className="space-y-3">
            {analytics?.resources?.byType?.length ? (
              analytics.resources.byType.map((type, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 capitalize">{type._id || 'Unknown'}</span>
                  <span className="text-blue-600 font-medium">{type.count}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">No resources found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
