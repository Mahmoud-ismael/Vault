const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

async function listModels() {
  try {
    const response = await client.models.list();
    console.log('Available Models:');
    response.data.forEach(m => console.log('- ' + m.id));
  } catch (err) {
    console.error('Error:', err.status, err.message);
  }
}

listModels();
