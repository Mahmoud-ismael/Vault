'use client'

import { useTopbar } from '@/components/vault/TopbarContext'
import { Sidebar } from '@/components/vault/Sidebar'
import { useSidebar } from '@/lib/hooks/useSidebar'
import { Toaster } from 'sonner'
import { Topbar } from './Topbar'
import { KeyboardShortcuts } from '@/components/shared/KeyboardShortcuts'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function VaultClientLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, fab } = useTopbar()
  const { collapsed } = useSidebar()
  const pathname = usePathname()

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  return (
    <div className="flex h-screen w-full bg-vault-bg overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 bg-vault-bg-2 border-r border-vault-border z-50 transition-all duration-250 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[60px]' : 'lg:w-[240px] w-[240px]'}`}
      >
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div 
        className={`flex flex-col flex-1 h-full w-full transition-all duration-250 ease-in-out ${
          collapsed ? 'lg:ml-[60px]' : 'lg:ml-[240px]'
        }`}
      >
        {/* Sticky Topbar */}
        <div className="sticky top-0 z-30 w-full h-[52px] bg-vault-bg border-b border-vault-border">
          <Topbar />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 lg:p-10 overflow-x-hidden relative">
          <div className="w-full max-w-none pb-20 md:pb-0">
             {children}
          </div>

          {/* Floating Action Button (FAB) - Mobile only */}
          {fab && (
            <button
              onClick={fab.onClick}
              className="fixed bottom-6 right-6 w-[52px] h-[52px] rounded-full bg-vault-accent text-[#0D0D0F] shadow-lg flex items-center justify-center z-50 md:hidden active:scale-95 transition-transform"
            >
              {fab.icon ? <fab.icon className="w-6 h-6" /> : <span className="text-xl">+</span>}
            </button>
          )}
        </main>
      </div>
      
      <Toaster theme="dark" toastOptions={{ className: 'sonner-toast' }} />
      <KeyboardShortcuts />
    </div>
  )
}
