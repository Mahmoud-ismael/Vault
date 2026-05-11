import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    if (!text) return NextResponse.json({ error: 'Missing text', code: 'MISSING_TEXT' }, { status: 400 })

    const truncatedText = text.substring(0, 6000)
    const stream = await streamText(
      truncatedText,
      'Extract the 4-6 main arguments or key claims from this document. Return as a numbered list. Each item: one sentence. No preamble.',
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
