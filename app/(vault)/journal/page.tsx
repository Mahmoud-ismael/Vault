import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JournalClient from './JournalClient'

export default async function JournalPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false })

  return <JournalClient initialEntries={entries || []} />
}