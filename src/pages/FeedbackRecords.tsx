import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Feedback } from '../types'
import { Search, Filter, Download } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function FeedbackRecords() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  useEffect(() => {
    filterFeedbacks()
  }, [feedbacks, searchTerm, qualityFilter])

  const fetchFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFeedbacks(data || [])
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFeedbacks = () => {
    let filtered = feedbacks

    if (searchTerm) {
      filtered = filtered.filter(feedback =>
        feedback.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.phone_number.includes(searchTerm) ||
        feedback.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.coffee_type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (qualityFilter) {
      filtered = filtered.filter(feedback =>
        feedback.coffee_quality.toString() === qualityFilter
      )
    }

    setFilteredFeedbacks(filtered)
  }

  const getRatingText = (rating: number) => {
    const ratings = {
      5: 'Excellent',
      4: 'Good',
      3: 'Average',
      2: 'Poor',
      1: 'Not Satisfied'
    }
    return ratings[rating as keyof typeof ratings] || 'Unknown'
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100'
    if (rating === 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const exportToCSV = () => {
    const headers = [
      'Customer Name',
      'Phone Number',
      'Account Number',
      'Coffee Type',
      'Coffee Weight (kg)',
      'Customer Location',
      'Coffee Quality',
      'Delivery Experience',
      'Comments',
      'Date Submitted'
    ]

    const csvData = filteredFeedbacks.map(feedback => [
      feedback.customer_name,
      feedback.phone_number,
      feedback.account_number,
      feedback.coffee_type,
      feedback.coffee_weight,
      feedback.customer_location,
      `${feedback.coffee_quality} - ${getRatingText(feedback.coffee_quality)}`,
      `${feedback.delivery_experience} - ${getRatingText(feedback.delivery_experience)}`,
      feedback.comments || '',
      new Date(feedback.created_at).toLocaleDateString()
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-records-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Feedback Records</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 btn-primary"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, account, or coffee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Quality Ratings</option>
              <option value="5">Excellent (5)</option>
              <option value="4">Good (4)</option>
              <option value="3">Average (3)</option>
              <option value="2">Poor (2)</option>
              <option value="1">Not Satisfied (1)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredFeedbacks.length} of {feedbacks.length} records
      </div>

      {/* Records Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coffee Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ratings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeedbacks.map((feedback) => (
                <tr key={feedback.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {feedback.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {feedback.phone_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Account: {feedback.account_number}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {feedback.coffee_type}
                      </div>
                      <div className="text-sm text-gray-500">
                        {feedback.coffee_weight} kg
                      </div>
                      <div className="text-sm text-gray-500">
                        {feedback.customer_location}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(feedback.coffee_quality)}`}>
                        Quality: {feedback.coffee_quality}/5
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(feedback.delivery_experience)}`}>
                        Delivery: {feedback.delivery_experience}/5
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {feedback.comments || 'No comments'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeedbacks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No feedback records found.</p>
          </div>
        )}
      </div>
    </div>
  )
}