import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { query, mode } = await req.json()
    if (!query) return NextResponse.json({ error: 'Missing query', code: 'MISSING_QUERY' }, { status: 400 })

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest", 
      tools: [{ googleSearch: {} }] as any
    })

    const finalQuery = mode === 'ACADEMIC' 
      ? `Focus on peer-reviewed research, academic consensus, and scholarly debate. Cite types of sources that exist. Query: ${query}`
      : query

    const result = await model.generateContentStream(finalQuery)
    
    const stream = new ReadableStream({
      async start(controller) {
        let sources: any[] = []
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            controller.enqueue(new TextEncoder().encode(chunkText))
            
            const chunkSources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
            if (chunkSources) {
              sources = [...sources, ...chunkSources]
            }
          }
          if (sources.length > 0) {
            // Deduplicate sources
            const uniqueUrls = new Set()
            const uniqueSources = []
            for (const src of sources) {
              const url = src.web?.uri
              if (url && !uniqueUrls.has(url)) {
                uniqueUrls.add(url)
                uniqueSources.push({ title: src.web.title, url })
              }
            }
            controller.enqueue(new TextEncoder().encode('\n\n___SOURCES___\n' + JSON.stringify(uniqueSources)))
          }
        } catch (e) {
          console.error(e)
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