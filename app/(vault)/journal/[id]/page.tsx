import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JournalEditorClient from './JournalEditorClient'

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: entry } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  return <JournalEditorClient initialEntry={entry} />
}