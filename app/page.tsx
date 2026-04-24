'use client'
import MobileBanner from '@/components/MobileBanner'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const T = {
  bg:'#f5f0eb', bg2:'#ede8e3', card:'#ffffff',
  nav:'#4a4238', navBdr:'#5c5449', navLink:'#c9bfb5',
  hero:'linear-gradient(160deg, #5c5449 0%, #4a4238 100%)',
  heroText:'#f5f0eb', heroSub:'#c9bfb5',
  text:'#2d2520', mid:'#5c5449', muted:'#8a7a6e',
  border:'#e8e0d8', borderMid:'#d4c8be', orange:'#f97316',
}

export default function Home() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  return (
    <main style={{minHeight:'100vh', backgroundColor:T.bg, color:T.text}}>

      {/* Nav */}
      <nav style={{backgroundColor:T.nav, borderBottom:`1px solid ${T.navBdr}`, padding:'16px 24px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontSize:'22px', fontWeight:700, color:T.heroText}}>
          Property<span style={{color:T.orange}}>AI</span>gency
        </div>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
          {['AI Search:/search','Buy:/buy','Rent:/rent','List:/list','How It Works:/how-it-works','Pricing:/pricing','Contact:/contact'].map(item => {
            const [label, href] = item.split(':')
            return <Link key={href} href={href} style={{color:T.navLink, fontSize:'14px', textDecoration:'none'}}>{label}</Link>
          })}
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
            <Link href="/buy" style={{color:T.heroSub, fontSize:'14px', border:`1px solid ${T.navBdr}`, padding:'8px 16px', borderRadius:'8px', textDecoration:'none'}}>Browse for Sale</Link>
            <Link href="/rent" style={{color:T.heroSub, fontSize:'14px', border:`1px solid ${T.navBdr}`, padding:'8px 16px', borderRadius:'8px', textDecoration:'none'}}>Browse to Rent</Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{backgroundColor:T.bg, padding:'64px 24px', maxWidth:'960px', margin:'0 auto', textAlign:'center'}}>
        <p style={{color:T.muted, fontSize:'12px', marginBottom:'40px', textTransform:'uppercase', letterSpacing:'0.1em'}}>Trusted by buyers, agents and service providers across South Africa</p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'24px', marginBottom:'40px'}}>
          {[
            {icon:'🤖', title:'AI-Powered Matching', desc:'Tell our Concierge what you want — it finds your perfect property instantly'},
            {icon:'📅', title:'Automatic Viewings', desc:'Buyers book directly into your diary. No phone calls, no back and forth'},
            {icon:'🏢', title:'Full Service Marketplace', desc:'Bond originators, attorneys, movers and more — connected at the right moment'},
          ].map((f,i) => (
            <div key={i} style={{padding:'24px', backgroundColor:T.card, borderRadius:'16px', border:`1px solid ${T.border}`}}>
              <div style={{fontSize:'32px', marginBottom:'12px'}}>{f.icon}</div>
              <h3 style={{fontSize:'16px', fontWeight:700, color:T.text, marginBottom:'8px'}}>{f.title}</h3>
              <p style={{fontSize:'13px', color:T.muted, lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
        <div style={{display:'flex', justifyContent:'center', gap:'16px', flexWrap:'wrap'}}>
          <Link href="/for-agents" style={{color:T.orange, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.orange}`, padding:'10px 24px', borderRadius:'8px'}}>For Estate Agents →</Link>
          <Link href="/supplier/register" style={{color:T.mid, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.border}`, padding:'10px 24px', borderRadius:'8px'}}>For Service Providers →</Link>
          <Link href="/how-it-works" style={{color:T.mid, fontSize:'14px', textDecoration:'none', border:`1px solid ${T.border}`, padding:'10px 24px', borderRadius:'8px'}}>How It Works →</Link>
        </div>
      </section>

      {/* CTA */}
      <section style={{backgroundColor:T.bg2, textAlign:'center', padding:'64px 24px', borderTop:`1px solid ${T.border}`}}>
        <h2 style={{fontSize:'28px', fontWeight:700, color:T.text, marginBottom:'12px'}}>Ready to list your property?</h2>
        <p style={{color:T.muted, marginBottom:'24px'}}>Use AI to write your advert, get a valuation and reach thousands of buyers</p>
        <Link href="/list" style={{backgroundColor:T.orange, color:'white', padding:'12px 32px', borderRadius:'8px', fontWeight:700, textDecoration:'none'}}>List My Property</Link>
      </section>

      <MobileBanner />

      <footer style={{borderTop:`1px solid ${T.borderMid}`, backgroundColor:T.bg2, padding:'32px 24px', textAlign:'center', color:T.muted, fontSize:'13px'}}>
        <div style={{display:'flex', justifyContent:'center', gap:'24px', marginBottom:'12px', flexWrap:'wrap'}}>
          {[['Terms of Service','/terms'],['Privacy Policy','/privacy'],['Supplier Terms','/supplier/terms'],['How It Works','/how-it-works'],['Contact','/contact']].map(([label,href])=>(
            <Link key={href} href={href} style={{color:T.muted, textDecoration:'none'}}>{label}</Link>
          ))}
        </div>
        <p>© 2026 PropertyAIgency. All rights reserved.</p>
      </footer>
    </main>
  )
}
