import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-100 to-stone-50 text-stone-900">
      <nav className="bg-stone-100 border-b border-stone-200 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/pricing" className="text-stone-500 hover:text-stone-900 text-sm">Pricing</Link>
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
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
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
                    <div className="w-12 h-12 bg-white border border-stone-300 rounded-xl flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-xs font-bold">STEP {item.step}</span>
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
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
                    <div className="w-12 h-12 bg-white border border-stone-300 rounded-xl flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-xs font-bold">STEP {item.step}</span>
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/auth/register" className="inline-block mt-8 bg-orange-500 hover:bg-orange-400 text-black font-bold px-8 py-3 rounded-xl transition">
              Start Free 2-Month Trial →
            </Link>
          </div>

          {/* For Suppliers */}
          <div className="md:col-span-2">
            <div className="border-t border-stone-300 pt-12 mt-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-stone-900 font-bold">🏢</div>
                <h2 className="text-2xl font-bold">For Service Providers</h2>
              </div>
              <p className="text-stone-500 mb-8 max-w-2xl">Bond originators, conveyancing attorneys, removal companies, solar installers, photographers and more — get leads from buyers and sellers at exactly the right moment in their property journey.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { step: '01', icon: '📋', title: 'Register Your Business', desc: 'Select your services, upload your logo, add your areas covered. Our AI scrapes your website and writes your profile automatically.' },
                  { step: '02', icon: '✅', title: 'We Verify You', desc: 'Our team reviews your application within 24 hours. Once approved, your profile goes live and your 2-month free trial begins.' },
                  { step: '03', icon: '🔔', title: 'Get Notified of Leads', desc: 'When a buyer in your area needs your service, your AI dashboard notifies you instantly with their requirements and approximate location.' },
                  { step: '04', icon: '💬', title: 'Chat With the Client', desc: 'Message the buyer through our platform — no contact details shared until they accept your quote. Ask questions, clarify requirements.' },
                  { step: '05', icon: '📄', title: 'Send Your Quote', desc: 'Submit a quote amount with notes, or attach your own PDF quote. Buyer sees your profile, reviews and ratings alongside your quote.' },
                  { step: '06', icon: '🤝', title: 'Get Introduced', desc: 'Buyer accepts your quote — we introduce you both by email with all the details. You take it from there and arrange payment directly.' },
                ].map(item => (
                  <div key={item.step} className="bg-white border border-stone-300 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-xl">{item.icon}</div>
                      <span className="text-green-400 text-xs font-bold">STEP {item.step}</span>
                    </div>
                    <h3 className="font-bold mb-2">{item.title}</h3>
                    <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-green-950 border border-green-700 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-green-300 mb-4">When do you get leads?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: '🏦', text: 'Bond Originators — when a buyer books their first viewing' },
                    { icon: '🔍', text: 'Home Inspectors — 48 hours after a confirmed viewing' },
                    { icon: '📊', text: 'Property Valuers — 48 hours after a confirmed viewing' },
                    { icon: '⚖️', text: 'Conveyancing Attorneys — when a buyer submits an offer' },
                    { icon: '🛡️', text: 'Insurance Brokers — when a buyer submits an offer' },
                    { icon: '🚛', text: 'Removal Companies & all trade services — when an offer is accepted' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
                      <span className="text-lg flex-shrink-0">{item.icon}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-stone-300 rounded-2xl p-6 mb-8">
                <h3 className="font-bold mb-2">What does a lead actually cost you today?</h3>
                <p className="text-stone-500 text-sm mb-5">Compare what you currently spend to acquire a new client vs what PropertyAIgency charges for a pre-qualified, ready-to-act lead.</p>
                <div className="space-y-3">
                  {[
                    { service: 'Bond Originator', old: 'R1,500–R5,000', new: 'R250', saving: 'Up to 94% less' },
                    { service: 'Conveyancing Attorney', old: 'R2,000–R8,000', new: 'R250', saving: 'Up to 97% less' },
                    { service: 'Solar Installer', old: 'R800–R3,000', new: 'R200', saving: 'Up to 93% less' },
                    { service: 'Removal Company', old: 'R400–R1,500', new: 'R150', saving: 'Up to 90% less' },
                    { service: 'Painter / Handyman', old: 'R300–R1,200', new: 'R100', saving: 'Up to 92% less' },
                  ].map(row => (
                    <div key={row.service} className="grid grid-cols-4 gap-3 items-center text-sm">
                      <p className="font-semibold text-stone-900">{row.service}</p>
                      <div className="text-center">
                        <p className="text-red-400 font-bold">{row.old}</p>
                        <p className="text-stone-400 text-xs">typical cost today</p>
                      </div>
                      <div className="text-center">
                        <p className="text-green-400 font-bold">{row.new}</p>
                        <p className="text-stone-400 text-xs">per lead with us</p>
                      </div>
                      <div className="text-center bg-green-950 border border-green-800 rounded-lg px-2 py-1">
                        <p className="text-green-400 text-xs font-bold">{row.saving}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-stone-400 text-xs mt-5">Leads are pre-qualified buyers at exactly the right moment in their journey. No cold calls, no advertising spend, no wasted time.</p>
              </div>

              <Link href="/supplier/register" className="inline-block bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-xl transition">
                Start My Free Trial →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* Video section */}
      <section className="bg-white border-t border-b border-stone-300 px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
          <p className="text-stone-500 mb-8">Watch how PropertyAIgency transforms the property search experience</p>
          <div className="bg-stone-100 rounded-2xl aspect-video flex items-center justify-center border border-stone-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black text-2xl">▶</span>
              </div>
              <p className="text-stone-500 text-sm">Video coming soon</p>
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
            {
              q: 'How much does it cost to be a service provider?',
              a: 'You get a 2-month free trial with no credit card required. After that, it is R2000 per year plus a per-lead fee ranging from R100 to R250 depending on your service category. You only pay for leads you actually receive.'
            },
            {
              q: 'Can I offer multiple services?',
              a: 'Yes — you can register for as many service categories as you offer. A garden service that also does pool maintenance can select both, and will receive leads for either.'
            },
            {
              q: 'What if I get a lead I cannot fulfil?',
              a: 'You can set a weekly lead limit and pause your listing at any time. You are never charged for leads when paused.'
            },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-stone-300 rounded-xl p-5">
              <h3 className="font-bold mb-2">❓ {faq.q}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-orange-900 to-gray-800 border-t border-orange-700 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to experience the future of property?</h2>
        <p className="text-stone-700 mb-8 max-w-xl mx-auto">Join PropertyAIgency today — free for buyers, free trial for agents and service providers</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register" className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-10 rounded-xl text-lg transition">
            Get Started Free →
          </Link>
          <Link href="/pricing" className="bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-4 px-10 rounded-xl text-lg transition">
            View Pricing
          </Link>
          <Link href="/supplier/register" className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-10 rounded-xl text-lg transition">
            Join as a Supplier →
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-6 py-8 text-center text-stone-400 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-stone-900">How It Works</Link>
          <Link href="/terms" className="hover:text-stone-900">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-stone-900">Privacy Policy</Link>
          <Link href="/supplier/terms" className="hover:text-stone-900">Supplier Terms</Link>
          <Link href="/contact" className="hover:text-stone-900">Contact</Link>
          <Link href="/pricing" className="hover:text-stone-900">Pricing</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
