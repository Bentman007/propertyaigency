'use client'
import { useState } from 'react'

interface Props {
  title: string
  icon?: string
  defaultOpen?: boolean
  badge?: string | number
  children: React.ReactNode
}

export default function CollapsibleSection({ title, icon, defaultOpen = true, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-6 border border-stone-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-stone-50 hover:bg-stone-100 transition text-left"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="font-bold text-stone-800">{title}</span>
          {badge !== undefined && badge !== '' && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        <span className="text-stone-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5 bg-white">{children}</div>}
    </div>
  )
}
