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