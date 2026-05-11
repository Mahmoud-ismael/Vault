import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Missing query', code: 'MISSING_QUERY' }, { status: 400 })

    const stream = await streamText(
      query,
      'You are a rigorous analytical thinking partner. The user wants to deeply understand a topic. Provide a comprehensive analysis covering: (1) The core question, (2) Multiple perspectives, (3) The strongest evidence on each side, (4) What remains genuinely uncertain, (5) What a clear-thinking person should conclude. Be honest about complexity.',
      false
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
