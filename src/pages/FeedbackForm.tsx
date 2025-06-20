import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { FeedbackFormData, QRCodeData } from '../types'
import { QrCode, Camera, CameraOff } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

export function FeedbackForm() {
  const { user } = useAuth()
  const [isScanning, setIsScanning] = useState(false)
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null)
  const [submitting, setSubmitting] = useState(false)
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FeedbackFormData>()

  const startScanning = async () => {
    try {
      const qrCodeScanner = new Html5Qrcode("qr-reader")
      setHtml5QrCode(qrCodeScanner)
      
      const cameras = await Html5Qrcode.getCameras()
      if (cameras && cameras.length) {
        await qrCodeScanner.start(
          cameras[0].id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Parse QR code data
            try {
              const data: QRCodeData = decodedText.split(";").reduce((acc: any, item) => {
                const [key, value] = item.split(":")
                if (key && value) acc[key.trim().toLowerCase()] = value.trim()
                return acc
              }, {})
              
              setValue('coffee_type', data.type || '')
              setValue('coffee_weight', parseFloat(data.weight) || 0)
              setValue('customer_location', data.location || '')
              
              stopScanning()
              toast.success('QR code scanned successfully!')
            } catch (error) {
              toast.error('Invalid QR code format')
            }
          },
          () => {} // Error callback - ignore
        )
        setIsScanning(true)
      } else {
        toast.error('No camera found')
      }
    } catch (error) {
      toast.error('Camera access denied')
    }
  }

  const stopScanning = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop()
        setIsScanning(false)
        setHtml5QrCode(null)
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  const onSubmit = async (data: FeedbackFormData) => {
    if (!user) return
    
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          customer_name: data.customer_name,
          phone_number: data.phone_number,
          account_number: data.account_number,
          coffee_type: data.coffee_type,
          coffee_weight: data.coffee_weight,
          customer_location: data.customer_location,
          coffee_quality: data.coffee_quality,
          delivery_experience: data.delivery_experience,
          comments: data.comments || null
        })

      if (error) throw error

      toast.success('Feedback submitted successfully!')
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Customer Feedback</h1>
        <p className="text-gray-600 mb-8">Coffee details after collection to their station</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                {...register('customer_name', { required: 'Customer name is required' })}
                className="input-field"
                placeholder="Enter customer name"
              />
              {errors.customer_name && (
                <p className="text-red-500 text-sm mt-1">{errors.customer_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                {...register('phone_number', { required: 'Phone number is required' })}
                type="tel"
                className="input-field"
                placeholder="Enter phone number"
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                {...register('account_number', { required: 'Account number is required' })}
                className="input-field"
                placeholder="Enter account number"
              />
              {errors.account_number && (
                <p className="text-red-500 text-sm mt-1">{errors.account_number.message}</p>
              )}
            </div>
          </div>

          {/* Coffee Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Coffee Information</h3>
              <button
                type="button"
                onClick={isScanning ? stopScanning : startScanning}
                className="flex items-center space-x-2 px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700 transition-colors"
              >
                {isScanning ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                <span>{isScanning ? 'Stop Scanning' : 'Scan QR Code'}</span>
              </button>
            </div>

            {isScanning && (
              <div id="qr-reader" className="w-full max-w-sm mx-auto border rounded-lg overflow-hidden"></div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coffee Type
              </label>
              <input
                {...register('coffee_type', { required: 'Coffee type is required' })}
                className="input-field"
                placeholder="Enter coffee type"
              />
              {errors.coffee_type && (
                <p className="text-red-500 text-sm mt-1">{errors.coffee_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coffee Weight (kg)
              </label>
              <input
                {...register('coffee_weight', { 
                  required: 'Coffee weight is required',
                  min: { value: 0.1, message: 'Weight must be at least 0.1 kg' }
                })}
                type="number"
                step="0.1"
                className="input-field"
                placeholder="Enter coffee weight"
              />
              {errors.coffee_weight && (
                <p className="text-red-500 text-sm mt-1">{errors.coffee_weight.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Location
              </label>
              <input
                {...register('customer_location', { required: 'Customer location is required' })}
                className="input-field"
                placeholder="Enter customer location"
              />
              {errors.customer_location && (
                <p className="text-red-500 text-sm mt-1">{errors.customer_location.message}</p>
              )}
            </div>
          </div>

          {/* Feedback Ratings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Feedback Ratings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coffee Quality
              </label>
              <select
                {...register('coffee_quality', { required: 'Coffee quality rating is required' })}
                className="input-field"
              >
                <option value="">Select rating</option>
                <option value="5">Excellent (5)</option>
                <option value="4">Good (4)</option>
                <option value="3">Average (3)</option>
                <option value="2">Poor (2)</option>
                <option value="1">Not Satisfied (1)</option>
              </select>
              {errors.coffee_quality && (
                <p className="text-red-500 text-sm mt-1">{errors.coffee_quality.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Experience
              </label>
              <select
                {...register('delivery_experience', { required: 'Delivery experience rating is required' })}
                className="input-field"
              >
                <option value="">Select rating</option>
                <option value="5">Excellent (5)</option>
                <option value="4">Good (4)</option>
                <option value="3">Average (3)</option>
                <option value="2">Poor (2)</option>
                <option value="1">Not Satisfied (1)</option>
              </select>
              {errors.delivery_experience && (
                <p className="text-red-500 text-sm mt-1">{errors.delivery_experience.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments
              </label>
              <textarea
                {...register('comments')}
                rows={4}
                className="input-field"
                placeholder="Enter any additional comments..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}