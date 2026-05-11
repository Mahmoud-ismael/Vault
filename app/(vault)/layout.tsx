import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopbarProvider } from '@/components/vault/TopbarContext'
import { SidebarProvider } from '@/lib/hooks/useSidebar'
import { VaultClientLayout } from '@/components/vault/VaultClientLayout'

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
      <SidebarProvider>
        <VaultClientLayout>{children}</VaultClientLayout>
      </SidebarProvider>
    </TopbarProvider>
  )
}