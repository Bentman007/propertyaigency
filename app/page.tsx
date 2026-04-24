'use client'
import MobileBanner from '@/components/MobileBanner'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = {
  nav:'#4a4238', navBdr:'#5c5449', navLink:'#c9bfb5',
  heroText:'#ffffff', heroSub:'rgba(255,255,255,0.85)',
  text:'#2d2520', mid:'#5c5449', muted:'#8a7a6e',
  bg:'#f5f0eb', bg2:'#ede8e3', card:'#ffffff',
  border:'#e8e0d8', borderMid:'#d4c8be', orange:'#f97316',
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <main style={{minHeight:'100vh', backgroundColor:T.bg, color:T.text}}>

      {/* Nav */}
      <nav style={{backgroundColor:T.nav, borderBottom:`1px solid ${T.navBdr}`, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:50}}>
        <div style={{fontSize:'20px', fontWeight:700, color:T.heroText}}>
          Property<span style={{color:T.orange}}>AI</span>gency
        </div>
        {/* Desktop nav links */}
        <div style={{display:'flex', gap:'20px', alignItems:'center'}} className="hidden md:flex">
          {[['AI Search','/search'],['List a Property','/list'],['How It Works','/how-it-works'],['Pricing','/pricing'],['Contact','/contact']].map(([label,href])=>(
            <Link key={href} href={href} style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>{label}</Link>
          ))}
          {user ? (
            <Link href="/dashboard" style={{backgroundColor:T.orange, color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:600, fontSize:'14px', textDecoration:'none'}}>My Dashboard</Link>
          ) : (
            <>
              <Link href="/auth/login" style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>Sign In</Link>
              <Link href="/auth/register" style={{backgroundColor:T.orange, color:'white', padding:'8px 16px', borderRadius:'8px', fontWeight:600, fontSize:'14px', textDecoration:'none'}}>Register Free</Link>
            </>
          )}
        </div>
        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{display:'block', background:'none', border:'none', color:T.navLink, fontSize:'22px', cursor:'pointer', padding:'4px'}} className="md:hidden">
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div style={{backgroundColor:T.nav, borderBottom:`1px solid ${T.navBdr}`, padding:'16px 20px', display:'flex', flexDirection:'column', gap:'16px', zIndex:49, position:'relative'}}>
          {[['🔍 AI Search','/search'],['List a Property','/list'],['How It Works','/how-it-works'],['Pricing','/pricing'],['Contact','/contact']].map(([label,href])=>(
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{color:T.navLink, fontSize:'15px', textDecoration:'none', paddingBottom:'8px', borderBottom:`1px solid ${T.navBdr}`}}>{label}</Link>
          ))}
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} style={{backgroundColor:T.orange, color:'white', padding:'10px 16px', borderRadius:'8px', fontWeight:700, fontSize:'15px', textDecoration:'none', textAlign:'center'}}>My Dashboard</Link>
              <button onClick={() => { supabase.auth.signOut().then(()=>setUser(null)); setMenuOpen(false) }} style={{color:T.navLink, fontSize:'14px', background:'none', border:'none', cursor:'pointer', textAlign:'left'}}>Sign Out</button>
            </>
          ) : (
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} style={{backgroundColor:T.orange, color:'white', padding:'10px 16px', borderRadius:'8px', fontWeight:700, fontSize:'15px', textDecoration:'none', textAlign:'center'}}>Sign In</Link>
          )}
        </div>
      )}

      {/* Hero — full screen with property background image */}
      <section style={{
        minHeight:'100svh',
        backgroundImage:'url(https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&q=80)',
        backgroundSize:'cover',
        backgroundPosition:'center',
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:'40px 24px',
        position:'relative',
        textAlign:'center',
      }}>
        {/* Dark overlay */}
        <div style={{position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(74,66,56,0.5) 0%, rgba(45,37,32,0.75) 100%)'}}/>
        
        <div style={{position:'relative', zIndex:1, maxWidth:'520px', width:'100%'}}>
          <h1 style={{fontSize:'clamp(32px, 8vw, 56px)', fontWeight:800, color:T.heroText, marginBottom:'16px', lineHeight:1.1}}>
            Find Your Perfect <span style={{color:T.orange}}>Property</span>
          </h1>
          <p style={{color:T.heroSub, fontSize:'clamp(15px, 4vw, 18px)', marginBottom:'32px', lineHeight:1.5}}>
            South Africa's AI-powered property platform — just tell our Concierge what you want
          </p>
          <Link href="/search" style={{
            display:'inline-flex', alignItems:'center', gap:'10px',
            backgroundColor:T.orange, color:'white',
            padding:'16px 32px', borderRadius:'16px',
            fontWeight:700, fontSize:'clamp(15px, 4vw, 18px)',
            textDecoration:'none', width:'100%', justifyContent:'center',
            boxSizing:'border-box' as any,
          }}>
            🤖 Chat with AI Concierge
          </Link>
          <p style={{color:T.heroSub, fontSize:'13px', marginTop:'12px'}}>
            Tell our AI what you want — it finds your perfect match
          </p>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{backgroundColor:T.bg, padding:'48px 20px', maxWidth:'900px', margin:'0 auto'}}>
        <p style={{color:T.muted, fontSize:'12px', marginBottom:'32px', textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center'}}>Trusted by buyers, agents and service providers across South Africa</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'16px', marginBottom:'32px'}}>
          {[
            {icon:'🤖', title:'AI-Powered Matching', desc:'Tell our Concierge what you want — it finds your perfect property instantly'},
            {icon:'📅', title:'Automatic Viewings', desc:'Buyers book directly into your diary. No phone calls, no back and forth'},
            {icon:'🏢', title:'Full Service Marketplace', desc:'Bond originators, attorneys, movers — connected at exactly the right moment'},
          ].map((f,i) => (
            <div key={i} style={{padding:'20px', backgroundColor:T.card, borderRadius:'16px', border:`1px solid ${T.border}`}}>
              <div style={{fontSize:'28px', marginBottom:'10px'}}>{f.icon}</div>
              <h3 style={{fontSize:'15px', fontWeight:700, color:T.text, marginBottom:'6px'}}>{f.title}</h3>
              <p style={{fontSize:'13px', color:T.muted, lineHeight:1.6, margin:0}}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{display:'flex', justifyContent:'center', gap:'12px', flexWrap:'wrap'}}>
          <Link href="/for-agents" style={{color:T.orange, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.orange}`, padding:'10px 20px', borderRadius:'8px'}}>For Estate Agents →</Link>
          <Link href="/supplier/register" style={{color:T.mid, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.border}`, padding:'10px 20px', borderRadius:'8px'}}>For Service Providers →</Link>
          <Link href="/how-it-works" style={{color:T.mid, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.border}`, padding:'10px 20px', borderRadius:'8px'}}>How It Works →</Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{backgroundColor:T.bg2, textAlign:'center', padding:'48px 20px', borderTop:`1px solid ${T.border}`}}>
        <h2 style={{fontSize:'24px', fontWeight:700, color:T.text, marginBottom:'10px'}}>Ready to list your property?</h2>
        <p style={{color:T.muted, marginBottom:'20px', fontSize:'14px'}}>Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" style={{backgroundColor:T.orange, color:'white', padding:'12px 28px', borderRadius:'8px', fontWeight:700, textDecoration:'none', fontSize:'15px'}}>List My Property</Link>
      </section>

      <MobileBanner />

      <footer style={{borderTop:`1px solid ${T.borderMid}`, backgroundColor:T.bg2, padding:'28px 20px', textAlign:'center', color:T.muted, fontSize:'13px'}}>
        <div style={{display:'flex', justifyContent:'center', gap:'16px', marginBottom:'10px', flexWrap:'wrap'}}>
          {[['Terms','/terms'],['Privacy','/privacy'],['Supplier Terms','/supplier/terms'],['How It Works','/how-it-works'],['Contact','/contact']].map(([label,href])=>(
            <Link key={href} href={href} style={{color:T.muted, textDecoration:'none'}}>{label}</Link>
          ))}
        </div>
        <p style={{margin:0}}>© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
