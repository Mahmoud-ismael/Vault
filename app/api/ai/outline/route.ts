import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Missing topic', code: 'MISSING_TOPIC' }, { status: 400 })

    const stream = await streamText(
      `Topic: ${topic}`,
      'Create a structured outline for a research note on the given topic. Use clear section headings and 2-3 bullet points per section. Format as plain text with ## for headings and - for bullets. 5-7 sections. No preamble.',
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}