import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DocumentViewerClient from './DocumentViewerClient'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: document } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (!document) notFound()

  // get public URL for images
  let publicUrl = ''
  if (document.file_type === 'IMAGE') {
    const { data: { publicUrl: url } } = supabase.storage.from('documents').getPublicUrl(document.file_path)
    publicUrl = url
  }

  return <DocumentViewerClient document={document} publicUrl={publicUrl} />
}