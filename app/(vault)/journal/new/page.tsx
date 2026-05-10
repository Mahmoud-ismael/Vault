import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewJournalPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title: 'Untitled',
      content: {},
      tags: [],
      word_count: 0
    })
    .select('id')
    .single()

  if (error || !data) {
    redirect('/journal')
  }

  redirect(`/journal/${data.id}`)
}
