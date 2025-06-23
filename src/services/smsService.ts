import { supabase } from '../lib/supabase'
import { SMSRequest, BulkSMSRequest } from '../types'

const SMS_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`

export class SMSService {
  private static async callEdgeFunction(endpoint: string, data: any) {
    const response = await fetch(`${SMS_FUNCTION_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send SMS')
    }

    return response.json()
  }

  static async sendSingleSMS(request: SMSRequest, userId: string) {
    try {
      // Send SMS via edge function
      const result = await this.callEdgeFunction('', request)

      // Log message to database
      await supabase.from('sms_messages').insert({
        user_id: userId,
        recipient_phone: request.to,
        recipient_name: request.customerName || 'Unknown',
        message: request.message,
        status: result.success ? 'sent' : 'failed',
        twilio_message_id: result.messageId,
        sent_at: result.success ? new Date().toISOString() : null,
      })

      return result
    } catch (error) {
      // Log failed message to database
      await supabase.from('sms_messages').insert({
        user_id: userId,
        recipient_phone: request.to,
        recipient_name: request.customerName || 'Unknown',
        message: request.message,
        status: 'failed',
      })

      throw error
    }
  }

  static async sendBulkSMS(request: BulkSMSRequest, userId: string) {
    try {
      // Send bulk SMS via edge function
      const result = await this.callEdgeFunction('', request)

      // Log all messages to database
      const messagesToLog = result.results.map((r: any) => ({
        user_id: userId,
        recipient_phone: r.to,
        recipient_name: r.customerName || 'Unknown',
        message: request.recipients.find(rec => rec.to === r.to)?.message || '',
        status: r.success ? 'sent' : 'failed',
        twilio_message_id: r.messageId || null,
        sent_at: r.success ? new Date().toISOString() : null,
      }))

      await supabase.from('sms_messages').insert(messagesToLog)

      return result
    } catch (error) {
      // Log failed messages to database
      const failedMessages = request.recipients.map(recipient => ({
        user_id: userId,
        recipient_phone: recipient.to,
        recipient_name: recipient.customerName || 'Unknown',
        message: recipient.message,
        status: 'failed' as const,
      }))

      await supabase.from('sms_messages').insert(failedMessages)

      throw error
    }
  }

  static async getMessageHistory(userId: string) {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async getMessageTemplates(userId: string) {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async saveMessageTemplate(userId: string, name: string, content: string, variables: string[]) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert({
        user_id: userId,
        name,
        content,
        variables,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteMessageTemplate(templateId: string) {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error
  }
}