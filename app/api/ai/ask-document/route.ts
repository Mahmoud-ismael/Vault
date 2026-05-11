import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { question, document_text } = await req.json()
    if (!question || !document_text) return NextResponse.json({ error: 'Missing parameters', code: 'MISSING_PARAMS' }, { status: 400 })

    const truncatedText = document_text.substring(0, 6000)
    const stream = await streamText(
      `Document:\n${truncatedText}\n\nQuestion: ${question}`,
      'Answer the following question using ONLY the information in the document provided. If the answer is not in the document, say so. Be concise and direct.',
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
