import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { selected_text, context } = await req.json()
    if (!selected_text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      system: `The user has written: '${selected_text}'. Help them develop this thought further. Write 1-2 paragraphs that explore the idea more deeply, maintaining their voice and perspective. No preamble.`,
      messages: [{ role: 'user', content: `Context of entry: ${context || 'None'}\n\nSelected thought: ${selected_text}` }],
      stream: true,
    })

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}