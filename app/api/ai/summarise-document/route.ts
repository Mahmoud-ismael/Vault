import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { text, title } = await req.json()
    if (!text) return NextResponse.json({ error: 'Missing text', code: 'MISSING_TEXT' }, { status: 400 })

    const truncatedText = text.substring(0, 4000)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: 'Summarise the following document in 3-4 sentences. Focus on the main topic, key arguments, and conclusions. No preamble.',
      messages: [{ role: 'user', content: `Title: ${title}\n\nContent:\n${truncatedText}` }],
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
