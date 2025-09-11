# 🛠️ StockPulse 개발 가이드

## 📋 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- Python 3.11+
- Docker (선택사항)
- Git

### 프로젝트 구조
```
StockPulse/
├── frontend/          # Next.js 프론트엔드
├── backend/           # Python FastAPI AI 서버
├── data-collector/    # Node.js 데이터 수집기
├── supabase/          # Supabase 설정 및 마이그레이션
└── docs/             # 문서
```

## 🚀 로컬 개발 시작하기

### 1. 저장소 클론
```bash
git clone <repository-url>
cd StockPulse
```

### 2. 의존성 설치
```bash
# 루트 의존성
npm install

# 프론트엔드 의존성
cd frontend && npm install && cd ..

# 백엔드 의존성
cd backend && pip install -r requirements.txt && cd ..

# 데이터 수집기 의존성
cd data-collector && npm install && cd ..
```

### 3. 환경 변수 설정
각 디렉토리의 `env.example` 파일을 참고하여 `.env.local` 파일 생성:

```bash
# 루트
cp env.example .env.local

# 프론트엔드
cp frontend/env.example frontend/.env.local

# 백엔드
cp backend/env.example backend/.env.local

# 데이터 수집기
cp data-collector/env.example data-collector/.env.local
```

### 4. Supabase 로컬 설정
```bash
# Supabase CLI 설치
npm install -g supabase

# 로컬 Supabase 시작
supabase start

# 마이그레이션 실행
supabase db reset
```

### 5. 개발 서버 실행

#### Docker Compose 사용 (권장)
```bash
docker-compose up -d
```

#### 개별 서비스 실행
```bash
# 터미널 1: 프론트엔드
cd frontend && npm run dev

# 터미널 2: 백엔드
cd backend && python -m uvicorn app.main:app --reload

# 터미널 3: 데이터 수집기
cd data-collector && npm run dev
```

## 🔧 개발 도구

### 프론트엔드 (Next.js)
- **개발 서버**: `http://localhost:3000`
- **타입 체크**: `npm run type-check`
- **린팅**: `npm run lint`
- **빌드**: `npm run build`

### 백엔드 (FastAPI)
- **개발 서버**: `http://localhost:8000`
- **API 문서**: `http://localhost:8000/docs`
- **리로드**: 자동 리로드 활성화

### 데이터 수집기 (Node.js)
- **개발 모드**: `npm run dev`
- **개별 수집기**: `npm run collect-stocks`, `npm run collect-news`

## 📊 데이터베이스 개발

### Supabase 로컬 개발
```bash
# 로컬 Supabase 시작
supabase start

# 데이터베이스 리셋
supabase db reset

# 마이그레이션 생성
supabase migration new <migration_name>

# Edge Functions 배포
supabase functions deploy <function_name>
```

### 스키마 변경
1. `supabase/migrations/` 디렉토리에 새 마이그레이션 파일 생성
2. SQL 스크립트 작성
3. `supabase db reset` 실행하여 변경사항 적용

## 🤖 AI 모델 개발

### 감성 분석 모델
- **FinBERT**: 금융 텍스트 전용 BERT 모델
- **TextBlob**: 간단한 감성 분석
- **VADER**: 소셜 미디어 텍스트 감성 분석

### 기술적 분석
- **TA-Lib**: 기술적 지표 계산
- **Pandas**: 데이터 처리
- **NumPy**: 수치 계산

### 모델 테스트
```bash
cd backend
python -m pytest tests/
```

## 📈 데이터 수집 개발

### 새로운 데이터 소스 추가
1. `data-collector/src/collectors/` 디렉토리에 새 수집기 생성
2. `data-collector/src/index.js`에 스케줄링 추가
3. 환경 변수 설정

### 스케줄링 설정
```javascript
// 매시간 실행
cron.schedule('0 * * * *', async () => {
  // 작업 실행
});

// 매일 7시 실행
cron.schedule('0 7 * * *', async () => {
  // 작업 실행
});
```

## 🧪 테스트

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

### 백엔드 테스트
```bash
cd backend
pytest
```

### 통합 테스트
```bash
# 전체 시스템 테스트
npm run test:integration
```

## 🐛 디버깅

### 로그 확인
- **프론트엔드**: 브라우저 개발자 도구
- **백엔드**: 터미널 출력 또는 로그 파일
- **데이터 수집기**: 콘솔 출력

### 일반적인 문제
1. **포트 충돌**: 다른 서비스가 같은 포트 사용
2. **환경 변수**: `.env.local` 파일 확인
3. **의존성**: 패키지 버전 호환성 확인

## 📝 코딩 컨벤션

### 프론트엔드 (TypeScript/React)
- 함수형 컴포넌트 사용
- TypeScript 타입 정의
- TailwindCSS 클래스 사용
- ESLint 규칙 준수

### 백엔드 (Python/FastAPI)
- PEP 8 스타일 가이드 준수
- 타입 힌트 사용
- Pydantic 모델 사용
- 비동기 함수 활용

### 데이터 수집기 (Node.js)
- ES6+ 문법 사용
- 에러 핸들링 필수
- 로깅 추가
- Rate limiting 고려

## 🔄 Git 워크플로우

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 업데이트
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 📦 배포 전 체크리스트

- [ ] 모든 테스트 통과
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 실행
- [ ] API 문서 업데이트
- [ ] 로그 레벨 설정
- [ ] 보안 설정 확인
- [ ] 성능 테스트 완료

## 🆘 문제 해결

### 자주 발생하는 문제
1. **포트 충돌**: `lsof -ti:3000 | xargs kill -9`
2. **의존성 오류**: `rm -rf node_modules && npm install`
3. **Python 패키지 오류**: `pip install --upgrade pip`

### 도움 요청
- GitHub Issues 생성
- 팀 슬랙 채널 문의
- 코드 리뷰 요청
