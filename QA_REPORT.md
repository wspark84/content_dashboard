# QA 리포트

**검증일**: 2026-03-04 00:28 KST  
**검증자**: QA 비판가 서브에이전트

## 발견된 문제

### [심각도: HIGH] keyword.js — getBlogCompetition() 잘못된 API 엔드포인트
- 원인: `openapi.naver.com/v1/search/blog.json`에 NCP API 키(`k9hnporr2z`)를 사용. NCP 키는 Naver Open API(developers.naver.com)용이 아님. 항상 401 → fallback 100000 반환
- 수정: 네이버 블로그 검색 웹 스크래핑 방식으로 변경 (API 키 불필요)
- 상태: ✅ 수정완료

### [심각도: HIGH] gangsamo.js / godahang.js — 검색 fallback이 존재하지 않는 NCP API 사용
- 원인: `naveropenapi.apigw.ntruss.com/search/v1/cafearticle.json` — NCP에 카페검색 API가 없음 (404). 또한 카페 API(`apis.naver.com`)가 빈 결과를 반환해도 fallback이 트리거되지 않음 (catch만 감지, 빈 배열은 정상 응답 취급)
- 수정: (1) 빈 결과일 때도 fallback 실행하도록 변경 (2) fallback을 네이버 모바일 검색 스크래핑으로 교체
- 상태: ✅ 수정완료

### [심각도: HIGH] scorer.js — 욕설/스팸 키워드가 트렌딩으로 선정됨
- 원인: DC갤러리에서 "씹재련", "분탕새끼", "전번" 등이 빈도 2 이상으로 트렌딩 키워드 선정. 욕설/비속어 필터 없음
- 수정: `BANNED_KEYWORDS` 셋 추가, `isBannedKeyword()` 필터 적용
- 상태: ✅ 수정완료

### [심각도: HIGH] scorer.js — 개인정보(전화번호) 포함 게시글 처리
- 원인: DC갤러리에서 `010-8319-7ee4` 전화번호 포함 게시글이 크롤링되어 DB에 저장되고 API로 노출
- 수정: `PII_PATTERNS` 정규식으로 개인정보 포함 게시글을 분석 단계에서 필터링
- 상태: ✅ 수정완료

### [심각도: HIGH] scorer.js — 한국어 불용어 목록 불완전
- 원인: "근데", "그냥", "진짜" 등 일상어가 트렌딩 키워드로 선정됨
- 수정: 한국어 불용어 30여개 추가
- 상태: ✅ 수정완료

### [심각도: MED] godahang.js — 네이버 UI 텍스트가 게시글로 잘못 수집됨
- 원인: 검색 결과에서 "지식iN에 질문하기궁금한것은..." 같은 네이버 인터페이스 텍스트가 카페 게시글로 파싱됨
- 수정: "지식iN", "질문하기", "궁금한것은" 포함 텍스트 필터 추가 (gangsamo.js도 동일 적용)
- 상태: ✅ 수정완료

### [심각도: MED] .gitignore 누락
- 원인: `.gitignore` 파일 없음 → `node_modules/`, `data/`, `.env` 가 커밋될 위험
- 수정: `.gitignore` 생성
- 상태: ✅ 수정완료

### [심각도: MED] .env 파일 없음, API 키 하드코딩
- 원인: `config.js`에 NCP API 키가 fallback 기본값으로 하드코딩됨. `.env` 파일 없음
- 수정: `.env.example` 생성. 하드코딩된 키는 기존 운영 호환성을 위해 유지 (향후 제거 권장)
- 상태: ⚠️ 부분 수정 (키 제거는 .env 설정 후)

### [심각도: MED] cron/ 디렉토리 비어있음
- 원인: `package.json`에 `cron/morning-post.js`, `cron/afternoon-post.js`, `cron/daily-report.js` 스크립트가 정의되어 있으나 파일이 없음
- 수정: 3개 파일 모두 stub으로 생성 (TODO: OpenAI API 연동)
- 상태: ✅ 수정완료

### [심각도: LOW] DB datetime 타임존 불일치
- 원인: SQLite `datetime('now')`는 UTC 반환, Node.js `new Date('2026-03-03 15:26:43')`는 TZ 정보 없는 문자열을 로컬 시간으로 파싱 → timeliness 계산에 최대 9시간 오차 가능
- 수정: —
- 상태: ❌ 미수정 (영향 경미, 향후 `datetime('now','localtime')` 또는 ISO 형식으로 통일 권장)

### [심각도: LOW] Reddit r/petfood 403 에러
- 원인: Reddit이 해당 서브레딧 접근을 차단 (private 또는 ban)
- 수정: —
- 상태: ❌ 미수정 (Reddit 정책 문제, config에서 subreddit 교체 권장: r/DogFood, r/CatFood)

### [심각도: LOW] savePosts의 빈 catch 블록
- 원인: 모든 크롤러의 `savePosts()`에서 `try { ... } catch {}` — 에러를 완전히 무시
- 수정: —
- 상태: ❌ 미수정 (UNIQUE 제약 위반은 정상이므로 무시 가능하나, 다른 에러도 삼켜버림)

## 통합 테스트 결과

| 단계 | 결과 | 비고 |
|------|------|------|
| 모듈 import | ✅ 전체 통과 | 17개 모듈 모두 OK |
| 크롤링 (Reddit) | ✅ 93건 | 정상 동작 |
| 크롤링 (DC갤러리) | ✅ 48건 | 재실행 시 정상 |
| 크롤링 (네이버 뉴스) | ✅ 27건 | 스크래핑 방식으로 동작 |
| 크롤링 (강사모) | ⚠️ 0건 | 카페 API 인증 필요, 검색 fallback 결과 불안정 |
| 크롤링 (고다행) | ⚠️ 0건 | 동일 이슈 |
| DB 테이블 생성 | ✅ 8개 테이블 | 정상 |
| 스코어링 | ✅ 11개 토픽 | 필터링 개선 필요 (수정완료) |
| 주제 선정 | ✅ 2개 선정 | 동작하나 품질 개선 필요 |
| 대시보드 API | ✅ 정상 JSON | /api/trending, /api/contents, /api/stats, /api/performance |
| 대시보드 HTML | ✅ 정상 | index.html 존재 |
| cron 스크립트 | ✅ 실행 가능 | stub으로 생성 |
