import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { question, document_text } = await req.json()
    if (!question || !document_text) return NextResponse.json({ error: 'Missing parameters', code: 'MISSING_PARAMS' }, { status: 400 })

    const truncatedText = document_text.substring(0, 6000)
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      system: 'Answer the following question using ONLY the information in the document provided. If the answer is not in the document, say so. Be concise and direct.',
      messages: [{ role: 'user', content: `Document:\n${truncatedText}\n\nQuestion: ${question}` }],
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
