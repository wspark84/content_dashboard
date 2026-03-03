import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: resolve(__dirname, '../../.env') });

export const config = {
  // 프로젝트 루트
  root: resolve(__dirname, '../..'),
  dataDir: resolve(__dirname, '../../data'),
  
  // 네이버 블로그
  blog: {
    id: 'lifelogics',
    username: process.env.NAVER_USERNAME || 'lifelogics',
    password: process.env.NAVER_PASSWORD,
  },
  
  // 크롤링 소스
  sources: {
    gangsamo: {
      url: 'https://cafe.naver.com/dogpalza',
      cafeId: '10050146',
      boards: {
        popular: 0,        // 인기글
        health: 50,        // 건강/질병
        food: 51,          // 사료/간식
      },
      intervalMs: 3 * 60 * 60 * 1000, // 3시간
    },
    godahang: {
      url: 'https://cafe.naver.com/godahang',
      cafeId: '28646498',
      boards: {
        popular: 0,
        health: 30,
        food: 31,
      },
      intervalMs: 3 * 60 * 60 * 1000,
    },
    reddit: {
      subreddits: ['dogs', 'cats', 'petfood', 'AskVet', 'rawpetfood'],
      intervalMs: 6 * 60 * 60 * 1000,
    },
    dcGallery: {
      galleries: ['dog', 'cat'],
      intervalMs: 3 * 60 * 60 * 1000,
    },
    naverNews: {
      keywords: ['반려동물', '강아지 사료', '고양이 사료', '동물병원', '펫푸드', '사료 리콜'],
      intervalMs: 2 * 60 * 60 * 1000,
    },
    naverTrend: {
      keywords: ['강아지 사료', '고양이 사료', '반려동물 건강', '강아지 알러지'],
      intervalMs: 60 * 60 * 1000,
    },
    pubmed: {
      queries: ['canine nutrition', 'feline diet', 'pet food safety'],
      intervalMs: 24 * 60 * 60 * 1000,
    },
    youtube: {
      // 기존 유튜브 트렌드 시스템 연동
      sheetId: '1PEuYs00ONYrFaAtj8Yg69Gdlduk3t3mg2GudbAGbzlg',
    }
  },

  // 스코어링 가중치
  scoring: {
    communityHeat: 0.30,
    searchDemand: 0.25,
    globalTrend: 0.15,
    feedMatch: 0.15,
    timeliness: 0.10,
    competitionGap: 0.05,
  },

  // 사료 스프레드시트
  feedSheet: {
    id: '1EIJOmZVaCMWcrYKP7M0mhSEzmwMtealslfiqwC3WjR8',
  },

  // 네이버 API
  naver: {
    clientId: process.env.NCP_CLIENT_ID || 'k9hnporr2z',
    clientSecret: process.env.NCP_CLIENT_SECRET || 'pZtV7K7R8HRGMdjdzsTRVBhjh3e9Bp6yGgt2YClR',
  },

  // 발행 설정
  publish: {
    blog: {
      expertTime: '09:00',
      generalTime: '15:00',
    },
    cardNews: {
      days: [1, 3, 5, 6], // 월수금토
      time: '11:00',
    },
    shortVideo: {
      days: [1, 2, 3, 5, 6], // 월화수금토
      time: '18:00',
    },
  },

  // 품질 기준
  quality: {
    minChars: 1500,
    maxChars: 2500,
    keywordDensity: { min: 0.02, max: 0.03 },
    bannedWords: ['수의사 출신', '[IMAGE:', '[IMAGE]'],
    maxSentencesPerParagraph: 3,
  },
};
