import { NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/nvidia'

export async function POST(req: Request) {
  try {
    const { topic } = await req.json()
    if (!topic) return NextResponse.json({ error: 'Missing topic', code: 'MISSING_TOPIC' }, { status: 400 })

    const text = await generateText(
      `Suggest sources for the topic: ${topic}`,
      `You are an expert researcher. Given a worldview or philosophical topic, suggest 3-5 real, foundational books or academic papers someone should read to understand this topic deeply. 
Return ONLY a raw JSON array of objects with keys: "title", "author", "type" (Book or Paper), and "why" (1 sentence explanation). No markdown, no preamble.`,
      false
    )

    try {
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(jsonStr)
      return NextResponse.json(parsed)
    } catch (err) {
      console.error('Failed to parse JSON', text)
      return NextResponse.json({ error: 'Failed to parse AI response', code: 'AI_PARSE_ERROR' }, { status: 500 })
    }
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 })
  }
}
