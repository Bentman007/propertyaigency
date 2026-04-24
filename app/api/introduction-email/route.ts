import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
export async function POST(req: NextRequest) {
  const { buyer_email, buyer_name, supplier_email, supplier_name, business_name, service_type, address } = await req.json()
  const serviceLabel = service_type?.replace(/_/g, ' ') || 'service'
  const html = (name: string, otherName: string, otherEmail: string, isSupplier: boolean) => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f5f0eb;">
      <h2 style="color:#4a4238;">You've been introduced!</h2>
      <p style="color:#5c5449;">Hi ${name},</p>
      <p style="color:#5c5449;">${isSupplier ? `A client has accepted your quote for <strong>${serviceLabel}</strong>.` : `Your quote has been accepted from <strong>${business_name}</strong> for <strong>${serviceLabel}</strong>.`}</p>
      <div style="background:#fff;border:1px solid #e8e0d8;border-radius:12px;padding:20px;margin:16px 0;">
        <p style="color:#4a4238;margin:0 0 8px;"><strong>${isSupplier ? 'Client' : 'Service Provider'}:</strong> ${otherName}</p>
        <p style="color:#4a4238;margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${otherEmail}" style="color:#f97316;">${otherEmail}</a></p>
        ${isSupplier && address ? `<p style="color:#4a4238;margin:0;"><strong>Address:</strong> ${address}</p>` : ''}
      </div>
      <p style="color:#5c5449;font-size:14px;">Please contact each other directly to arrange payment and next steps.</p>
      <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0;">
      <p style="color:#8a7a6e;font-size:12px;">PropertyAIgency (Pty) Ltd · www.propertyaigency.co.za</p>
    </div>`
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    await Promise.all([
      resend.emails.send({ from: 'PropertyAIgency <introductions@propertyaigency.co.za>', to: supplier_email, subject: `New client introduction — ${serviceLabel}`, html: html(supplier_name||business_name, buyer_name, buyer_email, true) }),
      resend.emails.send({ from: 'PropertyAIgency <introductions@propertyaigency.co.za>', to: buyer_email, subject: `Your ${serviceLabel} quote has been accepted`, html: html(buyer_name, supplier_name||business_name, supplier_email, false) })
    ])
    return NextResponse.json({ sent: true })
  } catch (e: any) { return NextResponse.json({ sent: false, error: e.message }) }
}
