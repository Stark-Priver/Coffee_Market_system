import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MessageSquare, FileText, TrendingUp, Users } from 'lucide-react'

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageQuality: 0,
    averageDelivery: 0,
    recentFeedbacks: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      // Get total feedbacks count
      const { count: totalFeedbacks } = await supabase
        .from('feedback')
        .select('*', { count: 'exact', head: true })

      // Get average ratings
      const { data: feedbacks } = await supabase
        .from('feedback')
        .select('coffee_quality, delivery_experience, created_at')

      let averageQuality = 0
      let averageDelivery = 0
      let recentFeedbacks = 0

      if (feedbacks && feedbacks.length > 0) {
        const qualitySum = feedbacks.reduce((sum, f) => sum + f.coffee_quality, 0)
        const deliverySum = feedbacks.reduce((sum, f) => sum + f.delivery_experience, 0)
        
        averageQuality = qualitySum / feedbacks.length
        averageDelivery = deliverySum / feedbacks.length

        // Count recent feedbacks (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        recentFeedbacks = feedbacks.filter(f => 
          new Date(f.created_at) > sevenDaysAgo
        ).length
      }

      setStats({
        totalFeedbacks: totalFeedbacks || 0,
        averageQuality: Math.round(averageQuality * 10) / 10,
        averageDelivery: Math.round(averageDelivery * 10) / 10,
        recentFeedbacks
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Feedbacks',
      value: stats.totalFeedbacks,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Average Quality Rating',
      value: `${stats.averageQuality}/5`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Average Delivery Rating',
      value: `${stats.averageDelivery}/5`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Recent Feedbacks (7 days)',
      value: stats.recentFeedbacks,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name || user?.email}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your coffee marketing system.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/feedback"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-coffee-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-coffee-600 mr-3" />
              <span className="font-medium">Submit New Feedback</span>
            </Link>
            <Link
              to="/records"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-coffee-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-coffee-600 mr-3" />
              <span className="font-medium">View All Records</span>
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Account Type:</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span>Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="font-medium">{user.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}