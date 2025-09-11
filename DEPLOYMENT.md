# 🚀 StockPulse 배포 가이드

## 📋 배포 개요

StockPulse는 다음 3개의 서비스로 구성됩니다:
- **Frontend**: Vercel (Next.js)
- **Backend**: Railway/Render (Python FastAPI)
- **Database**: Supabase (PostgreSQL)

## 🛠️ 배포 단계

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 API 키 복사
3. SQL 에디터에서 `supabase/migrations/20240101000001_initial_schema.sql` 실행
4. Edge Functions 배포:
   ```bash
   supabase functions deploy daily-analysis
   supabase functions deploy data-collector
   ```

### 2. AI 서버 배포 (Railway)

1. [Railway](https://railway.app)에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. `backend` 폴더를 루트로 설정
4. 환경 변수 설정:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   YAHOO_FINANCE_API_KEY=your_yahoo_finance_api_key
   GOOGLE_NEWS_API_KEY=your_google_news_api_key
   ```
5. 배포 후 URL 복사 (예: `https://your-app.railway.app`)

### 3. 프론트엔드 배포 (Vercel)

1. [Vercel](https://vercel.com)에서 새 프로젝트 생성
2. GitHub 저장소 연결
3. 루트 디렉토리를 `frontend`로 설정
4. 환경 변수 설정:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_AI_SERVER_URL=https://your-app.railway.app
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   YAHOO_FINANCE_API_KEY=your_yahoo_finance_api_key
   GOOGLE_NEWS_API_KEY=your_google_news_api_key
   CRON_SECRET=your_random_secret_string
   ```
5. 배포 후 Vercel Cron 설정:
   - `0 7 * * *` → `/api/cron/daily-analysis`
   - `0 */6 * * *` → `/api/cron/data-collection`

### 4. 데이터 수집기 배포 (선택사항)

로컬에서 실행하거나 별도 서버에 배포:

```bash
cd data-collector
npm install
npm start
```

## 🔧 환경 변수 설정

### Supabase
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_ANON_KEY`: Supabase 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키

### 외부 API
- `YAHOO_FINANCE_API_KEY`: Yahoo Finance API 키
- `GOOGLE_NEWS_API_KEY`: Google News API 키

### 서비스 간 통신
- `AI_SERVER_URL`: AI 서버 URL
- `CRON_SECRET`: Vercel Cron 인증용 시크릿

## 📊 모니터링

### Vercel
- 배포 상태 확인
- 함수 실행 로그 모니터링
- Cron 작업 상태 확인

### Railway
- 서비스 상태 모니터링
- 로그 확인
- 리소스 사용량 모니터링

### Supabase
- 데이터베이스 성능 모니터링
- Edge Functions 실행 로그
- API 사용량 확인

## 🔄 자동화 설정

### Cron 작업
- **매일 7시**: 일일 분석 실행
- **6시간마다**: 데이터 수집 실행

### 데이터 흐름
1. Cron → 데이터 수집 (주가, 뉴스)
2. Cron → AI 분석 실행
3. 결과 → Supabase 저장
4. 프론트엔드 → Supabase에서 데이터 조회

## 🚨 문제 해결

### 일반적인 문제
1. **환경 변수 누락**: 모든 필수 환경 변수가 설정되었는지 확인
2. **API 키 오류**: 외부 API 키가 유효한지 확인
3. **네트워크 오류**: 서비스 간 통신이 정상인지 확인

### 로그 확인
- Vercel: Functions 탭에서 로그 확인
- Railway: Deployments 탭에서 로그 확인
- Supabase: Logs 탭에서 Edge Functions 로그 확인

## 📈 성능 최적화

### 프론트엔드
- 이미지 최적화
- 코드 스플리팅
- 캐싱 전략

### 백엔드
- 데이터베이스 인덱스 최적화
- API 응답 캐싱
- 배치 처리 최적화

### 데이터베이스
- 정기적인 데이터 정리
- 인덱스 모니터링
- 쿼리 성능 분석

## 🔒 보안 고려사항

1. **API 키 보호**: 환경 변수로만 관리
2. **CORS 설정**: 프로덕션에서 적절한 도메인 설정
3. **Rate Limiting**: API 호출 제한 설정
4. **데이터 검증**: 입력 데이터 검증 및 필터링

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일 확인
2. 환경 변수 설정 확인
3. 서비스 상태 확인
4. 네트워크 연결 확인
