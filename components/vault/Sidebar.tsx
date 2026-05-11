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
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Loader2
} from 'lucide-react'
import { useTopbar } from './TopbarContext'
import { useSidebar } from '@/lib/hooks/useSidebar'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const router = useRouter()
  const { setSidebarOpen } = useTopbar()
  const { collapsed, toggleCollapsed } = useSidebar()
  
  const [counts, setCounts] = useState<Counts>({
    stances: 0,
    journal: 0,
    notes: 0,
    documents: 0,
    reviewNeeded: 0,
  })
  const [userName, setUserName] = useState<string>('')
  const [isSigningOut, setIsSigningOut] = useState(false)

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

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      toast.error('Sign out failed. Try again.')
      setIsSigningOut(false)
    }
  }

  const NavItem = ({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) => {
    const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
    
    return (
      <Link 
        href={href}
        className={`group relative flex items-center py-[12px] md:py-[9px] px-[20px] transition-all duration-150 border-l-2 ${
          collapsed ? 'justify-center border-transparent' : 'justify-between border-l-2'
        } ${
          active 
            ? 'text-vault-accent border-vault-accent bg-vault-accent-dim' 
            : 'text-vault-text-2 border-transparent hover:bg-vault-bg-3 hover:text-vault-text'
        }`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-[10px]'}`}>
          <Icon className="w-[16px] h-[16px] md:w-[14px] md:h-[14px] shrink-0" />
          <span className={`transition-opacity duration-150 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
            {label}
          </span>
        </div>
        
        {!collapsed && typeof badge === 'number' && badge > 0 && (
          <span className="text-[10px] bg-vault-bg-4 text-vault-text-3 px-2 rounded-full transition-opacity duration-150">
            {badge}
          </span>
        )}

        {/* Tooltip */}
        {collapsed && (
          <div className="fixed left-[64px] bg-vault-bg-3 border border-vault-border-2 rounded-[4px] px-2 py-1 text-[12px] text-vault-text whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-lg font-['Satoshi']">
            {label}
          </div>
        )}
      </Link>
    )
  }

  const SectionLabel = ({ text }: { text: string }) => (
    <div className={`text-[10px] md:text-[9px] uppercase tracking-normal text-vault-text-3 pt-[14px] px-[20px] pb-[6px] transition-opacity duration-150 ${collapsed ? 'opacity-0 h-0 overflow-hidden pt-0 pb-0' : 'opacity-100'}`}>
      {text}
    </div>
  )

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U'

  return (
    <div className="flex flex-col h-full bg-vault-bg-2 relative">
      {/* Mobile Close Button */}
      <button 
        onClick={() => setSidebarOpen(false)}
        className="absolute top-4 right-4 p-2 text-vault-text-3 hover:text-vault-text lg:hidden"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Toggle Button (Desktop only) */}
      <button
        onClick={toggleCollapsed}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-vault-bg-3 border border-vault-border-2 rounded-full items-center justify-center text-vault-text-3 hover:text-vault-accent hover:border-vault-accent transition-all duration-150 z-50 group"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 group-hover:scale-110" />
        ) : (
          <ChevronLeft className="w-3 h-3 group-hover:scale-110" />
        )}
      </button>

      {/* Logo Area */}
      <div className={`flex flex-col py-[24px] border-b border-vault-border transition-all duration-250 ${collapsed ? 'px-0 items-center h-[93px]' : 'px-[24px]'}`}>
        <div className={`transition-all duration-250 ${collapsed ? 'text-[18px] text-vault-accent font-bold' : 'text-[18px] uppercase text-vault-accent'}`}>
          {collapsed ? 'V' : 'VAULT'}
        </div>
        <div className={`text-[10px] md:text-[9px] uppercase tracking-normal text-vault-text-3 transition-opacity duration-150 ${collapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
          Personal Intelligence
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col">
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
      <div className="flex flex-col border-t border-vault-border">
        {/* User Chip & Review Nudge */}
        <div className="p-4 flex flex-col gap-4">
          {!collapsed && counts.reviewNeeded > 0 && (
            <div className="bg-vault-accent-dim border border-vault-accent-border rounded-[6px] p-3 flex flex-col gap-1 cursor-pointer hover:bg-vault-accent/10 transition-all duration-150 animate-in fade-in zoom-in-95">
              <div className="text-[10px] tracking-normal text-vault-accent uppercase font-bold">
                Review Due
              </div>
              <div className="text-[13px] text-vault-text">
                {counts.reviewNeeded} stance{counts.reviewNeeded > 1 ? 's' : ''} need update
              </div>
            </div>
          )}
          
          <div className={`flex items-center transition-all duration-250 ${collapsed ? 'justify-center px-0' : 'gap-3 px-2 py-1'}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-vault-bg-4 text-vault-text text-[12px] border border-vault-border shrink-0 font-bold">
              {initials}
            </div>
            <div className={`text-[14px] text-vault-text truncate flex-1 transition-opacity duration-150 ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 font-medium'}`}>
              {userName || 'User'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`group relative flex items-center border-t border-vault-border hover:bg-vault-bg-3 transition-all duration-150 w-full ${
            collapsed ? 'justify-center py-3' : 'px-5 py-3 gap-2.5'
          }`}
        >
          {isSigningOut ? (
            <>
              <Loader2 className="w-[14px] h-[14px] animate-spin text-vault-text-3" />
              {!collapsed && <span className="text-[14px] text-vault-text-3 font-medium">Signing out...</span>}
            </>
          ) : (
            <>
              <LogOut className="w-[14px] h-[14px] text-vault-danger shrink-0" />
              {!collapsed && <span className="text-[14px] text-vault-danger font-['Satoshi']">Sign out</span>}
              {collapsed && (
                <div className="fixed left-[64px] bg-vault-bg-3 border border-vault-border-2 rounded-[4px] px-2 py-1 text-[12px] text-vault-text whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[200] shadow-lg font-['Satoshi']">
                  Sign out
                </div>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
}