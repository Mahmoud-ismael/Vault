import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { content } = await req.json()
    if (!content) return NextResponse.json({ error: 'Missing content', code: 'MISSING_CONTENT' }, { status: 400 })

    const stream = await streamText(
      content,
      'Summarise the following journal entry in 3 concise sentences. Focus on the main ideas and insights. No preamble.',
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}