import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <Link href="/" className="text-gray-400 hover:text-white text-sm">← Back to Home</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using PropertyAIgency ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Platform Description</h2>
            <p>PropertyAIgency is an AI-powered property listing and search platform operating in South Africa. The Platform connects property sellers and rental agents ("Agents") with prospective buyers and tenants ("Searchers") using artificial intelligence technology.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
            <p className="mb-2">You must register for an account to access certain features. You are responsible for:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and truthful information</li>
              <li>Notifying us immediately of any unauthorised use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Property Listings</h2>
            <p className="mb-2">Agents listing properties on the Platform agree that:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>All listing information is accurate and not misleading</li>
              <li>They have the legal right to advertise the property</li>
              <li>Photos and descriptions are genuine representations of the property</li>
              <li>Pricing information is current and accurate</li>
              <li>Sold or rented properties will be updated promptly</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. AI Features</h2>
            <p>The Platform uses artificial intelligence to assist with property searches, lead qualification, and communication. AI-generated responses are for informational purposes only and should not be relied upon as professional property, legal, or financial advice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Viewing Bookings</h2>
            <p>Viewing bookings made through the Platform are provisional until confirmed by the Agent. PropertyAIgency is not responsible for cancelled or rescheduled viewings. Users agree to honour confirmed viewing appointments.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Fees and Payments</h2>
            <p>During the beta period, the Platform is free to use. Future pricing will be communicated with reasonable notice. All fees are in South African Rand (ZAR) and exclusive of VAT where applicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Posting fraudulent or misleading property listings</li>
              <li>Harassment of other users</li>
              <li>Attempting to circumvent the Platform for transactions</li>
              <li>Scraping or automated data collection</li>
              <li>Posting properties you do not have authority to advertise</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>PropertyAIgency is a technology platform that facilitates connections between property advertisers and searchers. We are not a registered estate agency and do not participate in property transactions. We are not liable for any losses arising from property transactions facilitated through the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact</h2>
            <p>For questions about these terms, contact us at <Link href="/contact" className="text-orange-500 hover:underline">our contact page</Link>.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
