import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
export async function POST(req: NextRequest) {
  const { email, business_name } = await req.json()
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await resend.emails.send({
      from: 'PropertyAIgency <introductions@propertyaigency.co.za>',
      to: email,
      subject: "You're approved — welcome to PropertyAIgency",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f5f0eb;">
        <h2 style="color:#4a4238;">Welcome, ${business_name}!</h2>
        <p style="color:#5c5449;">Your application has been approved and your 2-month free trial has begun. Your profile is now live.</p>
        <a href="https://www.propertyaigency.co.za/supplier/login" style="display:inline-block;background:#f97316;color:white;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;margin:16px 0;">Go to My Dashboard →</a>
        <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;">
        <p style="color:#8a7a6e;font-size:12px;">PropertyAIgency (Pty) Ltd · www.propertyaigency.co.za</p>
      </div>`
    })
    return NextResponse.json({ sent: true })
  } catch (e: any) { return NextResponse.json({ sent: false, error: e.message }) }
}
