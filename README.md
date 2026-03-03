# 🔥 멍냥바이럴 (MungNyang Viral Engine)

반려동물 콘텐츠 통합 바이럴 플랫폼

> **트렌드 감지 → 콘텐츠 생성 → 멀티채널 배포 → 성과 분석 → 자동 최적화**

---

## 아키텍처 개요

```
[1. 수집 COLLECT] → [2. 분석 ANALYZE] → [3. 제작 CREATE] → [4. 배포 PUBLISH]
                                                                     ↓
                                          [6. 최적화 OPTIMIZE] ← [5. 추적 TRACK]
                                                    ↕
                                          [7. 팀 협업 TEAM]
```

## 프로젝트 구조

```
mungnyang-viral/
├── src/
│   ├── collect/           # 수집 엔진 — 국내외 커뮤니티/뉴스 크롤링
│   │   ├── gangsamo.js    # 강사모(네이버 카페) 크롤러
│   │   ├── godahang.js    # 고다행(네이버 카페) 크롤러
│   │   ├── dcgallery.js   # DC갤러리(강아지/고양이) 크롤러
│   │   ├── naver-news.js  # 네이버 뉴스 크롤러
│   │   ├── reddit.js      # Reddit 크롤러 (r/dogs, r/cats, r/AskVet 등)
│   │   └── scheduler.js   # 전체 크롤링 스케줄러
│   │
│   ├── analyze/           # 분석 엔진 — 트렌드 스코어링 및 주제 선정
│   │   ├── scorer.js      # 6개 요소 바이럴 스코어링 알고리즘
│   │   ├── keyword.js     # 네이버 키워드 검증 (자동완성/검색량/경쟁도)
│   │   ├── cluster.js     # Jaccard 유사도 키워드 클러스터링
│   │   └── topic-selector.js  # 일일 주제 자동 선정 (전문글/일반글)
│   │
│   ├── create/            # 제작 엔진 — 콘텐츠 자동 생성 (Phase 2)
│   ├── publish/           # 배포 엔진 — 멀티채널 발행 (Phase 2)
│   │
│   ├── track/             # 추적 엔진 — 성과 모니터링
│   │   ├── blog-stats.js  # 네이버 블로그 조회수 크롤링
│   │   └── reporter.js    # 일일/주간 텔레그램 리포트 생성
│   │
│   ├── optimize/          # 최적화 엔진 — A/B 테스트 및 학습 (Phase 3)
│   │
│   ├── team/              # 팀 협업 시스템
│   │   ├── approval.js    # 콘텐츠 승인 워크플로우 (draft→review→approved→published)
│   │   └── notification.js # 텔레그램 알림 템플릿 7종
│   │
│   └── shared/            # 공통 모듈
│       ├── config.js      # 전역 설정 (크롤링 소스, 스코어링 가중치, 발행 스케줄)
│       └── db.js          # SQLite DB 스키마 및 초기화
│
├── dashboard/             # 웹 대시보드 (Express + Tailwind + Chart.js)
│   ├── server.js          # API 서버 (port 3200)
│   └── index.html         # 다크모드 SPA (트렌드/콘텐츠큐/성과/팀활동)
│
├── cron/                  # 크론잡 엔트리포인트
│   ├── morning-post.js    # 09:00 전문글 발행
│   ├── afternoon-post.js  # 15:00 일반글 발행
│   └── daily-report.js    # 22:00 일일 리포트
│
└── data/                  # 데이터 디렉토리
    ├── mungnyang.db       # SQLite 메인 DB
    ├── raw/               # 크롤링 원본
    ├── processed/         # 분석 결과
    ├── content/           # 생성된 콘텐츠
    └── reports/           # 성과 리포트
```

---

## Phase 1: 수집 + 분석 + 인프라 ✅

### 목표
트렌드 데이터를 자동 수집하고, 바이럴 가능성을 스코어링하여, 팀이 대시보드에서 확인할 수 있는 기반 구축.

### 1.1 수집 엔진 (src/collect/)

6개 소스에서 반려동물 관련 게시글을 자동 크롤링합니다.

| 소스 | 파일 | 방식 | 수집 주기 |
|------|------|------|----------|
| 강사모 | gangsamo.js | 네이버 카페 API → 웹검색 fallback | 3시간 |
| 고다행 | godahang.js | 네이버 카페 API → 웹검색 fallback | 3시간 |
| DC갤러리 | dcgallery.js | 모바일 페이지 파싱 (cheerio) | 3시간 |
| 네이버 뉴스 | naver-news.js | 모바일 검색 파싱 | 2시간 |
| Reddit | reddit.js | JSON API (인증 불필요) | 6시간 |
| 유튜브 트렌드 | (기존 시스템 연동) | YouTube Data API | 24시간 |

**실행:**
```bash
node src/collect/scheduler.js
```

**데이터 흐름:**
```
외부 소스 → 크롤러 → raw_posts 테이블 (중복 자동 제거)
```

**알려진 제약:**
- 강사모/고다행은 카페 API 인증 없이는 웹검색 fallback 사용 (정확도 낮음)
- Reddit r/petfood는 private 서브레딧으로 접근 불가
- 네이버 카페 직접 크롤링은 Naver Developers API 키 발급 후 안정화 예정

### 1.2 분석 엔진 (src/analyze/)

수집된 게시글에서 키워드를 추출하고, 6개 요소로 바이럴 스코어를 산출합니다.

**스코어링 공식:**
```
바이럴 스코어 = (커뮤니티 열기 × 0.30)    ← 조회수, 댓글, 좋아요
              + (검색 수요 × 0.25)        ← 네이버 검색량
              + (해외 트렌드 × 0.15)      ← Reddit upvotes
              + (사료 연결성 × 0.15)      ← 사료 관련 키워드 매칭
              + (시의성 × 0.10)           ← 최근 게시물 보너스
              + (경쟁 공백 × 0.05)        ← 블로그 검색 경쟁도 역수
```

**키워드 클러스터링:** Jaccard 유사도 기반으로 유사 키워드를 그룹화.
- 예: "강아지 알러지", "강아지 피부", "강아지 가려움" → 클러스터: "강아지/알러지/피부"

**주제 선정:** 매일 스코어 상위 2개를 자동 선정 (1개 전문글, 1개 일반글).

**실행:**
```bash
node src/analyze/topic-selector.js
```

### 1.3 팀 대시보드 (dashboard/)

Express 기반 웹 대시보드. 팀 전원이 트렌드와 콘텐츠 현황을 실시간으로 확인.

**실행:**
```bash
node dashboard/server.js
# → http://localhost:3200
```

**API 엔드포인트:**
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/trending | 오늘의 트렌딩 주제 목록 |
| GET | /api/contents | 콘텐츠 큐 (상태별 필터) |
| GET | /api/performance | 성과 요약 |
| GET | /api/team | 팀 활동 로그 |
| GET | /api/stats | 전체 통계 |
| POST | /api/contents/:id/approve | 콘텐츠 승인 |
| POST | /api/contents/:id/reject | 콘텐츠 반려 |

**UI 기능:**
- 실시간 트렌드 레이더 (소스별 수집 현황)
- 콘텐츠 큐 (승인/반려 버튼)
- 성과 차트 (일별 조회수, 전환율)
- 팀 활동 타임라인
- 1분 자동 갱신, 다크모드

### 1.4 승인 워크플로우 (src/team/)

콘텐츠 상태 관리: `draft → review → approved → published → failed`

모든 승인/반려 활동은 `team_logs` 테이블에 기록됩니다.

### 1.5 DB 스키마 (src/shared/db.js)

SQLite (WAL 모드) 7개 테이블:
- `raw_posts` — 크롤링 원본 게시글
- `trending_topics` — 스코어링된 트렌딩 주제
- `contents` — 생성된 콘텐츠
- `performance` — 성과 추적
- `ab_tests` — A/B 테스트
- `team_logs` — 팀 활동 로그
- `learned_rules` — 자동 학습 규칙

### 1.6 품질 보증 (QA)

전체 코드에 대해 QA 검증 완료:
- 7건 버그 수정 (키워드 API 오류, 크롤러 fallback, 스팸/욕설 필터 등)
- 상세 내용: QA_REPORT.md 참조

---

## Phase 2: 제작 + 배포 (진행 예정)

### 목표
분석된 트렌딩 주제를 기반으로 콘텐츠를 자동 생성하고 멀티채널에 배포.

### 구현 예정
- `src/create/blog-expert.js` — 전문글 생성 (해외 연구 + 커뮤니티 질문 결합)
- `src/create/blog-general.js` — 일반글 생성 (커뮤니티 핫토픽 기반)
- `src/create/card-news.js` — 카드뉴스 8장 자동 생성
- `src/create/image-gen.js` — AI 이미지 생성 (Imagen API)
- `src/create/quality-check.js` — 품질 자동 검증 (글자수/키워드밀도/금지어)
- `src/publish/naver-blog.js` — 네이버 블로그 발행 (기존 naver-blog-poster 통합)
- `src/publish/instagram.js` — Instagram Graph API 발행
- `src/publish/queue.js` — 발행 큐 관리

---

## Phase 3: 추적 + 최적화 (예정)

### 목표
성과 데이터를 자동 수집하고, A/B 테스트와 패턴 학습으로 콘텐츠를 지속 개선.

### 구현 예정
- 블로그/SNS 조회수 자동 수집
- 카카오톡 상담 전환 추적 (bit.ly 단축 URL)
- A/B 테스트 자동화 (제목/CTA/시간대)
- 고성과 콘텐츠 재활용 엔진
- 자동 학습 루프 (성과 → 규칙 업데이트 → 품질 향상)

---

## 설치 및 실행

```bash
# 의존성 설치
cd mungnyang-viral
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에 API 키 입력

# 크롤링 실행
node src/collect/scheduler.js

# 분석 실행
node src/analyze/topic-selector.js

# 대시보드 실행
node dashboard/server.js
```

## 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| NAVER_PASSWORD | 네이버 블로그 비밀번호 | 발행 시 |
| NCP_CLIENT_ID | 네이버 클라우드 API ID | 뉴스 크롤링 |
| NCP_CLIENT_SECRET | 네이버 클라우드 API Secret | 뉴스 크롤링 |

## 기술 스택

- **Runtime:** Node.js (ES Modules)
- **DB:** SQLite3 (better-sqlite3, WAL mode)
- **크롤링:** cheerio + node-fetch (경량), Puppeteer (필요 시)
- **대시보드:** Express + Tailwind CSS + Chart.js
- **배포 자동화:** Puppeteer (네이버 블로그), REST API (Instagram/YouTube)

---

## 라이선스

Private — 내부 사용 전용
