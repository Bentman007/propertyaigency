import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(`property-chat:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { messages, property, user_id, session_id } = body

    if (!messages || !property) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch user profile if logged in
    let userContext = ''
    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user_id)
        .single()
      if (profile) {
        userContext = `
The user is already logged in. Their details are:
- Name: ${profile.full_name || 'unknown'}
- Email: ${profile.email || 'unknown'}
- Phone: ${profile.phone || 'unknown'}

IMPORTANT: NEVER ask the user for their name, email, phone number or any contact details. You already have them. If they want to book a viewing or make an offer, confirm using the details above.`
      }
    }

    const systemPrompt = `You are an AI Property Concierge for ${property.title} in ${property.suburb}, ${property.city}. 
You are knowledgeable, warm and helpful. Answer questions about this property and the area.
Keep responses concise and conversational. Do NOT use markdown formatting like **bold** or *italic* — write in plain conversational text only.

Property details:
- Price: R${property.price?.toLocaleString()} ${property.price_type === 'rent' ? 'per month' : ''}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Description: ${property.description || 'A wonderful property'}

For bond calculations use 11.75% annual interest rate over 20 years.
${userContext}

Your role is to be the trusted intermediary between the buyer and the agent. You represent PropertyAIgency — a professional platform that handles all communication between parties.

CRITICAL TONE RULES:
- NEVER say "contact the agent directly" or "reach out to the agent" — you ARE the go-between
- NEVER say "I recommend contacting..." — handle it yourself
- If the property is listed as active, confidently confirm it is available based on the current listing status
- Always caveat availability with: "Based on the current listing status, this property is available — I'll flag any changes to you immediately if the status updates"
- Be confident and reassuring — you have access to the listing information and will keep them informed
- If you don't know something specific, say "Let me note that question and make sure the agent addresses it at the viewing" — never punt to the agent directly
- You are the buyer's advocate and guide throughout the entire process

If the property is listed by a private seller (not an agent), after answering their first question naturally mention: "💡 One tip — properties with 3D virtual tours get significantly more enquiries as buyers can explore before visiting. We have specialist photographers in our marketplace who offer this service. Would you like me to request a quote for you?" If they say yes, confirm you will arrange it and include at end of message: <service_request>virtual_tour</service_request>
If they ask about photography or staging, similarly offer to connect them with a specialist and include: <service_request>photography</service_request> or <service_request>staging</service_request>

If the user wants to book a viewing, say: "Great! Just tap the 📅 Book a Viewing button below to request a time with the agent."
If the user wants to make an offer, say: "Fantastic! Tap the 💰 Make an Offer button below to submit your offer directly to the agent."
If the user wants to save the property, say: "Tap the ❤️ heart icon at the top to save this property to your favourites."
Never try to collect contact details or process bookings/offers yourself — always direct to the relevant button.

Include at end of every message, 3-4 contextual prompts the user might want to tap next:
<prompts>["Option 1", "Option 2", "Option 3"]</prompts>

Good prompt examples based on context:
- After greeting: ["Is this still available?", "What are schools nearby?", "What is the area like?", "Book a viewing"]
- After availability question: ["Book a viewing", "What is the price?", "Tell me about the area", "How much are transfer costs?"]
- After area question: ["What schools are nearby?", "How far to the highway?", "Is it pet friendly?", "Book a viewing"]
- After price question: ["Calculate my bond", "What are transfer costs?", "Is the price negotiable?", "Book a viewing"]
- After bond calc: ["Book a viewing", "Make an offer", "What is included?", "Tell me more about the property"]

Include at end of every message:
<lead>{"score": 20, "temperature": "cold", "reason": "Initial contact"}</lead>`

    let response: any = null
    let attempts = 0
    while (attempts < 3) {
      try {
        response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 500,
      system: systemPrompt,
          messages: messages
        })
        break
      } catch (err: any) {
        attempts++
        if (err?.status === 429 && attempts < 3) {
          await new Promise(r => setTimeout(r, 1000 * attempts))
          continue
        }
        throw err
      }
    }

    const aiText = response.content[0].type === 'text' ? response.content[0].text : ''
    
    let cleanContent = aiText
    let leadData = { score: 20, temperature: 'cold', reason: '' }

    const leadMatch = aiText.match(/<lead>([\s\S]*?)<\/lead>/)
    if (leadMatch) {
      try { leadData = JSON.parse(leadMatch[1]) } catch (e) {}
      cleanContent = cleanContent.replace(/<lead>[\s\S]*?<\/lead>/, '').trim()
    }

    // Detect booking intent from user's last message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || ''
    const bookingIntent = /book|viewing|visit|come see|schedule|appointment/i.test(lastUserMessage)
    const timeMatch = lastUserMessage.match(/(\d{1,2})\s*(?::|h|am|pm)?\s*(\d{0,2})\s*(am|pm)?/i)
    const dateMatch = lastUserMessage.match(/monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}[\/\-]\d{1,2}/i)

    let bookingId = null
    let bookingConfirmed = false

    if (bookingIntent && user_id && property?.id && dateMatch && timeMatch) {
      try {
        // Parse the requested time
        let hour = parseInt(timeMatch[1])
        const isPM = lastUserMessage.toLowerCase().includes('pm') && hour < 12
        if (isPM) hour += 12
        const timeStr = `${hour.toString().padStart(2, '0')}:00`

        // Parse the requested date
        const today = new Date()
        let bookingDate = new Date()
        const dayStr = lastUserMessage.toLowerCase()
        const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
        const dayIndex = days.findIndex(d => dayStr.includes(d))
        if (dayStr.includes('tomorrow')) {
          bookingDate.setDate(today.getDate() + 1)
        } else if (dayIndex !== -1) {
          const diff = (dayIndex - today.getDay() + 7) % 7 || 7
          bookingDate.setDate(today.getDate() + diff)
        }
        const dateStr = bookingDate.toISOString().split('T')[0]

        // Check agent availability first
        const { data: slots } = await supabase
          .from('agent_availability')
          .select('*')
          .eq('agent_id', property.agent_id || property.user_id)
          .eq('date', dateStr)
          .eq('start_time', timeStr)
          .eq('is_booked', false)

        // Submit booking (whether slot exists or not - as a request)
        const bookingRes = await fetch(`${request.nextUrl.origin}/api/book-viewing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            property_id: property.id,
            agent_id: property.agent_id || property.user_id,
            searcher_id: user_id,
            slot: { date: dateStr, start_time: timeStr, id: slots?.[0]?.id },
            session_id
          })
        })
        const bookingData = await bookingRes.json()
        if (bookingData.success) {
          bookingId = bookingData.booking_id
          bookingConfirmed = true
          cleanContent = `✅ Done! I've submitted your viewing request for **${bookingDate.toLocaleDateString('en-ZA', { weekday: 'long', month: 'long', day: 'numeric' })} at ${timeStr}**. The agent will confirm shortly and you'll get a notification. Would you like me to set you a reminder — the night before or morning of the viewing?`
        }
      } catch (e) {
        console.error('Auto-booking error:', e)
      }
    }

    // Extract suggested prompts
    let propertySuggestedPrompts: string[] = []
    const propertyPromptsMatch = aiText.match(/<prompts>([\s\S]*?)<\/prompts>/)
    if (propertyPromptsMatch) {
      try { propertySuggestedPrompts = JSON.parse(propertyPromptsMatch[1]) } catch(e) {}
      cleanContent = cleanContent.replace(/<prompts>[\s\S]*?<\/prompts>/, '').trim()
    }

    // Handle service request if AI triggered one
    const serviceMatch = aiText.match(/<service_request>(.*?)<\/service_request>/)
    if (serviceMatch && user_id && session_id) {
      const serviceType = serviceMatch[1]
      cleanContent = cleanContent.replace(/<service_request>.*?<\/service_request>/, '').trim()
      await fetch(`${request.nextUrl.origin}/api/service-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          property_id: session_id,
          service_type: serviceType,
          notes: 'Requested via AI Concierge'
        })
      })
    }

    // Save conversation async
    if (session_id) {
      supabase.from('property_conversations').upsert({
        property_id: session_id,
        user_id: user_id || null,
        session_id,
        messages,
        lead_score: leadData.score,
        lead_temperature: leadData.temperature,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' }).then(() => {}) as any
    }

    return NextResponse.json({
      message: cleanContent,
      booking_confirmed: bookingConfirmed,
      booking_id: bookingId,
      show_booking: false,
      slots: [],
      lead: leadData,
      suggested_prompts: propertySuggestedPrompts
    })

  } catch (error: any) {
    console.error('Property chat error:', error.message)
    return NextResponse.json({ 
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
