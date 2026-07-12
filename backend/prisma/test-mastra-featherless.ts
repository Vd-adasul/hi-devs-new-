import { Agent } from '@mastra/core/agent';
import dotenv from 'dotenv';

dotenv.config({ override: true });

// Set environment variables for the test
process.env.OPENAI_API_KEY = 'rc_c7f641ee1757128d07bd6e10ad63f9eb45988d7d49b4c691c562e21ebc7b089a';
process.env.OPENAI_BASE_URL = 'https://api.featherless.ai/v1';

async function testMastra() {
  console.log('Testing Mastra Agent with Featherless...');
  try {
    const testAgent = new Agent({
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'You are a helpful assistant.',
      model: 'openai/Qwen/Qwen2.5-7B-Instruct'
    });

    const response = await testAgent.generate('Say hello in one word.');

    console.log('Response text:', response.text);
  } catch (err: any) {
    console.error('Mastra Test Error:', err.stack || err.message);
  }
}

testMastra();
