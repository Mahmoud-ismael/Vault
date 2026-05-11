import { NextResponse } from 'next/server'
import { streamText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { selected_text, context } = await req.json()
    if (!selected_text) return NextResponse.json({ error: 'Missing text', code: 'MISSING_TEXT' }, { status: 400 })

    const stream = await streamText(
      `Context of entry: ${context || 'None'}\n\nSelected thought: ${selected_text}`,
      `The user has written: '${selected_text}'. Help them develop this thought further. Write 1-2 paragraphs that explore the idea more deeply, maintaining their voice and perspective. No preamble.`,
      true
    )

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}