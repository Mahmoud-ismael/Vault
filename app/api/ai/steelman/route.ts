import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { topic, my_stance } = await req.json()
    if (!topic || !my_stance) return NextResponse.json({ error: 'Missing topic or stance', code: 'MISSING_PARAMS' }, { status: 400 })

    const stream = await streamText(
      `Topic: ${topic}\n\nMy stance: ${my_stance}`,
      'You are helping someone think rigorously. Given their stance on a topic, write the single strongest steelman argument against their position. Be genuinely challenging, not a strawman. 3-4 sentences. No preamble.',
      false
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}