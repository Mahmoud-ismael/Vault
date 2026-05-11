import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NoteEditorClient from './NoteEditorClient'

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (!note) notFound()

  return <NoteEditorClient initialNote={note} />
}