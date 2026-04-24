import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const { to, agent_name, agency, property_title, property_url, buyer_summary } = await req.json()
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: 'Andrew Sharp <andrew@propertyaigency.co.za>',
      to,
      subject: `I have a buyer looking for a property like yours — ${property_title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f5f0eb;">
          <h2 style="color:#4a4238;">Hi ${agent_name},</h2>
          <p style="color:#5c5449;font-size:15px;line-height:1.6;">My name is Andrew Sharp and I'm the founder of <strong>PropertyAIgency</strong> — South Africa's new AI-powered property platform.</p>
          <p style="color:#5c5449;font-size:15px;line-height:1.6;">I noticed your listing <strong>${property_title}</strong> and I have a verified buyer on our platform who is looking for exactly this type of property.</p>
          <p style="color:#5c5449;font-size:15px;line-height:1.6;">I'd love to show your listing to this buyer. I'm offering you a <strong>free listing on PropertyAIgency</strong> for this specific property — no cost, no commitment — so we can get a viewing booked for you.</p>
          <p style="color:#5c5449;font-size:15px;line-height:1.6;">It takes about 5 minutes to list. If the buyer books a viewing and it doesn't work out, you've lost nothing. If it does — you've found your buyer.</p>
          <a href="https://www.propertyaigency.co.za/auth/register" style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin:16px 0;">List This Property Free →</a>
          <p style="color:#8a7a6e;font-size:13px;margin-top:16px;">Happy to answer any questions — just reply to this email.</p>
          <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;">
          <p style="color:#8a7a6e;font-size:12px;">Andrew Sharp · Founder, PropertyAIgency · www.propertyaigency.co.za</p>
        </div>
      `
    })
    return NextResponse.json({ sent: true })
  } catch (e: any) {
    return NextResponse.json({ sent: false, error: e.message })
  }
}
