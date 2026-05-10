import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StanceClient from './StanceClient'

export default async function StancePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  // Use await params to conform to Next.js 15 dynamic routing behavior
  const { id } = await params

  const { data: stance } = await supabase
    .from('stances')
    .select('*')
    .eq('id', id)
    .single()

  if (!stance) {
    notFound()
  }

  const { data: allStances } = await supabase
    .from('stances')
    .select('id, topic, status, my_stance')
    .eq('status', 'settled')

  return (
    <StanceClient initialStance={stance} allSettledStances={allStances || []} />
  )
}