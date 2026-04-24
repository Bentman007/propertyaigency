import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 text-stone-900">
      <nav className="bg-stone-100 border-b border-stone-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <Link href="/" className="text-stone-500 hover:text-stone-900 text-sm">← Back to Home</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-stone-500 text-sm mb-2">Last updated: April 2026</p>
        <p className="text-stone-500 text-sm mb-8">These terms apply to all users of the PropertyAIgency platform including buyers, renters, estate agents, private sellers and service providers.</p>

        <div className="space-y-8 text-stone-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using PropertyAIgency ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">2. Platform Description</h2>
            <p>PropertyAIgency is an AI-powered property platform operating in South Africa. The Platform connects property sellers and agents with buyers and renters, and connects property-related service providers with clients who need their services. PropertyAIgency is a technology introduction platform only — we are not a registered estate agency and do not participate in property transactions or service agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">3. User Accounts</h2>
            <p className="mb-2">You must register for an account to access certain features. You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate, truthful and current information</li>
              <li>Notifying us immediately of any unauthorised use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">4. How We Communicate With You</h2>
            <p className="mb-2">All day-to-day communication on this Platform takes place through the platform itself, including:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500 mb-3">
              <li>AI Concierge messages and property recommendations</li>
              <li>Viewing booking confirmations and updates</li>
              <li>Quote requests, quote submissions and quote responses</li>
              <li>Lead notifications for service providers</li>
              <li>Platform notifications and account alerts</li>
            </ul>
            <p>The only email we send is a single introduction email when a service quote is accepted by a client. This email is sent to both the client and the service provider simultaneously and contains the details needed for them to proceed directly with each other. We do not send marketing emails, newsletters or routine notification emails.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">5. Property Listings</h2>
            <p className="mb-2">Agents and private sellers listing properties on the Platform agree that:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500">
              <li>All listing information is accurate, current and not misleading</li>
              <li>They have the legal right to advertise the property</li>
              <li>Photos and descriptions are genuine representations of the property</li>
              <li>Pricing information is current and accurate</li>
              <li>Sold or rented properties will be marked as such promptly</li>
              <li>Estate agents hold a valid EAAB registration number</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">6. AI Features</h2>
            <p>The Platform uses artificial intelligence to assist with property searches, lead qualification, profile building and communication. AI-generated content is for informational purposes only and does not constitute professional property, legal, financial or investment advice. Users should not rely solely on AI-generated responses when making property or financial decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">7. Viewing Bookings</h2>
            <p>Viewing bookings made through the Platform are provisional until confirmed by the agent. PropertyAIgency is not responsible for cancelled, rescheduled or missed viewings. All parties agree to honour confirmed viewing appointments. No-shows may result in account restrictions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">8. Marketplace & Service Providers</h2>
            <p className="mb-2">The PropertyAIgency Marketplace connects buyers, sellers and movers with verified service providers. The following terms apply to all marketplace interactions:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500">
              <li>PropertyAIgency is an introduction platform only — we are not a party to any service agreement between a client and a supplier</li>
              <li>All quotes, pricing and service terms are agreed directly between the client and the supplier</li>
              <li>Payment for services is made directly between the client and the supplier — PropertyAIgency does not handle, hold or process payments for services rendered</li>
              <li>A client's full address is only shared with a supplier after the client accepts a quote</li>
              <li>Suppliers are verified by PropertyAIgency before going live but we do not guarantee the quality of any service provided</li>
              <li>Clients should conduct their own due diligence before engaging any service provider</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">9. Fees and Payments</h2>
            <p className="mb-2">Fees vary by account type:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500">
              <li>Buyers and renters: free, no charges ever</li>
              <li>Private sellers: from R199 per listing for a 2-month listing period</li>
              <li>Estate agents: free 2-month trial, then from R800/month</li>
              <li>Service providers: free 2-month trial, then R2000/year or R199/month, plus per-lead fees</li>
            </ul>
            <p className="mt-3">All fees are in South African Rand (ZAR). VAT will be added where applicable once PropertyAIgency is VAT registered. Full supplier fee terms are set out in the Supplier Terms and Conditions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">10. Prohibited Conduct</h2>
            <p className="mb-2">The following are strictly prohibited:</p>
            <ul className="list-disc list-inside space-y-1 text-stone-500">
              <li>Posting fraudulent, misleading or inaccurate property listings or supplier profiles</li>
              <li>Harassment, abuse or threatening behaviour toward other users</li>
              <li>Attempting to conduct transactions outside the platform to avoid fees</li>
              <li>Scraping, automated data collection or reverse engineering of the Platform</li>
              <li>Registering multiple accounts to obtain free trials more than once</li>
              <li>Sharing login credentials with third parties</li>
              <li>Posting properties or services you do not have authority to advertise</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">11. Limitation of Liability</h2>
            <p>PropertyAIgency provides a technology platform to facilitate introductions between parties. We are not liable for any loss, damage or expense arising from property transactions, service agreements, cancelled viewings, inaccurate listings or any reliance on AI-generated content. Our total liability to any user in any circumstance is limited to the fees paid by that user to PropertyAIgency in the preceding 3 months.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">12. Termination</h2>
            <p>We reserve the right to suspend or terminate any account that breaches these terms, without prior notice and without refund of any prepaid fees. Users may close their account at any time from their account settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">13. Changes to These Terms</h2>
            <p>We may update these terms from time to time. Material changes will be notified to you via the platform. Continued use of the Platform after changes are posted constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">14. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-stone-900 mb-3">15. Contact</h2>
            <p>For questions about these terms, contact us via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link> or email admin@propertyaigency.co.za.</p>
          </section>

        </div>
      </div>

      <footer className="border-t border-stone-200 px-6 py-8 text-center text-stone-400 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-stone-900">How It Works</Link>
          <Link href="/terms" className="hover:text-stone-900">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-stone-900">Privacy Policy</Link>
          <Link href="/supplier/terms" className="hover:text-stone-900">Supplier Terms</Link>
          <Link href="/contact" className="hover:text-stone-900">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
