# YellowTalk 배포 가이드

이 가이드는 Vercel과 Supabase를 사용하여 YellowTalk를 프로덕션에 배포하는 상세한 지침을 제공합니다.

## 🏗 아키텍처 개요

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   프론트엔드      │    │   Supabase      │    │   Google OAuth  │
│   (Vercel)      │───▶│   (백엔드)       │◀───│   (인증)        │
│                 │    │                 │    │                 │
│ - React 앱      │    │ - PostgreSQL    │    │ - 인증 서비스    │
│ - 정적 파일      │    │ - 인증 서비스    │    │ - 사용자 프로필  │
│ - CDN           │    │ - 실시간        │    │                 │
│                 │    │ - 스토리지       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 배포 전 체크리스트

- [ ] Supabase 프로젝트 생성 및 구성
- [ ] 데이터베이스 스키마 배포
- [ ] Google OAuth 설정
- [ ] 스토리지 버킷 생성 (선택사항)
- [ ] 환경 변수 준비
- [ ] DNS/도메인 설정 (커스텀 도메인 사용 시)

## 🚀 Supabase 백엔드 배포

### 1. 프로덕션 Supabase 프로젝트 생성

1. [Supabase 대시보드](https://app.supabase.com)로 이동
2. 프로덕션용 새 프로젝트 생성
3. 선호하는 지역 선택 (사용자와 가장 가까운 지역)
4. 프로젝트 초기화 대기

### 2. 데이터베이스 스키마 배포

#### 옵션 A: Supabase 대시보드 사용

1. Supabase 대시보드의 SQL Editor로 이동
2. `supabase/migrations/001_initial_schema.sql` 파일 내용 복사
3. SQL 스크립트 붙여넣기 및 실행
4. 모든 테이블과 정책이 생성되었는지 확인

#### 옵션 B: Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# Supabase 로그인
supabase login

# 프로덕션 프로젝트에 연결
supabase link --project-ref your-production-project-id

# 데이터베이스 변경사항 푸시
supabase db push
```

### 3. 인증 설정

#### Google OAuth 설정

1. **Google Cloud Console 설정:**
   ```
   1. Google Cloud Console로 이동
   2. 프로젝트 생성 또는 기존 프로젝트 선택
   3. Google+ API 활성화
   4. 사용자 인증 정보 > 사용자 인증 정보 만들기 > OAuth 2.0 클라이언트 ID로 이동
   5. 애플리케이션 유형을 "웹 애플리케이션"으로 설정
   6. 승인된 리디렉션 URI 추가:
      - https://your-production-project.supabase.co/auth/v1/callback
   7. 클라이언트 ID와 클라이언트 보안 비밀번호 기록
   ```

2. **Supabase 설정:**
   ```
   1. Supabase 대시보드 > Authentication > Settings로 이동
   2. Google 제공업체 활성화
   3. Google 클라이언트 ID와 클라이언트 보안 비밀번호 입력
   4. 설정 저장
   ```

### 4. 스토리지 설정 (선택사항)

```sql
-- 아바타용 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 스토리지용 RLS 정책 설정
CREATE POLICY "아바타 이미지는 공개 액세스 가능" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "사용자는 자신의 아바타를 업로드할 수 있음" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "사용자는 자신의 아바타를 업데이트할 수 있음" ON storage.objects
FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 5. 환경 변수

Supabase 프로젝트에서 다음 값들을 기록해 두세요:

```env
# Settings > API에서 확인
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 보안 유지 필요 (서버 측에서만 사용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🌐 프론트엔드 배포 (Vercel)

### 1. 리포지토리 준비

1. 코드가 GitHub에 푸시되었는지 확인
2. 프로덕션 브랜치 생성 (선택사항이지만 권장)
3. 하드코딩된 URL을 환경 변수로 업데이트

### 2. Vercel 설정

#### 옵션 A: Vercel 대시보드 사용

1. [Vercel 대시보드](https://vercel.com/dashboard)로 이동
2. "New Project" 클릭
3. GitHub 리포지토리 가져오기
4. 빌드 설정 구성:
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

#### 옵션 B: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm install -g vercel

# Vercel 로그인
vercel login

# 프로젝트 디렉토리에서 배포
vercel

# 프로젝트 구성을 위한 프롬프트 따르기
```

### 3. 환경 변수

Vercel 대시보드 > Settings > Environment Variables에서 추가:

```env
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

**중요:** 프론트엔드 환경 변수에 서비스 역할 키를 노출하지 마세요!

### 4. 커스텀 도메인 (선택사항)

1. Vercel Project > Settings > Domains로 이동
2. 커스텀 도메인 추가
3. 안내에 따라 DNS 레코드 구성
4. Google OAuth 승인된 도메인 업데이트

### 5. 배포

```bash
# 수동 배포
vercel --prod

# 또는 main 브랜치에 푸시하여 자동 배포
git push origin main
```

## 🔧 프로덕션 구성

### 성능 최적화

1. **압축 활성화:**
   ```javascript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             supabase: ['@supabase/supabase-js']
           }
         }
       }
     }
   })
   ```

2. **CDN 구성:**
   Vercel은 정적 파일에 대해 자동으로 CDN을 제공합니다.

### 보안 구성

1. **CORS 설정:**
   Supabase 대시보드 > Settings > API에서:
   ```
   추가 허용 원본:
   - https://your-domain.com
   - https://www.your-domain.com
   ```

2. **속도 제한:**
   Supabase에서 인증 엔드포인트에 대한 속도 제한 구현을 고려하세요.

### 모니터링 설정

1. **Vercel Analytics:**
   ```bash
   npm install @vercel/analytics
   ```

2. **Supabase 모니터링:**
   - 높은 CPU/메모리 사용량에 대한 알림 설정
   - 데이터베이스 연결 수 모니터링
   - 로그 보존 정책 설정

## 🧪 프로덕션 배포 테스트

### 출시 전 테스트

1. **인증 플로우:**
   ```
   ✓ Google OAuth 로그인 작동
   ✓ 사용자 프로필 생성
   ✓ 세션 지속성
   ✓ 로그아웃 기능
   ```

2. **핵심 기능:**
   ```
   ✓ ID로 친구 추가
   ✓ 실시간 메시징
   ✓ 프로필 업데이트
   ✓ 파일 업로드 (아바타)
   ```

3. **성능:**
   ```
   ✓ 페이지 로드 속도 < 3초
   ✓ 실시간 지연 시간 < 500ms
   ✓ 모바일 반응성
   ```

### 부하 테스트

```bash
# 부하 테스트를 위한 k6 설치
npm install -g k6

# 기본 부하 테스트
k6 run --vus 10 --duration 30s load-test.js
```

## 🚨 문제 해결

### 일반적인 문제들

1. **CORS 오류:**
   ```
   해결방법: Supabase 허용 원본에 도메인 추가
   위치: Supabase Dashboard > Settings > API
   ```

2. **OAuth 리디렉션 문제:**
   ```
   해결방법: Google Cloud Console의 리디렉션 URI가 Supabase와 일치하는지 확인
   형식: https://your-project.supabase.co/auth/v1/callback
   ```

3. **환경 변수 문제:**
   ```
   해결방법: 프론트엔드 환경 변수에 VITE_ 접두사 확인
   확인: Vercel Dashboard > Settings > Environment Variables
   ```

4. **데이터베이스 연결 문제:**
   ```
   해결방법: 연결 풀링 설정 확인
   모니터링: Supabase 대시보드의 데이터베이스 연결
   ```

### 모니터링 명령어

```bash
# 배포 상태 확인
vercel ls

# 배포 로그 보기
vercel logs

# 빌드 로그 확인
vercel logs --scope build
```

## 🔄 CI/CD 파이프라인

### GitHub Actions (선택사항)

`.github/workflows/deploy.yml` 파일 생성:

```yaml
name: 프로덕션에 배포

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Node.js 설정
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: 의존성 설치
        run: npm ci

      - name: 테스트 실행
        run: npm run lint

      - name: Vercel에 배포
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 📊 프로덕션 모니터링

### 모니터링할 핵심 지표

1. **애플리케이션 성능:**
   - 페이지 로드 시간
   - 실시간 메시지 지연 시간
   - 오류율

2. **인프라:**
   - Supabase 데이터베이스 CPU/메모리
   - 연결 풀 활용률
   - 스토리지 사용량

3. **사용자 경험:**
   - 인증 성공률
   - 기능 사용 분석
   - 사용자 유지율

### 모니터링 도구

- **Vercel Analytics**: 내장 성능 모니터링
- **Supabase Dashboard**: 데이터베이스 및 API 메트릭
- **Google Analytics**: 사용자 행동 추적
- **Sentry**: 오류 추적 (선택사항)

## 🔐 보안 베스트 프랙티스

1. **정기 업데이트:**
   ```bash
   # 월별 의존성 업데이트
   npm audit
   npm update
   ```

2. **백업 전략:**
   - Supabase에서 Point-in-Time Recovery 활성화
   - 정기 데이터베이스 백업
   - 복원 절차 테스트

3. **액세스 제어:**
   - 최소 권한 원칙 사용
   - 정기 RLS 정책 감사
   - 인증 로그 모니터링

## 📞 지원 및 유지보수

### 비상 연락처

- **Vercel 상태**: https://vercel.com/status
- **Supabase 상태**: https://status.supabase.com
- **Google Cloud 상태**: https://status.cloud.google.com

### 유지보수 일정

- **주간**: 오류 로그 및 성능 메트릭 검토
- **월간**: 보안 업데이트 및 의존성 업데이트
- **분기별**: 전체 백업 복원 테스트

---

🎉 **축하합니다!** YellowTalk 애플리케이션이 이제 프로덕션에 배포되었습니다!