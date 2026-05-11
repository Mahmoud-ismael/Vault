import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Missing topic', code: 'MISSING_TOPIC' }, { status: 400 })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      system: `Create a structured outline for a research note on: [topic]. Use clear section headings and 2-3 bullet points per section. Format as plain text with ## for headings and - for bullets. 5-7 sections. No preamble.`,
      messages: [{ role: 'user', content: `Topic: ${topic}` }],
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