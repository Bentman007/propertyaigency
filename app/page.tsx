'use client'
import MobileBanner from '@/components/MobileBanner'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = {
  bg:       '#f5f0eb',
  bgCard:   '#ffffff',
  bgSection:'#ede8e3',
  nav:      '#4a4238',
  navBorder:'#5c5449',
  navLink:  '#c9bfb5',
  navHover: '#f5f0eb',
  hero:     'linear-gradient(160deg, #5c5449 0%, #4a4238 100%)',
  heroText: '#f5f0eb',
  heroSub:  '#c9bfb5',
  text:     '#2d2520',
  textMid:  '#5c5449',
  textMuted:'#8a7a6e',
  border:   '#e8e0d8',
  borderMid:'#d4c8be',
  orange:   '#f97316',
  orangeHov:'#ea6a00',
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [locationLabel, setLocationLabel] = useState('Latest Properties')
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchProperties()
    getLocation()
    fetchFeatured()
  }, [])

  const fetchFeatured = async () => {
    const { data } = await supabase.from('properties').select('*').eq('status','active').eq('featured',true).order('created_at',{ascending:false}).limit(3)
    if (data && data.length > 0) setFeaturedProperties(data)
  }

  const fetchProperties = async (suburb?: string, city?: string) => {
    let query = supabase.from('properties').select('*').eq('status','active').order('created_at',{ascending:false}).limit(6)
    if (city) query = supabase.from('properties').select('*').eq('status','active').ilike('city',`%${city}%`).order('created_at',{ascending:false}).limit(6)
    const { data } = await query
    if (data && data.length > 0) { setProperties(data) }
    else if (city) {
      const { data: all } = await supabase.from('properties').select('*').eq('status','active').order('created_at',{ascending:false}).limit(6)
      if (all) setProperties(all)
      setLocationLabel('Latest Properties')
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}`)
        const data = await res.json()
        const comps = data.results?.[0]?.address_components || []
        const city = comps.find((c:any) => c.types.includes('locality'))?.long_name
        const suburb = comps.find((c:any) => c.types.includes('sublocality'))?.long_name
        if (city) { setLocationLabel(`Properties Near You — ${suburb||city}`); fetchProperties(suburb, city) }
      } catch { fetchProperties() }
      setLocating(false)
    }, () => { fetchProperties(); setLocating(false) }, { timeout:5000 })
  }

  const formatPrice = (price:number, type:string) => `R ${price?.toLocaleString()}${type==='rent'?'/mo':''}`

  return (
    <main style={{minHeight:'100vh', backgroundColor:T.bg, color:T.text}}>

      {/* Nav */}
      <nav style={{backgroundColor:T.nav, borderBottom:`1px solid ${T.navBorder}`, padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontSize:'22px', fontWeight:700, color:T.heroText}}>
          Property<span style={{color:T.orange}}>AI</span>gency
        </div>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
          <Link href="/search" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>🔍 AI Search</Link>
          <Link href="/buy" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>Buy</Link>
          <Link href="/rent" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>Rent</Link>
          <Link href="/list" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>List</Link>
          <Link href="/how-it-works" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>How It Works</Link>
          <Link href="/pricing" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>Pricing</Link>
          <Link href="/contact" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>Contact</Link>
        </div>
        {user ? (
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <Link href="/dashboard" style={{backgroundColor:T.orange, color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:600, fontSize:'14px', textDecoration:'none'}}>My Dashboard</Link>
            <button onClick={() => supabase.auth.signOut().then(()=>setUser(null))} style={{color:T.navLink, fontSize:'14px', background:'none', border:'none', cursor:'pointer'}}>Sign Out</button>
          </div>
        ) : (
          <Link href="/auth/login" style={{backgroundColor:T.orange, color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:600, fontSize:'14px', textDecoration:'none'}}>Sign In</Link>
        )}
      </nav>

      {/* Hero */}
      <section style={{background:T.hero, textAlign:'center', padding:'96px 24px'}}>
        <h1 style={{fontSize:'60px', fontWeight:800, color:T.heroText, marginBottom:'16px', lineHeight:1.1}}>
          Find Your Perfect <span style={{color:T.orange}}>Property</span>
        </h1>
        <p style={{color:T.heroSub, fontSize:'20px', marginBottom:'32px'}}>South Africa's smartest AI-powered property platform</p>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
          <Link href="/search" style={{backgroundColor:T.orange, color:'white', padding:'16px 40px', borderRadius:'16px', fontWeight:700, fontSize:'18px', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'8px'}}>
            🤖 Chat with AI Concierge
          </Link>
          <p style={{color:T.heroSub, fontSize:'14px'}}>Tell our AI what you want in plain English — it will find your perfect match</p>
          <div style={{display:'flex', gap:'16px', marginTop:'8px'}}>
            <Link href="/buy" style={{color:T.heroSub, fontSize:'14px', border:`1px solid ${T.navBorder}`, padding:'8px 16px', borderRadius:'8px', textDecoration:'none'}}>Browse for Sale</Link>
            <Link href="/rent" style={{color:T.heroSub, fontSize:'14px', border:`1px solid ${T.navBorder}`, padding:'8px 16px', borderRadius:'8px', textDecoration:'none'}}>Browse to Rent</Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featuredProperties.length > 0 && (
        <section style={{padding:'32px 24px', maxWidth:'1152px', margin:'0 auto'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px'}}>
            <span style={{backgroundColor:'#eab308', color:'#1a1a1a', fontSize:'11px', fontWeight:700, padding:'4px 12px', borderRadius:'20px'}}>⭐ FEATURED</span>
            <h2 style={{fontSize:'24px', fontWeight:700, color:T.text}}>Featured Properties</h2>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px'}}>
            {featuredProperties.map((p,i) => (
              <Link href={`/property/${p.id}`} key={i} style={{backgroundColor:T.bgCard, borderRadius:'16px', overflow:'hidden', border:'2px solid #eab308', textDecoration:'none', display:'block'}}>
                <div style={{height:'192px', backgroundColor:T.bgSection, position:'relative'}}>
                  {p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'48px'}}>🏠</div>}
                </div>
                <div style={{padding:'16px'}}>
                  <span style={{backgroundColor:p.price_type==='rent'?'#3b82f6':T.orange, color:'white', fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'4px'}}>{p.price_type==='rent'?'To Rent':'For Sale'}</span>
                  <h3 style={{fontSize:'17px', fontWeight:700, color:T.text, margin:'8px 0 4px'}}>{p.title}</h3>
                  <p style={{color:T.textMuted, fontSize:'13px'}}>📍 {p.suburb}, {p.city}</p>
                  <p style={{color:'#eab308', fontWeight:700, fontSize:'20px', margin:'8px 0 4px'}}>{formatPrice(p.price, p.price_type)}</p>
                  <p style={{color:T.textMuted, fontSize:'12px'}}>🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest Properties */}
      <section style={{padding:'40px 24px', maxWidth:'1152px', margin:'0 auto'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <h2 style={{fontSize:'28px', fontWeight:700, color:T.text}}>{locationLabel}</h2>
            {locating && <span style={{color:T.orange, fontSize:'13px'}}>📍 Finding nearby...</span>}
          </div>
          <Link href="/search" style={{color:T.orange, fontSize:'14px', textDecoration:'none'}}>Find my perfect match →</Link>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px'}}>
          {properties.length > 0 ? properties.map((p,i) => (
            <Link href={`/property/${p.id}`} key={i} style={{backgroundColor:T.bgCard, borderRadius:'16px', overflow:'hidden', border:`1px solid ${T.border}`, textDecoration:'none', display:'block'}}>
              <div style={{height:'192px', backgroundColor:T.bgSection}}>
                {p.photos?.[0] ? <img src={p.photos[0]} alt={p.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'48px'}}>🏠</div>}
              </div>
              <div style={{padding:'16px'}}>
                <span style={{backgroundColor:p.price_type==='rent'?'#3b82f6':T.orange, color:'white', fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'4px'}}>{p.price_type==='rent'?'To Rent':'For Sale'}</span>
                <h3 style={{fontSize:'17px', fontWeight:700, color:T.text, margin:'8px 0 4px'}}>{p.title}</h3>
                <p style={{color:T.textMuted, fontSize:'13px'}}>📍 {p.suburb}, {p.city}</p>
                <p style={{color:T.orange, fontWeight:700, fontSize:'20px', margin:'8px 0 4px'}}>{formatPrice(p.price, p.price_type)}</p>
                <p style={{color:T.textMuted, fontSize:'12px'}}>🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths · AI Verified ✓</p>
              </div>
            </Link>
          )) : (
            [{title:'Modern Villa',suburb:'Sandton',city:'Johannesburg',price:4200000,price_type:'sale',bedrooms:4,bathrooms:3},
             {title:'Sea Point Apartment',suburb:'Sea Point',city:'Cape Town',price:18500,price_type:'rent',bedrooms:2,bathrooms:2},
             {title:'Family Home',suburb:'Umhlanga',city:'Durban',price:2850000,price_type:'sale',bedrooms:3,bathrooms:2}
            ].map((p,i) => (
              <div key={i} style={{backgroundColor:T.bgCard, borderRadius:'16px', overflow:'hidden', border:`1px solid ${T.border}`}}>
                <div style={{height:'192px', backgroundColor:T.bgSection, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'48px'}}>🏠</div>
                <div style={{padding:'16px'}}>
                  <span style={{backgroundColor:p.price_type==='rent'?'#3b82f6':T.orange, color:'white', fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'4px'}}>{p.price_type==='rent'?'To Rent':'For Sale'}</span>
                  <h3 style={{fontSize:'17px', fontWeight:700, color:T.text, margin:'8px 0 4px'}}>{p.title}</h3>
                  <p style={{color:T.textMuted, fontSize:'13px'}}>📍 {p.suburb}, {p.city}</p>
                  <p style={{color:T.orange, fontWeight:700, fontSize:'20px', margin:'8px 0 4px'}}>{formatPrice(p.price, p.price_type)}</p>
                  <p style={{color:T.textMuted, fontSize:'12px'}}>🛏 {p.bedrooms} beds · 🚿 {p.bathrooms} baths · AI Verified ✓</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{backgroundColor:T.bgSection, textAlign:'center', padding:'64px 24px', borderTop:`1px solid ${T.border}`}}>
        <h2 style={{fontSize:'28px', fontWeight:700, color:T.text, marginBottom:'12px'}}>Ready to list your property?</h2>
        <p style={{color:T.textMuted, marginBottom:'24px'}}>Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" style={{backgroundColor:T.orange, color:'white', padding:'12px 32px', borderRadius:'8px', fontWeight:700, textDecoration:'none'}}>List My Property</Link>
      </section>

      <MobileBanner />

      {/* Footer */}
      <footer style={{borderTop:`1px solid ${T.borderMid}`, backgroundColor:T.bgSection, padding:'32px 24px', textAlign:'center', color:T.textMuted, fontSize:'13px'}}>
        <div style={{display:'flex', justifyContent:'center', gap:'24px', marginBottom:'12px'}}>
          <Link href="/terms" style={{color:T.textMuted, textDecoration:'none'}}>Terms of Service</Link>
          <Link href="/privacy" style={{color:T.textMuted, textDecoration:'none'}}>Privacy Policy</Link>
          <Link href="/supplier/terms" style={{color:T.textMuted, textDecoration:'none'}}>Supplier Terms</Link>
          <Link href="/contact" style={{color:T.textMuted, textDecoration:'none'}}>Contact</Link>
        </div>
        <p>© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
