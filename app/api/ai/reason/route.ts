import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Missing query', code: 'MISSING_QUERY' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      system: "You are a rigorous analytical thinking partner. The user wants to deeply understand a topic. Provide a comprehensive analysis covering: (1) The core question, (2) Multiple perspectives, (3) The strongest evidence on each side, (4) What remains genuinely uncertain, (5) What a clear-thinking person should conclude. Be honest about complexity.",
      messages: [{ role: 'user', content: query }],
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
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
