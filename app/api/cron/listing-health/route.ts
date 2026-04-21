import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const nudged: string[] = []

  try {
    // Get all active private seller listings
    const { data: listings } = await supabase
      .from('properties')
      .select('*, profiles(account_type, full_name)')
      .eq('status', 'active')
      .eq('profiles.account_type', 'buyer') // private sellers have buyer account type

    if (!listings) return NextResponse.json({ message: 'No listings found' })

    for (const listing of listings) {
      const listedDaysAgo = Math.floor(
        (now.getTime() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )
      const daysUntilExpiry = 60 - listedDaysAgo

      // Get view count
      const { count: viewCount } = await supabase
        .from('property_views')
        .select('id', { count: 'exact' })
        .eq('property_id', listing.id)

      // Get save count
      const { count: saveCount } = await supabase
        .from('saved_properties')
        .select('id', { count: 'exact' })
        .eq('property_id', listing.id)

      // Get booking count
      const { count: bookingCount } = await supabase
        .from('viewing_bookings')
        .select('id', { count: 'exact' })
        .eq('property_id', listing.id)

      // Get similar listings for price comparison
      const { data: similarListings } = await supabase
        .from('properties')
        .select('price')
        .eq('suburb', listing.suburb)
        .eq('price_type', listing.price_type)
        .eq('status', 'active')
        .neq('id', listing.id)
        .limit(5)

      const avgPrice = similarListings?.length
        ? similarListings.reduce((sum, l) => sum + l.price, 0) / similarListings.length
        : null

      const priceHigherThanAvg = avgPrice && listing.price > avgPrice * 1.1

      let insightTitle = ''
      let insightContent = ''

      // Check already nudged today
      const { data: recentNudge } = await supabase
        .from('aisistant_messages')
        .select('id')
        .eq('property_id', listing.id)
        .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (recentNudge && recentNudge.length > 0) continue // Already nudged in last 7 days

      // NUDGE 1: Low views after 7 days
      if (listedDaysAgo === 7 && (viewCount || 0) < 10) {
        insightTitle = `📸 Boost Your Listing — ${listing.title}`
        insightContent = `Your listing **${listing.title}** has been live for 7 days with ${viewCount || 0} views. Properties with professional photos get 3x more enquiries!\n\n💡 **Quick wins to boost your listing:**\n• Add more photos — aim for 10+ high quality images\n• Make sure your first photo shows the best feature of the property\n• Our marketplace has professional photographers who can help\n\nWould you like me to connect you with a photographer? Just reply in your Concierge chat!`
      }

      // NUDGE 2: Views but no bookings after 14 days
      else if (listedDaysAgo === 14 && (viewCount || 0) > 10 && (bookingCount || 0) === 0) {
        insightTitle = `💰 Price Check — ${listing.title}`
        insightContent = `**${listing.title}** has had ${viewCount} views but no viewing requests yet. This usually means buyers are interested but something is holding them back.\n\n${priceHigherThanAvg ? `💡 Similar properties in ${listing.suburb} are listed at around R${Math.round(avgPrice!).toLocaleString()} — yours is listed ${Math.round(((listing.price - avgPrice!) / avgPrice!) * 100)}% higher. Consider adjusting your price to attract more interest.\n\n` : ''}💡 **Other ideas:**\n• Add a virtual tour — buyers can explore before visiting\n• Feature your listing on our homepage for R99/month for more visibility\n• Update your description to highlight unique features\n\nYour Concierge can help with any of these!`
      }

      // NUDGE 3: Approaching 2 month expiry (2 weeks before)
      else if (daysUntilExpiry === 14) {
        insightTitle = `⏰ Listing Expiring Soon — ${listing.title}`
        insightContent = `Your listing **${listing.title}** expires in 2 weeks.\n\n${(bookingCount || 0) === 0 ? `It hasn't had any viewing requests yet. Before you relist, it might be worth freshening things up:\n\n• 🎨 A fresh coat of paint and tidy garden can increase perceived value by 5-10%\n• 📸 New professional photos make a huge difference\n• 🏠 Home staging helps buyers imagine living there\n• 🔧 Small repairs go a long way\n\nOur marketplace has painters, photographers, handymen and staging specialists who can help. Want me to connect you with someone?` : `It has had ${bookingCount} viewing request${(bookingCount || 0) > 1 ? 's' : ''} — great progress! Make sure to relist before it expires to keep the momentum going.`}\n\nYour listing renews at R${listing.price_type === 'rent' ? '199' : '299'} — reply to your Concierge to relist!`
      }

      // NUDGE 4: 3 days before expiry
      else if (daysUntilExpiry === 3) {
        insightTitle = `🚨 Listing Expires in 3 Days — ${listing.title}`
        insightContent = `Don't let your listing disappear! **${listing.title}** expires in just 3 days.\n\nRelist now to keep your property visible to thousands of buyers and renters. Visit propertyaigency.co.za/my-listings to renew.\n\nR${listing.price_type === 'rent' ? '199' : '299'} to relist for another 2 months.`
      }

      if (insightTitle && insightContent) {
        // Save to AIsistant messages for the seller
        await supabase.from('aisistant_messages').insert({
          agent_id: listing.user_id,
          property_id: listing.id,
          message_type: 'listing_insight',
          title: insightTitle,
          content: insightContent,
          is_read: false
        })

        // Send push notification
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.propertyaigency.co.za'}/api/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: listing.user_id,
            title: insightTitle.split(' — ')[0],
            body: `Check your AIsistant for tips on ${listing.title}`,
            url: '/my-listings'
          })
        })

        nudged.push(listing.id)
      }
    }

    return NextResponse.json({ success: true, nudged: nudged.length, listings: nudged })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
