const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function test() {
  try {
    console.log('Testing Llama 3.1 70B...');
    const response = await client.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10,
    });
    console.log('Response:', response.choices[0].message.content);
  } catch (err) {
    console.error('Error:', err.status, err.message);
    if (err.response) {
       console.error('Body:', await err.response.text());
    }
  }
}

test();
