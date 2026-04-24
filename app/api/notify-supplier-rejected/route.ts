import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
export async function POST(req: NextRequest) {
  const { email, business_name, reason } = await req.json()
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: 'PropertyAIgency <introductions@propertyaigency.co.za>',
      to: email,
      subject: 'Your PropertyAIgency application',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f5f0eb;">
        <h2 style="color:#4a4238;">Application Update — ${business_name}</h2>
        <p style="color:#5c5449;">Thank you for applying. After reviewing your application, we are unable to approve it at this time${reason ? `: ${reason}` : '.'}.</p>
        <p style="color:#5c5449;">You are welcome to reapply after 30 days.</p>
        <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;">
        <p style="color:#8a7a6e;font-size:12px;">PropertyAIgency (Pty) Ltd · www.propertyaigency.co.za</p>
      </div>`
    })
    return NextResponse.json({ sent: true })
  } catch (e: any) { return NextResponse.json({ sent: false, error: e.message }) }
}
