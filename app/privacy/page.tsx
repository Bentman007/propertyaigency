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
        <p className="text-gray-400 text-sm mb-8">Last updated: April 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>PropertyAIgency ("we", "us", "our") is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa. This policy explains how we collect, use, and protect your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Account information: name, email address, phone number</li>
              <li>Property listing information provided by agents</li>
              <li>Search preferences and property interactions</li>
              <li>Viewing booking details</li>
              <li>Device information and browser type</li>
              <li>Usage data and platform interactions</li>
              <li>Location data (only with your explicit permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>To provide and improve the Platform</li>
              <li>To match property searchers with relevant listings</li>
              <li>To facilitate viewing bookings</li>
              <li>To send platform notifications (bookings, updates)</li>
              <li>To build AI-assisted buyer profiles for better matches</li>
              <li>To analyse platform usage and improve features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. AI and Data Processing</h2>
            <p>Our AI systems process your search queries and interactions to build a property preference profile. This profile is used solely to improve property recommendations and is not shared with third parties without your consent. Agents can see anonymised lead profiles when a viewing is booked.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Data Sharing</h2>
            <p className="mb-2">We share your data only in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>With property agents when you book a viewing (your name and contact details)</li>
              <li>With service providers who help us operate the Platform (Supabase, Vercel)</li>
              <li>When required by South African law</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), secure database storage, and access controls. However, no system is completely secure and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights (POPIA)</h2>
            <p className="mb-2">Under POPIA, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Lodge a complaint with the Information Regulator</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Cookies and Tracking</h2>
            <p>We use essential cookies to maintain your session and preferences. We do not use advertising cookies or sell your data to advertisers. You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Push Notifications</h2>
            <p>If you enable push notifications, we will send you alerts about viewing bookings, property updates, and platform activity. You can disable notifications at any time through your account settings or device settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Data Retention</h2>
            <p>We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where required to retain it by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact Us</h2>
            <p>For privacy-related queries or to exercise your POPIA rights, contact us at <Link href="/contact" className="text-orange-500 hover:underline">our contact page</Link>.</p>
          </section>
        </div>
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
