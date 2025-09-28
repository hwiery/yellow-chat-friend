# YellowTalk — Supabase + Vercel(프론트) + Render(백엔드) 통합: 프로덕션 기획서

> **요약**
> 이 문서는 Lovable을 통해 구현된 프론트엔드(Vercel)에 Render로 배포된 백엔드와 Supabase DB/Auth/Storage를 안정적으로 통합하여, 모바일/웹 서비스(Flutter 포함)의 프로덕션 환경을 구축하기 위한 기획서입니다. 핵심 목표는 **보안, 가용성, 확장성, 운영성**을 확보하는 것입니다.

---

## 1. 전제(Assumptions)

* 프론트엔드: Vercel에 배포된 정적/SSR 웹(현재 Lovable로 구현 완료). 모바일 앱(Flutter)은 동일한 백엔드 API 사용.
* 백엔드: Render에서 관리되는 Node.js(또는 Nest/Express 등) 서비스가 비즈니스 로직 및 민감 연산(서비스 키 사용)을 담당.
* DB/Auth/Storage: Supabase(Postgres) 사용. Supabase Auth, Storage, Realtime 기능을 부분 사용.
* 목표: 초기에는 1~10k MAU 수준의 안정적 운영, 이후 수평 확장 준비.

---

## 2. 권장 아키텍처 (요약)

```
[Flutter app] ----
                  \                ┌────────────┐
[Vercel frontend] ---(HTTPS)----->|  Render API |----(service_role)--> [Supabase Postgres]
                                    └────────────┘
                                           ↕
                                     [Supabase Auth/Storage]
```

* 프론트(웹/모바일)는 **인증·프로필 조회·간단한 읽기**는 Supabase 클라이언트(anon key)로 직접 처리 가능. 하지만 민감한 쓰기/관리 작업(예: 결제, 서비스_role 사용)은 반드시 Render 백엔드를 거치게 설계.
* 이유: `service_role` 키는 절대 클라이언트에 노출하면 안 됨. 백엔드가 키를 안전히 보관하고 요청을 수행.

---

## 3. 핵심 설계 원칙

1. **보안 우선**: DB 레벨에서 RLS 적용, 서비스 키는 서버 전용, 환경변수/비밀은 호스트의 Secret Store 사용.
2. **환경 분리**: 로컬 → 스테이징 → 프로덕션(Supabase 프로젝트 각각 분리).
3. **마이그레이션과 CI**: 모든 DB 변경은 SQL 마이그레이션으로 관리하고 CI/CD로 배포.
4. **관측성**: 로그·에러·지표(응답시간/DB 커넥션 등) 모니터링과 알람 설정.
5. **회복성**: 정기 백업, PITR(필요 시), 복구 절차 문서화.

---

## 4. 데이터베이스 설계 & 마이그레이션

* **스키마 기본**: users, friends, conversations, messages, attachments, user_settings, audits

  * users(id uuid PK, email, display_name, avatar_url, created_at)
  * friends(user_id, friend_id, status(enum: requested/accepted/blocked), created_at)
  * conversations(id, type(enum: direct/group), created_at)
  * messages(id, conversation_id, sender_id, content, meta jsonb, created_at)
  * attachments(id, message_id, storage_path, mime, size)
  * audits(table_name, record_id, action, actor_id, payload jsonb, created_at)
* **인덱스 전략**: messages(conversation_id, created_at DESC), users(email), friends(user_id)
* **마이그레이션**: Supabase CLI 또는 SQL 파일로 모든 변경 관리. PR 머지 → GitHub Actions로 마이그레이션 실행(스테이지 먼저).

### 권장 마이그레이션 원칙

* 컬럼 삭제나 타입 변경은 단계적 적용(추가 → 배포 → 데이터 이전 → 삭제).
* 롤백 스크립트 준비.

---

## 5. 인증·권한 (Auth & RLS)

* **Auth**: Supabase Auth 사용(이메일/비밀번호, OAuth 필요시 연동)

  * 이메일 확인, 비밀번호 정책, refresh token 설정 확인.
* **RLS**: 모든 민감 테이블에 RLS 적용(읽기/쓰기 정책 명시)

  * 예: messages 테이블은 `sender_id = auth.uid()` 또는 conversation 멤버인지 확인하는 정책만 허용.
* **Key 관리**: `anon` 키(클라이언트)에만 최소 권한 제공. `service_role` 키는 Render 환경변수에만 저장, 절대 노출 금지.

---

## 6. 스토리지(파일) 전략

* Supabase Storage 사용 권장(프로필/이미지/첨부파일)

  * 업로드는 **클라이언트 직접 업로드(사전 서명된 URL)** 또는 백엔드 프록시 방식 사용.
  * 삭제/권한 제어는 DB RLS와 연계.
* CDN 및 캐싱: 이미지(프로필)는 CDN으로 제공하도록 설정.

---

## 7. 연결성·성능 고려사항

* **커넥션 풀링**: Supabase는 PgBouncer/Supavisor 등의 풀러 사용. 애플리케이션은 커넥션 재사용·pool 모드 설정 필요.
* **서버리스 환경 주의**: Vercel 같은 serverless는 각 요청마다 연결을 만들 수 있어 DB 연결 초과 위험. 반드시 풀러 사용 + 서버에서의 연결 관리 권장.
* **리전/응답속도**: Vercel/Render와 Supabase의 리전을 가깝게 지정(예: AP-NORTHEAST 등)하여 레이턴시 최소화.

---

## 8. 배포·CI/CD

* **환경 분리**: Github repo → main(프로덕션), develop/staging 브랜치(스테이징).
* **GitHub Actions 예시**:

```yaml
# supabase-migration.yml (간단 예시)
name: Deploy Supabase Migrations
on:
  push:
    branches: [ main ]
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/cli-action@v1
        with:
          args: db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_TOKEN }}
```

* **배포 순서 권장**: 1) 마이그레이션 → 2) 백엔드(deploy) → 3) 프론트(정적) 배포.

---

## 9. 환경변수·시크릿 관리

* Vercel: 빌드/런타임 환경변수 사용(민감값 금지 — 예: service_role 금지). 프론트에 노출되면 안되는 값은 Vercel Public 변수로도 노출됨을 유의.
* Render: 서비스 환경변수/Secret Files로 `SERVICE_ROLE_KEY`, DB CONNECTION STRING 보관.
* GitHub Secrets: CI에서 마이그레이션 시 사용.

---

## 10. 백업·복구 (DR)

* 정기 백업(일간) + **PITR** 옵션 검토(서비스 규모/데이터 손실 허용치에 따라 활성화).
* 복구 연습: 주기적으로 스냅샷 복원 테스트 수행.
* 스토리지(파일)는 DB 백업에 포함되지 않으므로 별도 버전/백업 정책 필요.

---

## 11. 모니터링·로깅·알람

* **로그 수집**: 백엔드(Structured logs JSON), Supabase 로그, Storage 액세스 로그
* **에러 모니터링**: Sentry 또는 Rollbar 연동
* **지표/알람**: DB 연결 수, 에러율(4xx/5xx), 응답시간, 큐 길이
* **Uptime 체크**: 외부 모니터(여러 리전)로 API 헬스 체크 설정

---

## 12. 보안(추가)

* WAF/CDN, TLS(강제 HTTPS)
* CORS 정책 최소화(프론트 도메인만 허용)
* Rate-limiting(로그인/회원가입/메시지 전송 빈도 제한)
* 데이터 암호화(전송 중 TLS, 민감 데이터는 DB에서 암호화 고려)
* 키 회전 정책 및 권한 검토 주기 설정

---

## 13. 테스트 계획

* 단위/통합 테스트, E2E (Cypress, Playwright)
* 부하 테스트(k6, Artillery) – 목표 동시 사용자 수 기준 시나리오
* 보안 테스트(취약점 스캐닝, 의도적 RLS 우회 시나리오)

---

## 14. 운영(runbook) & 인시던트 대응

* 인시던트 템플릿(심각도 분류, 알림 채널, 롤백/복구 절차)
* DB 연결 초과 시 임시 대응(스케일 업, 큐 셧다운, 쓰로틀링)
* 복구 절차(백업 복원, 마이그레이션 롤백)

---

## 15. '프로덕션 가기 전' 체크리스트 (우선순위)

**핵심(반드시 완료)**

* [ ] 스테이징/프로덕션 Supabase 프로젝트 분리 및 설정
* [ ] 모든 민감 테이블에 RLS 정책 적용 및 테스터로 검증
* [ ] service_role 키는 Render의 시크릿에만 저장, 프론트에는 절대 없음
* [ ] 마이그레이션 파이프라인 (GitHub Actions) 구축 및 테스트
* [ ] Daily backup 또는 PITR 옵션 설정 및 복구 테스트
* [ ] 커넥션 풀링(PgBouncer/Supavisor) 설정 및 앱에서 pool 모드 사용
* [ ] CORS 및 환경변수 세팅 (Vercel/Render)
* [ ] 로그/에러 모니터링(예: Sentry) 및 알람 룰 구성

**권장(가능하면 완료)**

* [ ] Load test(목표 부하) 및 DB 튜닝
* [ ] 파일 스토리지 CDN + 캐시 정책
* [ ] DR 복구 연습 및 문서화
* [ ] 비용 모니터링(예상 초과 시 알람)

---

## 16. 비용/플랜 고려사항

* Supabase: DB compute, PITR/백업, 스토리지 비용
* Render: 서비스 인스턴스(백엔드) 비용(상시 가동 필요)
* Vercel: 프론트(정적)은 상대적으로 저렴하지만 빌드/플랜 제약 확인
* 모니터링/Sentry 등은 별도 비용

---

## 17. 다음 단계(Deliverables)

1. 인프라 체크리스트 항목을 담당자에게 배정
2. Supabase 스테이징 프로젝트 생성 및 데이터 모델 초안 반영
3. RLS 정책 초안 작성 및 코드 기반 테스트 케이스 작성
4. GitHub Actions(마이그레이션) 및 Render 배포 파이프라인 구성
5. 모니터링/로깅 대시보드 구성(Sentry + 로그 수집)
6. 부하 테스트 계획 수립 및 실행

---

## 부록: 빠른 참고(권장 도구)

* Supabase CLI, Supabase Studio
* PgBouncer / Supavisor
* GitHub Actions (CI)
* Sentry / Logflare
* k6 (부하 테스트)

---

**끝**

---

*문서가 준비되었습니다. 다음으로 원하시면 저는 아래 항목 중 하나를 바로 생성해 드릴 수 있습니다:*

* DB 테이블 SQL 초안 (users/friends/messages 등) 생성
* RLS 정책 예제 SQL 생성
* GitHub Actions 마이그레이션 워크플로우 완전본
* 모니터링 대시보드 템플릿

원하시는 항목을 골라 주세요.
