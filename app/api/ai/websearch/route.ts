import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/nvidia';

export async function POST(req: NextRequest) {
  try {
    const { query, mode } = await req.json();
    if (!query) return NextResponse.json({ error: 'Missing query', code: 'MISSING_QUERY' }, { status: 400 });

    const finalQuery = mode === 'ACADEMIC'
      ? `Focus on peer-reviewed research, academic consensus, and scholarly debate. Query: ${query}`
      : query;

    // Step 1: Search with Tavily
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: finalQuery,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: false,
      }),
    });

    const tavilyData = await tavilyRes.json();
    const results = tavilyData.results ?? [];

    // Step 2: Format results for context
    const context = results
      .map((r: { title: string; content: string; url: string }, i: number) =>
        `Source ${i + 1}: ${r.title}\n${r.content}\nURL: ${r.url}`
      )
      .join('\n\n');

    // Step 3: Synthesise with NVIDIA Llama
    const system = `You are a research assistant. Using the search results provided, give a comprehensive, well-reasoned answer to the query. Reference the sources by number. Be analytical, not just descriptive.`;
    const prompt = `Query: ${query}\n\nSearch Results:\n${context}`;

    const answer = await generateText(prompt, system, false);

    return NextResponse.json({
      answer,
      sources: results.map((r: { title: string; url: string }) => ({
        title: r.title,
        url: r.url,
      })),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message, code: 'AI_ERROR' }, { status: 500 });
  }
}