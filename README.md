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
│   ├── collect/                # 수집 엔진 — 국내외 커뮤니티/뉴스 크롤링
│   │   ├── gangsamo.js         # 강사모(네이버 카페) 크롤러
│   │   ├── godahang.js         # 고다행(네이버 카페) 크롤러
│   │   ├── dcgallery.js        # DC갤러리(강아지/고양이) 크롤러
│   │   ├── naver-news.js       # 네이버 뉴스 크롤러
│   │   ├── reddit.js           # Reddit 크롤러 (r/dogs, r/cats, r/AskVet 등)
│   │   └── scheduler.js        # 전체 크롤링 스케줄러
│   │
│   ├── analyze/                # 분석 엔진 — 트렌드 스코어링 및 주제 선정
│   │   ├── scorer.js           # 6개 요소 바이럴 스코어링 알고리즘
│   │   ├── keyword.js          # 네이버 키워드 검증
│   │   ├── cluster.js          # Jaccard 유사도 키워드 클러스터링
│   │   └── topic-selector.js   # 일일 주제 자동 선정
│   │
│   ├── create/                 # 제작 엔진 — 콘텐츠 자동 생성
│   │   ├── blog-expert.js      # 전문글 생성기
│   │   ├── blog-general.js     # 일반글 생성기
│   │   ├── image-gen.js        # AI 이미지 생성 (스텁)
│   │   ├── quality-check.js    # 품질 자동 검증
│   │   └── templates/
│   │       ├── expert.js       # 전문글 프롬프트 템플릿
│   │       └── general.js      # 일반글 프롬프트 템플릿
│   │
│   ├── publish/                # 배포 엔진 — 멀티채널 발행
│   │   ├── naver-blog.js       # 네이버 블로그 발행 (Puppeteer)
│   │   ├── instagram.js        # Instagram Graph API 발행 (스텁)
│   │   ├── queue.js            # 발행 큐 관리자
│   │   └── community.js        # 커뮤니티 답글 (스텁)
│   │
│   ├── track/                  # 추적 엔진 — 성과 모니터링
│   │   ├── blog-stats.js       # 네이버 블로그 조회수 크롤링
│   │   ├── reporter.js         # 일일/주간 텔레그램 리포트
│   │   ├── conversion.js       # 전환 추적 (bit.ly 단축 URL + CTA)
│   │   ├── funnel.js           # 퍼널 분석 (노출→클릭→관심→상담→구매)
│   │   └── social-stats.js     # SNS 통계 (Instagram 스텁 + YouTube)
│   │
│   ├── optimize/               # 최적화 엔진 (Phase 3 — 구현 예정)
│   │
│   ├── team/                   # 팀 협업 시스템
│   │   ├── approval.js         # 콘텐츠 승인 워크플로우
│   │   ├── notification.js     # 텔레그램 알림 템플릿 7종
│   │   └── auth.js             # 역할 기반 접근 제어 (RBAC)
│   │
│   └── shared/                 # 공통 모듈
│       ├── config.js           # 전역 설정
│       └── db.js               # SQLite DB 스키마 및 초기화
│
├── dashboard/                  # 웹 대시보드 (Express + Tailwind + Chart.js)
│   ├── server.js               # API 서버 (port 3200)
│   └── index.html              # 다크모드 SPA
│
├── cron/                       # 크론잡 엔트리포인트
│   ├── collect.js              # 크롤링 수집
│   ├── morning-post.js         # 09:00 전문글 발행
│   ├── afternoon-post.js       # 15:00 일반글 발행
│   └── daily-report.js         # 22:00 일일 리포트
│
└── data/                       # 데이터 디렉토리
    ├── mungnyang.db            # SQLite 메인 DB
    ├── raw/                    # 크롤링 원본
    ├── processed/              # 분석 결과
    ├── content/                # 생성된 콘텐츠
    └── reports/                # 성과 리포트
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

**API 엔드포인트 (Phase 1):**
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

## Phase 2: 제작 + 배포 ✅

### 목표
분석된 트렌딩 주제를 기반으로 콘텐츠를 자동 생성하고 멀티채널에 배포.

### 2.1 콘텐츠 제작 엔진 (src/create/)

#### blog-expert.js — 전문글 생성기

trending_topics에서 선정된 주제를 받아 전문가 블로그 글 초안을 생성합니다.

| 항목 | 설명 |
|------|------|
| **입력** | trending_topics 레코드 (keyword, cluster, score) |
| **처리** | raw_posts에서 커뮤니티 질문 5건 + Reddit 인사이트 3건 수집 → 프롬프트 조립 → 템플릿 기반 초안 생성 |
| **출력** | contents 테이블에 INSERT (status='draft', type='blog_expert') |
| **DB 관계** | `trending_topics.id → contents.topic_id`, `raw_posts` 조회 |

```bash
node src/create/blog-expert.js
```

#### blog-general.js — 일반글 생성기

커뮤니티 핫토픽 기반의 가볍고 친근한 블로그 글을 생성합니다. 구조는 blog-expert.js와 동일하되 프롬프트 톤이 다릅니다.

| 항목 | 설명 |
|------|------|
| **입력** | trending_topics 레코드 |
| **출력** | contents 테이블 (status='draft', type='blog_general') |

#### quality-check.js — 품질 자동 검증

생성된 글의 품질을 자동 검증합니다. `blog-expert.js` 내부에서 import하여 사용.

| 검증 항목 | 기준 |
|-----------|------|
| 글자 수 | config.quality.minChars ~ maxChars |
| 금지어 | config.quality.bannedWords 목록 매칭 |
| 키워드 밀도 | 0.5% ~ 3.0% (과도 삽입 방지) |

**반환:** issues 배열 (빈 배열이면 통과)

#### image-gen.js — AI 이미지 생성 (스텁)

draft 콘텐츠에 대해 이미지 생성을 시도합니다. 현재 API 미연동 상태로 null 반환.

> **설계 결정:** 이미지 생성 실패 시 스킵 (플레이스홀더 이미지 삽입 절대 금지). 블로그에 가짜 이미지가 올라가면 신뢰도가 떨어지므로 이미지 없이 발행하는 것이 낫다.

#### templates/ — 프롬프트 템플릿

- `expert.js`: 전문글 프롬프트 빌더 + 고정 CTA 문구 (카카오톡 오픈채팅 링크)
- `general.js`: 일반글 프롬프트 빌더

### 2.2 배포 엔진 (src/publish/)

#### naver-blog.js — 네이버 블로그 발행

Puppeteer로 네이버 블로그 에디터에 접속하여 콘텐츠를 발행합니다.

| 항목 | 설명 |
|------|------|
| **입력** | contents.id (status='approved') |
| **처리** | Puppeteer 로그인 → 에디터 오픈 → 본문 타이핑 → 발행 |
| **출력** | contents.status='published', contents.published_url 업데이트 |

> **설계 결정: innerHTML 대신 분할 타이핑 방식을 쓰는 이유**
>
> 네이버 블로그 에디터는 SPA로, innerHTML 직접 주입 시 에디터 내부 상태와 DOM이 불일치하여 발행 시 빈 글이 올라가거나 에디터가 프리즈되는 문제가 있다. 따라서 200자 단위로 clipboard paste하는 "분할 타이핑" 방식을 사용한다. 느리지만 안정적이다. (`CHUNK_SIZE=200`, 딜레이 300~600ms)

**재시도:** 최대 3회. 실패 시 contents.status='failed'.

#### instagram.js — Instagram 발행 (스텁)

Meta Graph API 비즈니스 계정 승인 대기 중. 구조만 구현.

| 항목 | 설명 |
|------|------|
| **입력** | contents.id (type='card_news', status='approved') |
| **출력** | 현재 스텁 — `{ success: false, error: 'Graph API 승인 대기' }` |

#### queue.js — 발행 큐 관리자

approved 상태의 콘텐츠를 타입별로 적절한 발행 함수에 디스패치합니다.

| 항목 | 설명 |
|------|------|
| **입력** | 없음 (DB에서 approved 콘텐츠 자동 조회) |
| **처리** | 타입별 매핑: blog_expert/blog_general → naver-blog, card_news → instagram |
| **출력** | 각 콘텐츠의 status를 published 또는 failed로 업데이트 |

> **설계 결정: dry-run이 기본인 이유**
>
> `--dry-run` 플래그 없이 실행하면 실제 블로그에 발행된다. 개발 중 실수로 테스트 글이 공개되는 것을 방지하기 위해 기본값을 dry-run으로 설정. 실제 발행 시에만 명시적으로 `--live` 플래그를 전달해야 한다.

```bash
# 테스트 (기본 — 실제 발행 안 함)
node src/publish/queue.js --dry-run

# 실제 발행
node src/publish/queue.js
```

#### community.js — 커뮤니티 답글 (스텁)

발행된 블로그 글 링크를 강사모/고다행 카페에 답글로 남기는 기능. 카페 API 인증 미확보로 스텁.

### 2.3 추적 엔진 확장 (src/track/)

Phase 1의 blog-stats.js, reporter.js에 추가된 모듈:

#### conversion.js — 전환 추적

| 항목 | 설명 |
|------|------|
| **입력** | 콘텐츠 URL + content_id |
| **처리** | bit.ly 단축 URL 생성 (API 키 없으면 로컬 카운터 스텁) → CTA 클릭 집계 |
| **출력** | performance 테이블에 cta_clicks, conversions 업데이트 |
| **DB 관계** | `contents.id → performance.content_id` |

#### funnel.js — 퍼널 분석

performance 테이블 데이터를 기반으로 5단계 퍼널을 계산합니다.

```
노출(views) → 클릭(clicks) → 관심/CTA(cta_clicks) → 상담(conversions) → 구매(purchases)
```

| 항목 | 설명 |
|------|------|
| **입력** | 기간 파라미터 (days, start/end) |
| **출력** | 각 단계별 수치 + 단계간 전환율 (%) |

#### social-stats.js — SNS 통계 수집

| 플랫폼 | 상태 | 수집 항목 |
|---------|------|-----------|
| Instagram | 스텁 (API 승인 대기) | likes, comments, impressions, reach |
| YouTube | 활성 | contents에서 youtube URL 파싱 → 조회수 수집 |

### 2.4 대시보드 추가 API (Phase 2)

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/funnel | 전환 퍼널 데이터 (days 파라미터) |
| GET | /api/cta-summary | CTA 클릭 요약 |
| GET | /api/pipeline | 콘텐츠 파이프라인 상태 (status×type 매트릭스) |

---

## Phase 3: 최적화 + 팀 확장 (진행 중)

### 목표
성과 데이터를 자동 수집하고, A/B 테스트와 패턴 학습으로 콘텐츠를 지속 개선. 팀 역할 기반 접근 제어 추가.

### 3.1 최적화 엔진 (src/optimize/) — 구현 예정

#### A/B 테스트 (ab-test.js — 예정)

| 항목 | 설명 |
|------|------|
| **입력** | 동일 주제의 2개 콘텐츠 (변수: 제목/CTA/발행시간) |
| **처리** | 양쪽 발행 → 3일간 성과 비교 → 승자 결정 |
| **출력** | ab_tests 테이블에 결과 기록, learned_rules에 패턴 추가 |
| **DB 관계** | `ab_tests.content_a_id, content_b_id → contents.id` |

A/B 테스트 가능 변수:
- **제목:** 질문형 vs 정보형
- **CTA:** 카카오톡 vs 전화번호 vs 폼링크
- **발행 시간대:** 오전 9시 vs 오후 3시 vs 저녁 8시

#### 학습 엔진 (learning.js — 예정)

performance 데이터에서 고성과 패턴을 자동 추출하여 `learned_rules` 테이블에 저장합니다.

| 항목 | 설명 |
|------|------|
| **입력** | performance + contents 테이블 조인 |
| **처리** | 조회수/전환율 상위 20% 콘텐츠의 공통 패턴 분석 |
| **출력** | learned_rules 테이블에 규칙 INSERT (JSON 형태) |

학습 규칙 예시:
```json
{ "type": "title_pattern", "rule": "질문형 제목이 정보형 대비 조회수 42% 높음", "confidence": 0.85 }
{ "type": "publish_time", "rule": "화요일 09:00 발행이 최고 성과", "confidence": 0.72 }
```

#### 재활용 엔진 (recycle.js — 예정)

고성과 콘텐츠를 재가공하여 새 콘텐츠로 만듭니다.

| 항목 | 설명 |
|------|------|
| **입력** | performance 상위 콘텐츠 |
| **처리** | 제목/도입부 변경 + 최신 데이터 반영 + 다른 채널 포맷 변환 |
| **출력** | contents 테이블에 새 draft INSERT (원본 참조 유지) |

### 3.2 팀 확장 (src/team/)

#### auth.js — 역할 기반 접근 제어 (RBAC)

4가지 역할과 권한을 관리합니다.

| 역할 | 라벨 | 권한 |
|------|------|------|
| ceo | CEO | 모든 권한 (`*`) |
| content_manager | 콘텐츠 매니저 | approve, reject, edit, view |
| marketer | 마케터 | view, ab_test, report |
| designer | 디자이너 | view, edit_image |

```javascript
import { hasPermission } from './auth.js';
hasPermission('marketer', 'approve');  // false
hasPermission('ceo', 'approve');       // true
```

### 3.3 크론잡 (cron/)

| 파일 | 스케줄 | 기능 |
|------|--------|------|
| collect.js | 매 3시간 | 전체 소스 크롤링 |
| morning-post.js | 매일 09:00 | 전문글 생성 + 발행 (TODO: OpenAI API 연동) |
| afternoon-post.js | 매일 15:00 | 일반글 생성 + 발행 |
| daily-report.js | 매일 22:00 | 텔레그램 일일 리포트 |

**전체 파이프라인 수동 실행:**
```bash
# 1단계: 수집
node src/collect/scheduler.js

# 2단계: 분석 + 주제 선정
node src/analyze/topic-selector.js

# 3단계: 콘텐츠 생성
node src/create/blog-expert.js
node src/create/blog-general.js

# 4단계: 품질 검증 (생성 시 자동 실행됨)

# 5단계: 발행 (dry-run 먼저!)
node src/publish/queue.js --dry-run
node src/publish/queue.js          # 실제 발행

# 6단계: 대시보드에서 성과 확인
node dashboard/server.js
```

### 3.4 대시보드 추가 API (Phase 3 — 예정)

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/optimize/ab-tests | A/B 테스트 현황 |
| GET | /api/optimize/rules | 학습된 규칙 목록 |
| POST | /api/pipeline/run | 전체 파이프라인 수동 실행 |

---

## DB 테이블 관계도

```
raw_posts ──(keyword 매칭)──→ trending_topics
                                    │
                                    ↓ topic_id
                                contents ←──(content_id)── performance
                                    │                           ↑
                                    ├──(id)── ab_tests     funnel.js가 집계
                                    │         (content_a_id, content_b_id)
                                    │
                                    └──(id)── team_logs
                                              (content_id)

learned_rules ← ab_tests 결과 + performance 패턴 분석
```

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
| BITLY_TOKEN | bit.ly API 토큰 | 전환 추적 (없으면 스텁) |
| INSTAGRAM_TOKEN | Instagram Graph API 토큰 | Instagram 발행 (없으면 스텁) |

## 기술 스택

- **Runtime:** Node.js (ES Modules)
- **DB:** SQLite3 (better-sqlite3, WAL mode)
- **크롤링:** cheerio + node-fetch (경량), Puppeteer (블로그 발행)
- **대시보드:** Express + Tailwind CSS + Chart.js
- **배포 자동화:** Puppeteer (네이버 블로그), REST API (Instagram/YouTube)

---

## 라이선스

Private — 내부 사용 전용
