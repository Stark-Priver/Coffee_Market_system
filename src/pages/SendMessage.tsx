import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { SMSService } from '../services/smsService'
import { Feedback, MessageTemplate } from '../types'
import { Send, Users, MessageSquare, Plus, Trash2, Edit } from 'lucide-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

export function SendMessage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'templates'>('single')
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Feedback[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  
  // Single message form
  const [singleMessage, setSingleMessage] = useState({
    phone: '',
    customerName: '',
    message: ''
  })

  // Bulk message form
  const [bulkMessage, setBulkMessage] = useState('')

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    variables: [] as string[]
  })

  const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

  useEffect(() => {
    fetchCustomers()
    fetchTemplates()
  }, [])

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('customer_name, phone_number, account_number, customer_location')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Remove duplicates based on phone number
      const uniqueCustomers = data?.reduce((acc: Feedback[], current) => {
        const exists = acc.find(item => item.phone_number === current.phone_number)
        if (!exists) {
          acc.push(current as Feedback)
        }
        return acc
      }, []) || []

      setCustomers(uniqueCustomers)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchTemplates = async () => {
    if (!user) return
    
    try {
      const data = await SMSService.getMessageTemplates(user.id)
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      await SMSService.sendSingleSMS({
        to: singleMessage.phone,
        message: singleMessage.message,
        customerName: singleMessage.customerName
      }, user.id)

      toast.success('Message sent successfully!')
      setSingleMessage({ phone: '', customerName: '', message: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const handleSendBulk = async () => {
    if (!user || selectedCustomers.length === 0) return

    setLoading(true)
    try {
      const recipients = selectedCustomers.map(phone => {
        const customer = customers.find(c => c.phone_number === phone)
        return {
          to: phone,
          message: bulkMessage,
          customerName: customer?.customer_name || 'Customer'
        }
      })

      const result = await SMSService.sendBulkSMS({ recipients }, user.id)
      
      toast.success(`Messages sent! ${result.totalSent} successful, ${result.totalFailed} failed`)
      setSelectedCustomers([])
      setBulkMessage('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send bulk messages')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Extract variables from template content (words wrapped in {})
      const variables = templateForm.content.match(/\{([^}]+)\}/g)?.map(v => v.slice(1, -1)) || []
      
      await SMSService.saveMessageTemplate(user.id, templateForm.name, templateForm.content, variables)
      
      toast.success('Template saved successfully!')
      setTemplateForm({ name: '', content: '', variables: [] })
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await SMSService.deleteMessageTemplate(templateId)
      toast.success('Template deleted successfully!')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template')
    }
  }

  const useTemplate = (template: MessageTemplate) => {
    if (activeTab === 'single') {
      setSingleMessage(prev => ({ ...prev, message: template.content }))
    } else if (activeTab === 'bulk') {
      setBulkMessage(template.content)
    }
    setActiveTab(activeTab === 'templates' ? 'single' : activeTab)
  }

  const tabs = [
    { id: 'single', label: 'Single Message', icon: MessageSquare },
    { id: 'bulk', label: 'Bulk Messages', icon: Users },
    { id: 'templates', label: 'Templates', icon: Plus }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Messages</h1>
        <p className="text-gray-600">Send SMS messages to your customers using Twilio</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-coffee-500 text-coffee-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Single Message Tab */}
      {activeTab === 'single' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Single Message</h3>
          
          <form onSubmit={handleSendSingle} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={singleMessage.phone}
                  onChange={(e) => setSingleMessage(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={singleMessage.customerName}
                  onChange={(e) => setSingleMessage(prev => ({ ...prev, customerName: e.target.value }))}
                  className="input-field"
                  placeholder="Customer name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={singleMessage.message}
                onChange={(e) => setSingleMessage(prev => ({ ...prev, message: e.target.value }))}
                className="input-field"
                placeholder="Enter your message..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {singleMessage.message.length}/160 characters
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Messages Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Recipients</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={selectedCustomers.length === customers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCustomers(customers.map(c => c.phone_number))
                    } else {
                      setSelectedCustomers([])
                    }
                  }}
                  className="rounded border-gray-300 text-coffee-600 focus:ring-coffee-500"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                  Select All ({customers.length} customers)
                </label>
              </div>

              {customers.map((customer) => (
                <div key={customer.phone_number} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={customer.phone_number}
                    checked={selectedCustomers.includes(customer.phone_number)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCustomers(prev => [...prev, customer.phone_number])
                      } else {
                        setSelectedCustomers(prev => prev.filter(p => p !== customer.phone_number))
                      }
                    }}
                    className="rounded border-gray-300 text-coffee-600 focus:ring-coffee-500"
                  />
                  <label htmlFor={customer.phone_number} className="text-sm text-gray-700 flex-1">
                    <span className="font-medium">{customer.customer_name}</span>
                    <span className="text-gray-500 ml-2">{customer.phone_number}</span>
                    <span className="text-gray-400 ml-2">({customer.customer_location})</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-coffee-50 rounded-lg">
              <p className="text-sm text-coffee-700">
                Selected: {selectedCustomers.length} recipients
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                rows={4}
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="input-field"
                placeholder="Enter your message..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {bulkMessage.length}/160 characters
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleSendBulk}
                disabled={loading || selectedCustomers.length === 0 || !bulkMessage.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? <LoadingSpinner /> : <Send className="h-4 w-4" />}
                <span>{loading ? 'Sending...' : `Send to ${selectedCustomers.length} recipients`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Template</h3>
            
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Welcome Message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
                  className="input-field"
                  placeholder="Hello {customerName}, thank you for your feedback on {coffeeType}..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{variableName}'} for dynamic content (e.g., {'{customerName}'}, {'{coffeeType}'})
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Templates</h3>
            
            {templates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No templates saved yet</p>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => useTemplate(template)}
                          className="text-coffee-600 hover:text-coffee-700 text-sm"
                        >
                          Use Template
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{template.content}</p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <span
                            key={variable}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-coffee-100 text-coffee-800"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}