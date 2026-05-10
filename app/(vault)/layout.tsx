import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/vault/Sidebar'
import { Topbar } from '@/components/vault/Topbar'
import { TopbarProvider } from '@/components/vault/TopbarContext'

export default async function VaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <TopbarProvider>
      <div className="flex h-screen w-full bg-vault-bg overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="fixed inset-y-0 left-0 w-[240px] bg-vault-bg-2 border-r border-vault-border z-20">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 ml-[240px] h-full">
          {/* Sticky Topbar */}
          <div className="sticky top-0 z-10 w-full h-[52px] bg-vault-bg border-b border-vault-border">
            <Topbar />
          </div>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto w-full p-8 lg:p-10">
            <div className="w-full max-w-none">
               {children}
            </div>
          </main>
        </div>
      </div>
    </TopbarProvider>
  )
}