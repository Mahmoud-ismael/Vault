'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Target,
  Search,
  BookOpen,
  FileText,
  Archive,
  Settings
} from 'lucide-react'

type Counts = {
  stances: number
  journal: number
  notes: number
  documents: number
  reviewNeeded: number
}

export function Sidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  
  const [counts, setCounts] = useState<Counts>({
    stances: 0,
    journal: 0,
    notes: 0,
    documents: 0,
    reviewNeeded: 0,
  })
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      
      if (profile) setUserName(profile.name)

      // Fetch badge counts
      const [stancesReq, journalReq, notesReq, docsReq] = await Promise.all([
        supabase.from('stances').select('*', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
      ])

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      const { count: reviewCount } = await supabase
        .from('stances')
        .select('*', { count: 'exact', head: true })
        .lt('last_updated', ninetyDaysAgo)
        .neq('status', 'empty')

      setCounts({
        stances: stancesReq.count || 0,
        journal: journalReq.count || 0,
        notes: notesReq.count || 0,
        documents: docsReq.count || 0,
        reviewNeeded: reviewCount || 0,
      })
    }
    
    loadData()
  }, [supabase])

  const NavItem = ({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) => {
    const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
    
    return (
      <Link 
        href={href}
        className={`flex items-center justify-between py-[9px] px-[20px] font-sans text-[14px] border-l-2 transition-colors duration-150 ${
          active 
            ? 'text-vault-accent border-vault-accent bg-vault-accent-dim' 
            : 'text-vault-text-2 border-transparent hover:bg-vault-bg-3 hover:text-vault-text'
        }`}
      >
        <div className="flex items-center gap-[10px]">
          <Icon className="w-[14px] h-[14px]" />
          <span>{label}</span>
        </div>
        {typeof badge === 'number' && badge > 0 && (
          <span className="font-mono text-[10px] bg-vault-bg-4 text-vault-text-3 px-2 rounded-full">
            {badge}
          </span>
        )}
      </Link>
    )
  }

  const SectionLabel = ({ text }: { text: string }) => (
    <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-vault-text-3 pt-[14px] px-[20px] pb-[6px]">
      {text}
    </div>
  )

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="flex flex-col h-full bg-vault-bg-2 border-r border-vault-border">
      {/* Logo Area */}
      <div className="flex flex-col px-[24px] py-[24px] border-b border-vault-border">
        <div className="font-mono text-[18px] uppercase text-vault-accent">VAULT</div>
        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-vault-text-3">Personal Intelligence</div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <SectionLabel text="Core" />
        <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem href="/stances" icon={Target} label="Stances" badge={counts.stances} />
        <NavItem href="/search" icon={Search} label="Search" />

        <SectionLabel text="Writing" />
        <NavItem href="/journal" icon={BookOpen} label="Journal" badge={counts.journal} />
        <NavItem href="/notes" icon={FileText} label="Notes" badge={counts.notes} />

        <SectionLabel text="Knowledge" />
        <NavItem href="/documents" icon={Archive} label="Documents" badge={counts.documents} />

        <SectionLabel text="System" />
        <NavItem href="/settings" icon={Settings} label="Settings" />
      </div>

      {/* Bottom Area */}
      <div className="p-4 flex flex-col gap-4 border-t border-vault-border">
        {counts.reviewNeeded > 0 && (
          <div className="bg-vault-accent-dim border border-vault-accent-border rounded-[6px] p-3 flex flex-col gap-1 cursor-pointer hover:bg-vault-accent/10 transition-colors">
            <div className="font-mono text-[10px] tracking-wider text-vault-accent uppercase">
              Review Due
            </div>
            <div className="font-sans text-[13px] text-vault-text">
              {counts.reviewNeeded} stance{counts.reviewNeeded > 1 ? 's' : ''} need update
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-vault-bg-4 text-vault-text font-mono text-[12px] border border-vault-border">
            {initials}
          </div>
          <div className="font-sans text-[14px] text-vault-text truncate flex-1">
            {userName || 'User'}
          </div>
        </div>
      </div>
    </div>
  )
}