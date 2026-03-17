/**
 * OpenAI API 클라이언트
 * - chatgpt-4o-latest 모델 사용
 * - .env의 OPENAI_API_KEY 사용
 */
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'chatgpt-4o-latest';
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * OpenAI 채팅 완성 호출
 * @param {string} prompt - 사용자 프롬프트
 * @param {object} options - 추가 옵션
 * @returns {string} 생성된 텍스트
 */
export async function callOpenAI(prompt, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  const {
    systemPrompt = '당신은 반려동물 영양학 전문가 "멍냥닥터"입니다. 전문적이면서도 보호자가 이해하기 쉬운 글을 작성합니다.',
    temperature = 0.7,
    maxTokens = 3000,
  } = options;

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorData}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty response');
  }

  console.log(`[openai] 토큰 사용: prompt=${data.usage?.prompt_tokens}, completion=${data.usage?.completion_tokens}`);
  return content.trim();
}

// CLI test
if (process.argv[1]?.includes('openai-client')) {
  try {
    const result = await callOpenAI('강아지 사료 선택 팁을 3줄로 알려주세요.', { maxTokens: 200 });
    console.log('Result:', result);
    console.log('✅ openai-client.js OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}
