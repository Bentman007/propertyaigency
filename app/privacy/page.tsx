import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <Link href="/" className="text-gray-400 hover:text-white text-sm">← Back to Home</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-2">Last updated: April 2026</p>
        <p className="text-gray-400 text-sm mb-8">PropertyAIgency (Pty) Ltd is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This policy explains what we collect, why we collect it, how we use it and your rights.</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Who We Are</h2>
            <p>PropertyAIgency (Pty) Ltd ("PropertyAIgency", "we", "us", "our") is the responsible party for the processing of your personal information. We operate the property platform at propertyaigency.co.za and propertyaigency.com. Our information officer can be contacted via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following categories of personal information:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Identity information: full name</li>
              <li>Contact information: email address, phone number</li>
              <li>Professional information: agency name, EAAB registration number (agents only)</li>
              <li>Business information: business name, website, areas served, logo (suppliers only)</li>
              <li>Property information: listing details, photos, addresses provided by agents and sellers</li>
              <li>Search and preference data: property search queries, saved properties, viewing history</li>
              <li>Communication data: messages sent through the platform, AI Concierge conversations</li>
              <li>Transaction data: viewing bookings, quote requests, quote responses</li>
              <li>Technical data: device type, browser type, IP address, platform usage patterns</li>
              <li>Location data: approximate location used to show nearby properties (only with your permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We process your personal information only for the following lawful purposes:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>To create and manage your account on the platform</li>
              <li>To match property searchers with relevant listings using AI</li>
              <li>To facilitate viewing bookings between buyers and agents</li>
              <li>To connect buyers and sellers with verified service providers at the right moment in their property journey</li>
              <li>To deliver platform notifications through the platform itself</li>
              <li>To send a single introduction email when a service quote is accepted — this is the only email we send and it goes to both the client and supplier simultaneously</li>
              <li>To build anonymised AI-assisted buyer profiles to improve property recommendations</li>
              <li>To process and track lead delivery to service providers</li>
              <li>To generate monthly invoices for agents and service providers</li>
              <li>To detect fraud, prevent duplicate registrations and enforce our terms</li>
              <li>To improve the platform and develop new features</li>
              <li>To comply with South African law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. AI and Data Processing</h2>
            <p className="mb-2">Our platform uses artificial intelligence in the following ways:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400 mb-3">
              <li>AI Concierge conversations are processed to understand property preferences and build a search profile</li>
              <li>Buyer profiles are built passively from search and viewing behaviour to improve recommendations</li>
              <li>Agent dashboards show anonymised lead profiles — buyers are identified as "Buyer 1", "Buyer 2" etc with a match percentage only</li>
              <li>AI analyses listing performance and generates insights for agents</li>
              <li>AI generates business profile write-ups for service providers based on their website content</li>
            </ul>
            <p>AI-generated content is for informational purposes only. We use Anthropic's Claude AI model to power our conversational features. Data shared with AI systems is subject to Anthropic's data processing terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Address Privacy & Supplier Data Sharing</h2>
            <p className="mb-2">We take address privacy seriously. The following rules apply to how client location data is shared with service providers:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>When a buyer requests a quote from a supplier, the supplier receives the suburb and general area only — not the full street address</li>
              <li>The full street address is only shared with a supplier after the buyer explicitly accepts that supplier's quote</li>
              <li>The full address is shared in the introduction email sent to both parties simultaneously at the point of acceptance</li>
              <li>Suppliers are contractually prohibited from using client addresses for any purpose other than fulfilling the agreed service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Sharing With Third Parties</h2>
            <p className="mb-2">We share personal information only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>With estate agents: when a buyer books a viewing, the agent receives the buyer's name only. No contact details are shared through the platform — all communication is handled by PropertyAIgency as intermediary</li>
              <li>With service providers: suburb/area only until a quote is accepted, then full address in the introduction email</li>
              <li>With technology service providers who help us operate the platform (Supabase for database hosting, Vercel for platform hosting, Anthropic for AI processing) — these providers process data only on our instruction</li>
              <li>When required by South African law, court order or regulatory authority</li>
              <li>With your explicit written consent</li>
            </ul>
            <p className="mt-3">We do not sell, rent or trade your personal information to any third party for marketing purposes. Ever.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Email Communications</h2>
            <p>We do not send marketing emails, newsletters or routine notification emails. The only email we send is a single introduction email at the moment a service quote is accepted. This email is sent to both the client and the service provider simultaneously and contains the information needed for them to proceed directly with each other. All other platform communications — notifications, messages, alerts, updates — are delivered within the platform itself.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure cloud database storage with row-level security, access controls limiting data access to authorised systems only, and regular security reviews. However, no system is completely secure and we cannot guarantee absolute security. If we become aware of a data breach that affects your personal information, we will notify you and the Information Regulator as required by POPIA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Your Rights Under POPIA</h2>
            <p className="mb-2">As a data subject under POPIA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Be notified when we collect your personal information</li>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate or incomplete information</li>
              <li>Request deletion of your personal information (subject to legal retention requirements)</li>
              <li>Object to the processing of your personal information</li>
              <li>Lodge a complaint with the Information Regulator of South Africa at inforeg.org.za</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Cookies and Tracking</h2>
            <p>We use essential session cookies to keep you logged in and maintain your preferences. We do not use advertising cookies, tracking pixels or third-party analytics that share your data. We do not sell your browsing data to advertisers. You can control cookies through your browser settings, but disabling essential cookies may affect platform functionality.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Push Notifications</h2>
            <p>If you enable push notifications, we will send you alerts about viewing bookings, new property matches, quote updates and other platform activity relevant to your account. Push notifications are delivered directly to your device and do not involve email. You can disable push notifications at any time through your device settings or account preferences.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Data Retention</h2>
            <p className="mb-2">We retain your personal information for the following periods:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Active account data: retained for as long as your account is active</li>
              <li>Financial records (invoices, payment history): 5 years as required by South African tax law</li>
              <li>AI conversation data: retained for 12 months then anonymised</li>
              <li>Deleted account data: removed within 30 days of account deletion, except where legal retention applies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Children</h2>
            <p>The Platform is not intended for use by persons under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a minor, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">14. Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. Material changes will be notified to you via the platform. The updated policy will show the new effective date at the top of this page. Continued use of the Platform after changes are posted constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">15. Contact & Complaints</h2>
            <p>For privacy queries, to exercise your POPIA rights, or to raise a complaint about how we handle your data, contact us via our <Link href="/contact" className="text-orange-500 hover:underline">contact page</Link> or email admin@propertyaigency.co.za. If you are not satisfied with our response, you may escalate your complaint to the Information Regulator of South Africa at inforeg.org.za.</p>
          </section>

        </div>
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/supplier/terms" className="hover:text-white">Supplier Terms</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
