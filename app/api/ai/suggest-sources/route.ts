import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()
    
    if (!topic) {
      return NextResponse.json({ error: 'Missing topic', code: 'MISSING_TOPIC' }, { status: 400 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      system: `You are an expert researcher. Given a worldview or philosophical topic, suggest 3-5 real, foundational books or academic papers someone should read to understand this topic deeply. 
Return ONLY a raw JSON array of objects with keys: "title", "author", "type" (Book or Paper), and "why" (1 sentence explanation). No markdown, no preamble.`,
      messages: [
        {
          role: 'user',
          content: `Suggest sources for the topic: ${topic}`
        }
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      try {
        const jsonStr = content.text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(jsonStr)
        return NextResponse.json(parsed)
      } catch (err) {
        console.error("Failed to parse JSON", content.text)
        return NextResponse.json({ error: 'Failed to parse AI response', code: 'AI_PARSE_ERROR' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Invalid response format', code: 'INVALID_FORMAT' }, { status: 500 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
