# Vercel 배포 및 Cron 설정 가이드

## 🚀 1. Vercel에 배포하기

### 방법 1: Vercel CLI 사용 (추천)

```bash
# Vercel CLI 설치 (아직 설치 안했다면)
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: Vercel 웹사이트 사용

1. https://vercel.com 접속
2. GitHub 계정으로 로그인
3. "Add New Project" 클릭
4. `economy-news` 저장소 선택
5. "Deploy" 클릭

---

## ⚙️ 2. 환경 변수 설정

Vercel 대시보드에서 설정:

### 📍 위치
Project Settings → Environment Variables

### 🔑 필요한 환경 변수

```bash
# Google Drive API
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY_BASE64=your_base64_encoded_private_key
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_CLIENT_ID=your_client_id
NEWS_SUMMARIES_FOLDER_ID=your_folder_id

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...

# WordPress
WORDPRESS_SITE_URL=https://your-wordpress-site.com
WORDPRESS_USERNAME=your_username
WORDPRESS_APP_PASSWORD=your_app_password

# Cron Security
CRON_SECRET=your_random_secret_string
```

### ⚠️ 중요 사항

1. **Environment 선택:**
   - Production ✅
   - Preview ✅
   - Development ✅
   
2. **GOOGLE_PRIVATE_KEY 주의:**
   - 줄바꿈이 있는 키는 Base64로 인코딩해서 사용
   - 현재 코드는 `GOOGLE_PRIVATE_KEY_BASE64`를 우선 사용하도록 설정됨

---

## ⏰ 3. Cron 작동 확인

### 현재 설정 (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 14,18,20,22 * * *"
    }
  ]
}
```

### 📅 실행 시간 (한국 시간 기준)
- 오후 2시 (14:00)
- 오후 6시 (18:00)
- 오후 8시 (20:00)
- 오후 10시 (22:00)

### ✅ 확인 방법

1. **Vercel 대시보드:**
   - Project → Settings → Cron Jobs
   - 여기서 다음 실행 시간 확인 가능

2. **로그 확인:**
   - Project → Deployments → 최신 배포 클릭
   - Functions → `/api/cron` 클릭
   - 실시간 로그 확인

3. **수동 테스트:**
   ```bash
   curl https://your-app.vercel.app/api/cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## 🔍 4. 테스트 플로우

### Step 1: 뉴스 준비
```bash
curl -X POST https://your-app.vercel.app/api/schedule \
  -H "Content-Type: application/json" \
  -d '{"action":"prepare"}'
```

### Step 2: 즉시 발행 (테스트)
```bash
curl -X POST https://your-app.vercel.app/api/publish
```

### Step 3: Cron 엔드포인트 테스트
```bash
curl https://your-app.vercel.app/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🐛 5. 트러블슈팅

### Cron이 실행되지 않을 때

1. **Vercel 대시보드 확인:**
   - Settings → Cron Jobs에서 상태 확인
   - Pro 플랜이 아니면 제한이 있을 수 있음

2. **로그 확인:**
   ```
   Project → Deployments → Functions → /api/cron
   ```

3. **환경 변수 확인:**
   - `CRON_SECRET`이 제대로 설정되었는지
   - 다른 API 키들도 모두 설정되었는지

### Google Drive 연결 오류

1. **Service Account 권한 확인:**
   - Google Drive 폴더에 서비스 계정 이메일 추가했는지
   - "편집자" 권한으로 공유했는지

2. **Private Key 확인:**
   - Base64 인코딩이 제대로 되었는지
   - 줄바꿈이 제대로 처리되었는지

### WordPress 발행 실패

1. **Application Password 확인:**
   - WordPress 대시보드에서 새로 생성
   - 공백 없이 복사

2. **WordPress REST API 활성화:**
   - Settings → Permalinks에서 "Post name" 선택
   - REST API가 활성화되어 있는지 확인

---

## 📊 6. 모니터링

### Vercel Analytics
- Project → Analytics
- 함수 실행 횟수, 에러율 확인

### 로그 모니터링
- Project → Logs
- 실시간 로그 스트림 확인

### 이메일 알림 설정
- Project → Settings → Notifications
- 배포 실패, 함수 에러 시 이메일 수신

---

## 🎯 7. 다음 단계

1. ✅ Vercel에 배포
2. ✅ 환경 변수 설정
3. ✅ Cron 작동 확인
4. ✅ 수동으로 뉴스 준비 → 발행 테스트
5. ✅ 첫 자동 발행 시간까지 대기
6. ✅ 로그 확인

---

## 💡 추가 팁

### 시간대 변경하고 싶다면

`vercel.json` 수정:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 10,14,18,22 * * *"  // 오전 10시 추가
    }
  ]
}
```

변경 후 다시 배포:
```bash
vercel --prod
```

### 테스트 시간 추가 (개발용)

현재 `scheduler.ts`에 이미 11시가 추가되어 있습니다:
```typescript
{ hour: 11, categories: ['economy', 'business_finance', 'sports'] }
```

테스트 후 제거하려면 해당 줄 삭제하면 됩니다.

---

## 📞 문제 발생 시

1. Vercel 로그 확인
2. GitHub Issues 생성
3. Vercel Support 문의 (Pro 플랜)

---

**현재 상태:** ✅ `vercel.json` Cron 설정 완료
**다음 단계:** Vercel 배포 및 환경 변수 설정
