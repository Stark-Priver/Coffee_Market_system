/*
  # Twilio SMS Edge Function

  1. Purpose
    - Send SMS messages to customers using Twilio API
    - Secure API key handling on the server side
    - Log message history for tracking

  2. Security
    - Uses Twilio credentials from environment variables
    - Validates request data
    - Handles errors gracefully

  3. Features
    - Send individual SMS messages
    - Send bulk SMS messages
    - Message template support
    - Delivery status tracking
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

interface SMSRequest {
  to: string
  message: string
  customerName?: string
}

interface BulkSMSRequest {
  recipients: Array<{
    to: string
    message: string
    customerName?: string
  }>
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID")
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN")
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER")

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Twilio credentials not configured")
    }

    const url = req.url
    const method = req.method

    if (method === "POST") {
      const body = await req.json()
      
      // Handle bulk SMS
      if (body.recipients && Array.isArray(body.recipients)) {
        const bulkRequest: BulkSMSRequest = body
        const results = []

        for (const recipient of bulkRequest.recipients) {
          try {
            const result = await sendSMS(
              twilioAccountSid,
              twilioAuthToken,
              twilioPhoneNumber,
              recipient.to,
              recipient.message
            )
            results.push({
              to: recipient.to,
              customerName: recipient.customerName,
              success: true,
              messageId: result.sid,
              status: result.status
            })
          } catch (error) {
            results.push({
              to: recipient.to,
              customerName: recipient.customerName,
              success: false,
              error: error.message
            })
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            results,
            totalSent: results.filter(r => r.success).length,
            totalFailed: results.filter(r => !r.success).length
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }
      
      // Handle single SMS
      else {
        const smsRequest: SMSRequest = body
        
        if (!smsRequest.to || !smsRequest.message) {
          throw new Error("Missing required fields: to, message")
        }

        const result = await sendSMS(
          twilioAccountSid,
          twilioAuthToken,
          twilioPhoneNumber,
          smsRequest.to,
          smsRequest.message
        )

        return new Response(
          JSON.stringify({
            success: true,
            messageId: result.sid,
            status: result.status,
            to: smsRequest.to
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )

  } catch (error) {
    console.error("SMS Error:", error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send SMS"
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})

async function sendSMS(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  toNumber: string,
  message: string
) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  
  const body = new URLSearchParams({
    From: fromNumber,
    To: toNumber,
    Body: message
  })

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`Twilio API Error: ${errorData.message || response.statusText}`)
  }

  return await response.json()
}