import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { topic, my_stance } = await req.json()
    
    if (!topic || !my_stance) {
      return NextResponse.json({ error: 'Missing topic or stance' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: 'You are helping someone think rigorously. Given their stance on a topic, write the single strongest steelman argument against their position. Be genuinely challenging, not a strawman. 3-4 sentences. No preamble.',
      messages: [
        {
          role: 'user',
          content: `Topic: ${topic}\n\nMy stance: ${my_stance}`
        }
      ],
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

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}