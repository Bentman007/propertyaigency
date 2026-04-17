import Link from 'next/link'

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Property<span className="text-orange-500">AI</span>gency
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link>
          <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm">Sign In</Link>
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
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            40% cheaper than Property24 — with AI that does the work for you. 
            No hidden fees, no per-lead charges, no surprises.
          </p>
        </div>

        {/* Private Sellers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-2">Private Sellers & Landlords</h2>
          <p className="text-gray-400 text-center mb-8">Selling or renting your own property? No agent needed.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Standard */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-1">Standard Listing</h3>
              <p className="text-gray-400 text-sm mb-4">Perfect for a single property</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-orange-500">R199</span>
                <span className="text-gray-400 text-sm ml-2">per listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Listed for 2 months</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 10 photos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI advert writer</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI valuation tool</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI Concierge handles all enquiries</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Viewing booking system</li>
                <li className="flex items-center gap-2"><span className="text-orange-400">↻</span> Relist for R99</li>
              </ul>
              <Link href="/auth/register" className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl text-center transition">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-gray-800 border border-orange-500 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-1">Premium Listing</h3>
              <p className="text-gray-400 text-sm mb-4">Maximum exposure for your property</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-orange-500">R299</span>
                <span className="text-gray-400 text-sm ml-2">per listing</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Listed for 2 months</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Up to 20 photos</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Video walkthrough support</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Virtual tour support</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI advert writer + valuation</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> AI Concierge handles all enquiries</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Featured on homepage</li>
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
          <p className="text-gray-400 text-center mb-2">Monthly subscription — cancel anytime. <span className="text-orange-500 font-semibold">First 2 months FREE.</span></p>
          <p className="text-gray-500 text-center text-sm mb-8">All plans include AI lead qualification, viewing bookings, Property AIsistant and full analytics</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { name: 'Starter', listings: '1–10', price: 'R800', color: 'border-gray-700' },
              { name: 'Growth', listings: '11–30', price: 'R1,500', color: 'border-gray-700', popular: false },
              { name: 'Pro', listings: '31–50', price: 'R2,500', color: 'border-orange-500', popular: true },
              { name: 'Agency', listings: '51–100', price: 'R4,000', color: 'border-gray-700' },
            ].map(plan => (
              <div key={plan.name} className={`bg-gray-800 border ${plan.color} rounded-2xl p-6 relative`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-gray-400 text-xs mb-3">Up to {plan.listings} listings/month</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-orange-500">{plan.price}</span>
                  <span className="text-gray-400 text-xs ml-1">/month</span>
                </div>
                <Link href="/auth/register" className={`block w-full font-bold py-2.5 rounded-xl text-center text-sm transition ${
                  plan.popular ? 'bg-orange-500 hover:bg-orange-400 text-black' : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl mx-auto text-center">
            <h3 className="text-lg font-bold mb-1">Enterprise / National Agencies</h3>
            <p className="text-gray-400 text-sm mb-3">100+ listings? Multiple branches? Let's talk custom pricing.</p>
            <Link href="/contact" className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-bold py-2.5 px-8 rounded-xl text-sm transition">
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
              <div key={f.title} className="bg-gray-800 border border-gray-700 rounded-xl p-5">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* vs Property24 */}
        <div className="mb-16 bg-gray-800 border border-gray-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8">How We Compare to Property24</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 text-gray-400">Feature</th>
                  <th className="text-center py-3 text-orange-500 font-bold">PropertyAIgency</th>
                  <th className="text-center py-3 text-gray-500">Property24</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {[
                  ['Monthly cost (10 listings)', 'R800', 'R1,400+'],
                  ['AI lead qualification', '✅ Included', '❌ Not available'],
                  ['Instant viewing bookings', '✅ Automated', '❌ Manual'],
                  ['Lead briefs for agents', '✅ AI-generated', '❌ Not available'],
                  ['Transparent pricing', '✅ Flat rate', '❌ Per lead (unverified)'],
                  ['Long-term contracts', '❌ Month to month', '⚠️ Multi-year'],
                  ['Free trial', '✅ 2 months free', '❌ None'],
                  ['South African focused', '✅ Built for SA', '✅ Yes'],
                ].map(([feature, us, them]) => (
                  <tr key={feature}>
                    <td className="py-3 text-gray-300">{feature}</td>
                    <td className="py-3 text-center font-semibold text-green-400">{us}</td>
                    <td className="py-3 text-center text-gray-500">{them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-orange-900 to-gray-800 border border-orange-700 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-3">Start Your Free 2-Month Trial</h2>
          <p className="text-gray-300 mb-6 max-w-xl mx-auto">No credit card required. Set up your listings in minutes and let the AI handle the rest.</p>
          <Link href="/auth/register" className="inline-block bg-orange-500 hover:bg-orange-400 text-black font-bold py-4 px-12 rounded-xl text-lg transition">
            Get Started Free →
          </Link>
          <p className="text-gray-500 text-sm mt-4">Cancel anytime. No hidden fees. No surprises.</p>
        </div>
      </div>

      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
        <p className="mt-3">© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
