import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { text, title } = await req.json()
    if (!text) return NextResponse.json({ error: 'Missing text', code: 'MISSING_TEXT' }, { status: 400 })

    const truncatedText = text.substring(0, 4000)
    const stream = await streamText(
      `Title: ${title}\n\nContent:\n${truncatedText}`,
      'Summarise the following document in 3-4 sentences. Focus on the main topic, key arguments, and conclusions. No preamble.',
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
