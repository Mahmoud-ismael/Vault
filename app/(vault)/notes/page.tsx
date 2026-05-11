import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotesClient from './NotesClient'

export default async function NotesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false })

  return <NotesClient initialNotes={notes || []} />
}