import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f5f0eb] text-stone-900">
      <nav className="bg-[#4a4238] px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white">
          Property<span className="text-orange-400">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/contact" className="text-stone-300 hover:text-white text-sm">Contact</Link>
          <Link href="/auth/login" className="text-stone-300 hover:text-white text-sm">Sign In</Link>
          <Link href="/auth/register" className="bg-orange-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-400">
            Get Started Free
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4">
            🎉 FREE for 2 months — No credit card required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto">
            AI-powered property listings at a fraction of the cost. 
            No hidden fees, no lock-in contracts, no surprises. Use your credits at your own pace.
          </p>
        </div>

        {/* Private Sellers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Private Sellers & Landlords</h2>
          <p className="text-stone-500 text-center mb-8">Selling or renting your own property? No agent needed.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="bg-white border border-stone-300 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Standard Listing</h3>
              <p className="text-stone-500 text-sm mb-4">Perfect for a single property</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-orange-500">R199</span>
                <span className="text-stone-500 text-sm ml-2">per listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-stone-700">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Listed for 2 months</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 10 photos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI advert writer</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI valuation tool</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI Concierge handles all enquiries</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Viewing booking system</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">↻</span> Relist for R199</li>
              </ul>
              <Link href="/auth/register" className="block w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-3 rounded-xl text-center transition">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-white border border-orange-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-1">Premium Listing</h3>
              <p className="text-stone-500 text-sm mb-4">Maximum exposure for your property</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-orange-500">R299</span>
                <span className="text-stone-500 text-sm ml-2">per listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-stone-700">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Listed for 2 months</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 20 photos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Video walkthrough support</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Virtual tour support</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI advert writer + valuation</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI Concierge handles all enquiries</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Featured on homepage — <span className="text-orange-500 font-bold">R99/month</span></li>
                <li className="flex items-center gap-2"><span className="text-orange-400">↻</span> Relist for R149</li>
              </ul>
              <Link href="/auth/register" className="block w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 rounded-xl text-center transition">
                Get Started
              </Link>
            </div>
          </div>
        </div>

        {/* Estate Agents */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Estate Agents & Agencies</h2>
          <p className="text-stone-500 text-center mb-2">Buy a listing bundle — use them at your own pace. <span className="text-orange-500 font-semibold">First 2 months FREE.</span></p>
          <p className="text-stone-400 text-center text-sm mb-2">Each listing stays live for 2 months. Use one credit to relist. No monthly lock-in.</p>
          <p className="text-stone-400 text-center text-sm mb-8">All bundles include AI lead qualification, viewing bookings, Property AIsistant and full analytics</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { name: 'Starter', listings: 10, price: 'R850', perListing: 'R85', color: 'border-stone-300', popular: false },
              { name: 'Growth', listings: 30, price: 'R2,100', perListing: 'R70', color: 'border-stone-300', popular: false },
              { name: 'Pro', listings: 50, price: 'R2,750', perListing: 'R55', color: 'border-orange-500', popular: true },
              { name: 'Agency', listings: 100, price: 'R4,500', perListing: 'R45', color: 'border-stone-300', popular: false },
            ].map(plan => (
              <div key={plan.name} className={`bg-white border ${plan.color} rounded-2xl p-6 relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-stone-500 text-xs mb-1">{plan.listings} listing credits</p>
                <p className="text-green-400 text-xs mb-3">Only {plan.perListing} per listing</p>
                <div className="mb-1">
                  <span className="text-3xl font-bold text-orange-500">{plan.price}</span>
                </div>
                <p className="text-stone-400 text-xs mb-4">per bundle — use anytime</p>
                <ul className="space-y-1 mb-4 text-xs text-stone-700">
                  <li className="flex items-center gap-1"><span className="text-green-400">✓</span> Each listing live for 2 months</li>
                  <li className="flex items-center gap-1"><span className="text-green-400">✓</span> Use 1 credit to relist</li>
                  <li className="flex items-center gap-1"><span className="text-green-400">✓</span> Credits never expire</li>
                  <li className="flex items-center gap-1"><span className="text-green-400">✓</span> AI AIsistant included</li>
                  <li className="flex items-center gap-1"><span className="text-green-400">✓</span> No monthly lock-in</li>
                </ul>
                <Link href="/auth/register" className={`block w-full font-bold py-2.5 rounded-xl text-center text-sm transition ${
                  plan.popular ? 'bg-orange-500 hover:bg-orange-400 text-black' : 'bg-stone-100 hover:bg-stone-200 text-stone-900'
                }`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          {/* Why PropertyAIgency callout */}
          <div className="bg-white border border-green-700 rounded-2xl p-6 max-w-3xl mx-auto mb-6">
            <h3 className="text-lg font-bold text-center mb-4">💡 Why agents choose PropertyAIgency</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">No lock-in contracts</p>
                  <p className="text-stone-500 text-xs">Buy credits when you need them. No monthly obligation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">AI does the heavy lifting</p>
                  <p className="text-stone-500 text-xs">Lead qualification, viewing bookings and buyer profiling — all automated.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">Transparent pricing</p>
                  <p className="text-stone-500 text-xs">R45–R85 per listing. No hidden fees, no surprise invoices.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">2 months free to get started</p>
                  <p className="text-stone-500 text-xs">Try everything for free. No credit card required.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">Your own AI business partner</p>
                  <p className="text-stone-500 text-xs">The AIsistant monitors your pipeline and alerts you to opportunities 24/7.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-400 text-lg">✅</span>
                <div>
                  <p className="font-bold text-stone-900">Built for South African agents</p>
                  <p className="text-stone-500 text-xs">EAAB verified, POPIA compliant, priced in Rands.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Listings */}
          <div className="bg-white border border-yellow-500 rounded-2xl p-6 max-w-2xl mx-auto mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-lg font-bold flex items-center gap-2">⭐ Featured Listing <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">ADD-ON</span></p>
                <p className="text-stone-500 text-sm">Appear above all regular listings on the homepage</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-yellow-400">R99</p>
                <p className="text-stone-500 text-xs">/month per listing</p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-2 text-sm text-stone-700">
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Gold border — stands out instantly</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Above all regular listings</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> ⭐ Featured badge on listing</li>
              <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Cancel anytime</li>
            </ul>
          </div>

        {/* Enterprise */}
          <div className="bg-white border border-stone-300 rounded-2xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-bold mb-1">Enterprise / National Agencies</h3>
            <p className="text-stone-500 text-sm mb-3">100+ listings? Multiple branches? Let's talk custom pricing.</p>
            <Link href="/contact" className="inline-block bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2.5 px-8 rounded-xl text-sm transition">
              Contact Us
            </Link>
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Everything Included in Every Agent Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🤖',
                title: 'AI Lead Qualification',
                desc: 'Every buyer is profiled before they reach you — budget, timeline, family needs, all captured automatically'
              },
              {
                icon: '📅',
                title: 'Instant Viewing Bookings',
                desc: 'Buyers book directly into your diary. No back and forth. You just confirm or decline in one click.'
              },
              {
                icon: '🔥',
                title: 'Property AIsistant',
                desc: 'Your personal AI inbox — lead briefs, booking updates, hot lead alerts, all referencing the exact property'
              },
              {
                icon: '📊',
                title: 'Full Analytics',
                desc: 'Views, unique visitors, time on listing, return visitors and heat scores for every listing'
              },
              {
                icon: '🏠',
                title: 'AI Advert Writer',
                desc: 'Generate compelling property descriptions in seconds using AI trained on South African property'
              },
              {
                icon: '💰',
                title: 'AI Valuation Tool',
                desc: 'Get an instant AI-powered valuation estimate to help price properties competitively'
              },
            ].map(f => (
              <div key={f.title} className="bg-white border border-stone-300 rounded-xl p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-stone-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-orange-900 to-gray-800 border border-orange-700 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-3">Start Your Free 2-Month Trial</h2>
          <p className="text-stone-700 mb-6 max-w-xl mx-auto">No credit card required. Set up your listings in minutes and let the AI handle the rest.</p>
          <Link href="/auth/register" className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-12 rounded-xl text-lg transition">
            Get Started Free →
          </Link>
          <p className="text-stone-400 text-sm mt-4">Cancel anytime. No hidden fees. No surprises.</p>
        </div>
      </div>

      <footer className="border-t border-stone-200 px-6 py-8 text-center text-stone-400 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/how-it-works" className="hover:text-stone-900">How It Works</Link>
          <Link href="/terms" className="hover:text-stone-900">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-stone-900">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-stone-900">Contact</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
