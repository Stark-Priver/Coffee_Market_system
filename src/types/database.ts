export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
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
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_name: string
          phone_number: string
          account_number: string
          coffee_type: string
          coffee_weight: number
          customer_location: string
          coffee_quality: number
          delivery_experience: number
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_name?: string
          phone_number?: string
          account_number?: string
          coffee_type?: string
          coffee_weight?: number
          customer_location?: string
          coffee_quality?: number
          delivery_experience?: number
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sms_messages: {
        Row: {
          id: string
          user_id: string
          recipient_phone: string
          recipient_name: string
          message: string
          status: 'pending' | 'sent' | 'delivered' | 'failed'
          twilio_message_id: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipient_phone: string
          recipient_name: string
          message: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          twilio_message_id?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipient_phone?: string
          recipient_name?: string
          message?: string
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          twilio_message_id?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          content: string
          variables: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          content: string
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          content?: string
          variables?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}