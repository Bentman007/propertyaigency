import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link>
          <Link href="/auth/register" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          How <span className="text-orange-500">PropertyAI</span>gency Works
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          South Africa's smartest property platform — AI handles everything, you just show up for the viewing
        </p>
      </section>

      {/* Tab selector */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* For Buyers */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">🔍</div>
              <h2 className="text-2xl font-bold">For Buyers & Renters</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Chat with AI Concierge',
                  desc: 'Just tell our AI what you\'re looking for in plain English — area, budget, bedrooms, must-haves. No forms, no filters.',
                  icon: '💬'
                },
                {
                  step: '02',
                  title: 'Get Matched Instantly',
                  desc: 'AI finds properties that match your needs and shows them immediately. Save the ones you like, reject the ones you don\'t.',
                  icon: '🏠'
                },
                {
                  step: '03',
                  title: 'Book a Viewing',
                  desc: 'Pick a time slot directly from the agent\'s diary. No phone calls, no back and forth. Booking confirmed instantly.',
                  icon: '📅'
                },
                {
                  step: '04',
                  title: 'Make an Offer',
                  desc: 'Found the one? Submit your offer directly through the platform. Agent gets notified immediately with your full buyer profile.',
                  icon: '💰'
                },
                {
                  step: '05',
                  title: 'Get Notified of New Matches',
                  desc: 'Nothing suitable today? We\'ll notify you the moment a property matching your profile gets listed.',
                  icon: '🔔'
                },
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-xs font-bold">STEP {item.step}</span>
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/auth/register" className="inline-block mt-8 bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition">
              Start Searching Free →
            </Link>
          </div>

          {/* For Agents */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-black font-bold">🏡</div>
              <h2 className="text-2xl font-bold">For Estate Agents</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'List Your Properties',
                  desc: 'Add listings in minutes with our AI-powered listing tool. AI writes your advert, estimates the price, and optimises your listing automatically.',
                  icon: '📝'
                },
                {
                  step: '02',
                  title: 'AI Qualifies Every Lead',
                  desc: 'Our AI Concierge chats with every buyer, building their full profile — budget, timeline, must-haves — before they even contact you.',
                  icon: '🤖'
                },
                {
                  step: '03',
                  title: 'Get Pre-Booked Viewings',
                  desc: 'Buyers book directly into your diary. You just confirm or decline in one tap. No phone tag, no back and forth.',
                  icon: '📅'
                },
                {
                  step: '04',
                  title: 'Receive Lead Briefs',
                  desc: 'Before every viewing, your Property AIsistant sends you a full buyer brief — budget, timeline, family situation, heat score.',
                  icon: '🔥'
                },
                {
                  step: '05',
                  title: 'Track Performance',
                  desc: 'See views, unique visitors, time on listing and enquiries for every property. AI suggests improvements when listings underperform.',
                  icon: '📊'
                },
              ].map(item => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-xs font-bold">STEP {item.step}</span>
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/auth/register" className="inline-block mt-8 bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition">
              Start Free 2-Month Trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Video section */}
      <section className="bg-gray-800 border-t border-b border-gray-700 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
          <p className="text-gray-400 mb-8">Watch how PropertyAIgency transforms the property search experience</p>
          <div className="bg-gray-700 rounded-2xl aspect-video flex items-center justify-center border border-gray-600">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black text-2xl">▶</span>
              </div>
              <p className="text-gray-400 text-sm">Video coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Is PropertyAIgency free to use for buyers?',
              a: 'Yes — completely free for buyers and renters. Search, save properties, book viewings and make offers at no cost.'
            },
            {
              q: 'How much does it cost for agents?',
              a: 'We offer a free 2-month trial with no credit card required. After that, plans start from R800/month for up to 10 listings. See our pricing page for full details.'
            },
            {
              q: 'How is this different from other property portals?',
              a: 'Traditional portals just list properties. PropertyAIgency uses AI to qualify buyers, book viewings automatically, and brief agents before every meeting — so agents only deal with serious, pre-qualified leads.'
            },
            {
              q: 'Can I list my own property without an agent?',
              a: 'Yes — private sellers can list from R199 for 2 months. Our AI writes your advert and handles all buyer enquiries automatically.'
            },
            {
              q: 'How does the viewing booking work?',
              a: 'Agents set their availability once. Buyers pick a time slot from the agent\'s diary and book instantly. No phone calls needed — the AI handles everything in between.'
            },
            {
              q: 'What happens when my property is sold?',
              a: 'Simply mark it as sold in your dashboard. The listing is removed from search, and all buyers who saved it get notified automatically.'
            },
          ].map((faq, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold mb-2">❓ {faq.q}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-orange-900 to-gray-800 border-t border-orange-700 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to experience the future of property?</h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">Join PropertyAIgency today — free for buyers, free trial for agents</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register" className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-10 rounded-xl text-lg transition">
            Get Started Free →
          </Link>
          <Link href="/pricing" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition">
            View Pricing
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
