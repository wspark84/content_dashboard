/**
 * 이미지 생성 — fal.ai Flux API 연동
 * .env의 FAL_KEY 사용
 */
import { getDb, closeDb } from '../shared/db.js';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../../.env') });

const FAL_KEY = process.env.FAL_KEY;
const FAL_API_URL = 'https://queue.fal.run/fal-ai/flux/schnell';
const IMAGE_DIR = resolve(__dirname, '../../data/images');

/**
 * fal.ai Flux로 이미지 생성
 */
async function generateImage(prompt) {
  if (!FAL_KEY) {
    console.log(`[image-gen] FAL_KEY 미설정 — 이미지 생성 스킵`);
    return null;
  }

  try {
    // 큐에 요청 제출
    // 1) 큐에 제출
    const submitRes = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      throw new Error(`fal.ai API error (${submitRes.status}): ${errText}`);
    }

    let data = await submitRes.json();
    
    // 2) 큐 모드면 폴링
    if (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
      const responseUrl = data.response_url;
      if (!responseUrl) throw new Error('No response_url in queue response');
      
      for (let i = 0; i < 30; i++) { // 최대 60초 대기
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(responseUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        if (!pollRes.ok) continue;
        const pollData = await pollRes.json();
        if (pollData.images) { data = pollData; break; }
        if (pollData.status === 'COMPLETED') { data = pollData; break; }
      }
    }

    // 3) 이미지 URL 추출
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) {
      console.log('[image-gen] fal.ai 응답에 이미지 URL 없음:', JSON.stringify(data).slice(0, 200));
      return null;
    }

    // 이미지 다운로드 및 저장
    if (!existsSync(IMAGE_DIR)) {
      mkdirSync(IMAGE_DIR, { recursive: true });
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Image download failed: ${imageRes.status}`);
    
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const filename = `img_${Date.now()}.png`;
    const filepath = resolve(IMAGE_DIR, filename);
    writeFileSync(filepath, buffer);

    console.log(`[image-gen] 이미지 저장: ${filepath}`);
    return filepath;
  } catch (err) {
    console.error(`[image-gen] 생성 실패:`, err.message);
    return null;
  }
}

/**
 * draft 콘텐츠에 대해 이미지 생성 시도
 */
export async function generateImagesForDrafts() {
  const db = getDb();
  const drafts = db.prepare(`
    SELECT c.id, c.title, t.keyword
    FROM contents c
    LEFT JOIN trending_topics t ON c.topic_id = t.id
    WHERE c.status IN ('draft', 'review') AND (c.images IS NULL OR c.images = '[]')
  `).all();

  if (!drafts.length) {
    console.log('[image-gen] 이미지가 필요한 draft 없음');
    return [];
  }

  const update = db.prepare(`UPDATE contents SET images = ? WHERE id = ?`);
  const results = [];

  for (const draft of drafts) {
    const keyword = draft.keyword || draft.title;
    const prompt = `A cute, warm illustration of a pet (dog or cat) related to "${keyword}". Soft pastel colors, friendly style, suitable for a Korean pet care blog. No text in image.`;
    
    const imagePath = await generateImage(prompt);
    if (imagePath) {
      update.run(JSON.stringify([imagePath]), draft.id);
      console.log(`[image-gen] #${draft.id}: 이미지 저장 완료`);
      results.push({ contentId: draft.id, imagePath });
    } else {
      console.log(`[image-gen] #${draft.id}: 스킵 (생성 실패 또는 API 키 미설정)`);
    }
  }

  console.log(`[image-gen] ${results.length}/${drafts.length}건 이미지 생성 완료`);
  return results;
}

export { generateImage };

// CLI
if (process.argv[1]?.includes('image-gen')) {
  try {
    const results = await generateImagesForDrafts();
    console.log(`✅ image-gen.js OK — ${results.length}건 처리`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
