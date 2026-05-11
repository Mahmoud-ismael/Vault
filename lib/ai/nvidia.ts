import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function generateText(
  prompt: string,
  system: string,
  fast = false
): Promise<string> {
  const model = fast
    ? 'meta/llama-3.1-8b-instruct'
    : 'meta/llama-3.1-405b-instruct';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
  });

  return response.choices[0]?.message?.content ?? '';
}

export async function streamText(
  prompt: string,
  system: string,
  fast = false
): Promise<ReadableStream> {
  const model = fast
    ? 'meta/llama-3.1-8b-instruct'
    : 'meta/llama-3.1-405b-instruct';

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? '';
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    },
  });
}
