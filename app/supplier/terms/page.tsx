import Link from 'next/link'

export default function SupplierTermsPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">Property<span className="text-orange-500">AI</span>gency</Link>
        <Link href="/supplier/register" className="text-gray-400 hover:text-white text-sm">Register as a Supplier →</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Supplier Terms & Conditions</h1>
        <p className="text-gray-400 text-sm mb-2">Last updated: April 2026</p>
        <p className="text-gray-400 text-sm mb-8">These terms govern your participation as a service provider on the PropertyAIgency platform. By registering as a supplier you agree to these terms in full.</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Who We Are</h2>
            <p>PropertyAIgency (Pty) Ltd ("PropertyAIgency", "we", "us") operates an AI-powered property platform at propertyaigency.co.za that connects property buyers, sellers and movers with verified service providers ("suppliers"). We act as an introduction platform only. We are not a party to any service agreement between you and a client, and we do not handle payments for services rendered between suppliers and clients.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Eligibility</h2>
            <p className="mb-2">To register as a supplier you must:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Be a legitimate, registered business or sole trader operating in South Africa</li>
              <li>Hold all licences, registrations and qualifications required by law for your service category</li>
              <li>Provide a valid South African mobile number and a working business website</li>
              <li>Not have a previously rejected or terminated supplier account on this platform</li>
              <li>Not register multiple accounts to obtain additional free trials</li>
            </ul>
            <p className="mt-3">We reserve the right to request proof of registration, qualifications or insurance at any time. Failure to provide these within 5 business days may result in account suspension.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Application & Approval</h2>
            <p>All supplier applications are reviewed manually before going live. Submission of an application does not guarantee approval. We will notify you via the platform within 24 hours of a decision. If approved, your 2-month free trial begins from the date of approval. We may reject applications at our sole discretion. If rejected, you may reapply after 30 days with updated information.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. How We Communicate With You</h2>
            <p className="mb-2">All communication between PropertyAIgency and suppliers takes place through the platform, including lead notifications, client messages, account alerts, invoice notifications and admin decisions.</p>
            <p>The only email we send is a single introduction email at the moment a client accepts your quote. This email is sent simultaneously to you and the client and contains the full client details needed for you to proceed with the service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Free Trial</h2>
            <p>Approved suppliers receive a 2-month free trial from the date of approval. During the trial you receive leads at no charge and per-lead fees are fully waived. At the end of your trial your listing is automatically deactivated. Your free trial is available once per business. Registering a new account to obtain a second trial is a breach of these terms and will result in permanent removal from the platform.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Subscription Fees</h2>
            <p className="mb-2">After your free trial, continued access requires a subscription of:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>R2,000 per year (billed annually), or</li>
              <li>R199 per month (billed monthly)</li>
            </ul>
            <p className="mt-3">No lock-in applies — you may cancel at any time and your access continues until the end of the paid period. No partial refunds are given for unused periods.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Per-Lead Fees</h2>
            <p className="mb-2">In addition to the subscription fee, a per-lead fee is charged each time you receive a qualified lead:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Finance & Legal (Bond Originators, Conveyancing Attorneys, Property Valuers, Insurance Brokers): R250 per lead</li>
              <li>Property Services (Solar Installers, Architects, Short-Term Rental Managers, Property Management Companies, Home Inspectors): R200 per lead</li>
              <li>Photography & Presentation (Photographers, Videographers, 3D Tour Specialists, Home Stagers, Interior Designers, Removal Companies, Storage Facilities): R150 per lead</li>
              <li>Home & Garden (Painters, Builders, Plumbers, Electricians, Handymen, Landscapers, Pool Services, Cleaning Companies, Security Companies): R100 per lead</li>
            </ul>
            <p className="mt-3">You are charged for a lead regardless of whether you respond, submit a quote, or whether the client accepts your quote.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. What Counts as a Lead</h2>
            <p>A lead is counted when a buyer selects you as one of their preferred suppliers and submits a quote request through the platform. You are not charged for messages received before a quote request, leads received while paused, or leads received during your free trial.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Invoicing & Payment</h2>
            <p>Lead fees are invoiced on the 1st of each month for all leads received in the previous calendar month. Payment is due within 7 days. Accounts with outstanding invoices older than 14 days will be automatically paused. Accounts with outstanding invoices older than 30 days will be deactivated and may be referred for debt collection. We reserve the right to charge interest on overdue invoices at 2% per month.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Lead Limits & Pausing</h2>
            <p>You may set a weekly lead limit of a minimum of 5 leads per week. You may pause your account at any time — while paused your profile is hidden from buyers and you receive no leads and incur no lead fees.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Client Address Privacy</h2>
            <p>When a buyer requests a quote from you, you receive their suburb and general area only. Their full street address is shared only after the buyer accepts your quote, at which point PropertyAIgency sends a single introduction email to both parties. You agree to use the client's address solely for the purpose of fulfilling the agreed service.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Quality Standards</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Respond to lead requests within 24 hours</li>
              <li>Submit quotes that are accurate, honest and reflect your actual pricing</li>
              <li>Deliver services to the standard described in your profile</li>
              <li>Behave professionally and courteously toward all clients</li>
              <li>Maintain all required licences, registrations and insurance throughout your time on the platform</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Complaints & Removal</h2>
            <p>A supplier who receives 10 or more verified complaints of the same nature will receive a formal warning. If issues are not resolved within 14 days, the supplier will be permanently removed with no refund of subscription fees. PropertyAIgency reserves the right to suspend or remove any supplier at any time for serious misconduct, fraud or breach of these terms without prior warning and without refund.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">14. POPIA & Data Protection</h2>
            <p>Client personal information shared with you is subject to POPIA. You agree to process this information only for the purpose of fulfilling the agreed service, to keep it secure, not to share it with third parties and to delete it once the service is complete.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">15. Limitation of Liability</h2>
            <p>PropertyAIgency is an introduction platform only. We are not liable for any loss, damage or expense arising from your interactions with clients, the quality of leads provided, or cancelled service agreements. Our total liability is limited to the subscription fees paid by you in the preceding 3 months.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">16. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">17. Contact</h2>
            <p>For questions contact us via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link> or email admin@propertyaigency.co.za.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/supplier/terms" className="hover:text-white">Supplier Terms</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
