import Link from 'next/link'

export default function ForAgentsPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-4 md:px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-xl md:text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/pricing" className="text-gray-400 hover:text-white text-sm hidden md:block">Pricing</Link>
          <Link href="/auth/register" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400">
            Start Free Trial
          </Link>
        </div>
      </nav>

      <section className="px-4 md:px-6 py-16 md:py-24 text-center max-w-5xl mx-auto">
        <div className="inline-block bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-6">
          🎉 FREE for 2 months — No credit card required
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          Stop Chasing Leads.<br/>
          <span className="text-orange-500">Let AI Deliver Them.</span>
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
          PropertyAIgency qualifies your buyers, books your viewings and briefs you before every meeting — automatically. You just show up and close.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/register" className="bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-10 rounded-xl text-lg transition">
            Start Free 2-Month Trial →
          </Link>
          <Link href="/how-it-works" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-10 rounded-xl text-lg transition">
            See How It Works
          </Link>
        </div>
        <p className="text-gray-500 text-sm mt-4">No credit card · No contract · Cancel anytime</p>
      </section>

      <section className="bg-gray-800 border-t border-b border-gray-700 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Sound familiar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '😤', text: 'Spending hours answering the same questions from unqualified buyers' },
              { icon: '📞', text: 'Playing phone tag to schedule viewings that never happen' },
              { icon: '💸', text: 'Paying huge portal fees with no guarantee of quality leads' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-700 rounded-xl p-6">
                <p className="text-4xl mb-3">{item.icon}</p>
                <p className="text-gray-300">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-orange-500 font-bold text-xl mt-8">There is a better way.</p>
        </div>
      </section>

      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything done for you</h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">Our AI handles the entire buyer journey so you can focus on closing deals</p>

        <div className="space-y-6">
          <div className="bg-gray-800 border border-orange-500 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📦</div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold">Import All Your Listings in Minutes</h3>
                <span className="bg-orange-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">KEY FEATURE</span>
              </div>
              <p className="text-gray-400 mb-4">Have existing listings? Export them to a simple spreadsheet and upload them all at once. Our AI automatically writes professional descriptions for every property. You just review and go live in minutes.</p>
              <div className="flex flex-wrap gap-2">
                {['Export from any portal', 'Upload spreadsheet', 'AI writes descriptions', 'Review and publish'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-lg text-sm">
                    <span className="text-orange-500 font-bold">{i + 1}</span>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🤖</div>
            <div>
              <h3 className="text-xl font-bold mb-2">AI Qualifies Every Buyer Automatically</h3>
              <p className="text-gray-400 mb-3">Our AI Concierge chats with every buyer and builds their complete profile before they reach you — budget, timeline, must-haves, family situation. You only deal with serious, pre-qualified leads.</p>
              <div className="bg-gray-700 rounded-xl p-4 text-sm">
                <p className="text-orange-500 font-semibold mb-2">Example lead brief you receive:</p>
                <p className="text-gray-300 italic">"Sarah is a warm lead looking to rent before May. Budget R45,000/mo, needs 3+ beds for herself and daughter. Must have garden and security. Viewed your listing 3 times this week."</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">📅</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Viewings Booked Directly Into Your Diary</h3>
              <p className="text-gray-400 mb-3">Set your availability once. Buyers pick a slot and book instantly. You get a notification, confirm in one tap, and both parties get automatic reminders. Zero phone calls needed.</p>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                {[
                  { icon: '⚙️', label: 'Set availability once' },
                  { icon: '📲', label: 'Buyer books instantly' },
                  { icon: '✅', label: 'Confirm in one tap' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-3">
                    <p className="text-2xl mb-1">{item.icon}</p>
                    <p className="text-gray-300">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🏆</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Your Personal Property AIsistant</h3>
              <p className="text-gray-400 mb-3">Every agent gets a smart AI inbox that briefs you on every lead, flags hot prospects, alerts you when listings underperform and suggests improvements.</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['🔥 Hot lead alerts', '📊 Performance insights', '📅 Booking confirmations', '💡 AI improvement tips'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300 bg-gray-700 px-3 py-2 rounded-lg">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 border-t border-b border-gray-700 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { name: 'Starter', listings: '1-10', price: 'R800' },
              { name: 'Growth', listings: '11-30', price: 'R1,500' },
              { name: 'Pro', listings: '31-50', price: 'R2,500', popular: true },
              { name: 'Agency', listings: '51-100', price: 'R4,000' },
            ].map(plan => (
              <div key={plan.name} className={`bg-gray-700 rounded-xl p-5 text-center border ${plan.popular ? 'border-orange-500' : 'border-gray-600'}`}>
                {plan.popular && <p className="text-orange-500 text-xs font-bold mb-2">BEST VALUE</p>}
                <p className="font-bold">{plan.name}</p>
                <p className="text-gray-400 text-xs mb-2">Up to {plan.listings} listings</p>
                <p className="text-2xl font-bold text-orange-500">{plan.price}</p>
                <p className="text-gray-500 text-xs">/month</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-700 rounded-xl p-6 text-center">
            <p className="font-bold text-lg mb-1">🎉 Start with 2 months completely free</p>
            <p className="text-gray-400 text-sm">No credit card required · Cancel anytime · Full access to all features</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-10">Get started in 3 steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', icon: '📝', title: 'Register free', desc: 'Create your agent account in 2 minutes. No credit card needed.' },
            { step: '2', icon: '📦', title: 'Upload your listings', desc: 'Add listings one by one or bulk upload. AI writes descriptions automatically.' },
            { step: '3', icon: '🚀', title: 'Start getting leads', desc: 'Set your availability and let the AI handle everything. Hot leads delivered to your inbox.' },
          ].map(item => (
            <div key={item.step} className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">{item.icon}</div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-orange-900 to-gray-800 border-t border-orange-700 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to let AI work for you?</h2>
        <p className="text-gray-300 mb-8 max-w-xl mx-auto">Join PropertyAIgency free for 2 months and experience the future of property listings</p>
        <Link href="/auth/register" className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-12 rounded-xl text-lg transition">
          Start Free Trial — No Card Needed →
        </Link>
        <p className="text-gray-500 text-sm mt-4">Questions? <Link href="/contact" className="text-orange-500 hover:underline">Chat with us</Link></p>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/how-it-works" className="hover:text-white">How It Works</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
