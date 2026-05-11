import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function NewNotePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title: 'Untitled Note',
      content: {},
      pinned: false
    })
    .select('id')
    .single()

  if (error || !data) {
    redirect('/notes')
  }

  redirect(`/notes/${data.id}`)
}
