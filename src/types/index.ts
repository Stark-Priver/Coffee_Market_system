export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'customer' | 'admin'
}

export interface Feedback {
  id: string
  user_id: string
  customer_name: string
  phone_number: string
  account_number: string
  coffee_type: string
  coffee_weight: number
  customer_location: string
  coffee_quality: number
  delivery_experience: number
  comments?: string
  created_at: string
  updated_at: string
}

export interface FeedbackFormData {
  customer_name: string
  phone_number: string
  account_number: string
  coffee_type: string
  coffee_weight: number
  customer_location: string
  coffee_quality: number
  delivery_experience: number
  comments?: string
}

export interface QRCodeData {
  type: string
  weight: string
  location: string
}

export interface SMSMessage {
  id: string
  user_id: string
  recipient_phone: string
  recipient_name: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  twilio_message_id?: string
  sent_at?: string
  created_at: string
}

export interface SMSRequest {
  to: string
  message: string
  customerName?: string
}

export interface BulkSMSRequest {
  recipients: Array<{
    to: string
    message: string
    customerName?: string
  }>
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  variables: string[]
  created_at: string
}