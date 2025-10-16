# GitHub Actions 스케줄링 설정 가이드

## 🔧 설정 방법

### 1. GitHub Secrets 등록

Repository Settings → Secrets and variables → Actions에서 추가:

```
CRON_SECRET: your_cron_secret_from_env_local
VERCEL_URL: https://your-app.vercel.app
```

### 2. 스케줄 시간 설정

`.github/workflows/scheduled-publish.yml` 파일의 cron 표현식:

```yaml
schedule:
  - cron: '0 5 * * *'   # 한국시간 14:00 (UTC 05:00)
  - cron: '0 9 * * *'   # 한국시간 18:00 (UTC 09:00)
  - cron: '0 11 * * *'  # 한국시간 20:00 (UTC 11:00)
  - cron: '0 13 * * *'  # 한국시간 22:00 (UTC 13:00)
```

**중요:** GitHub Actions는 UTC 시간 기준이므로 한국시간에서 -9시간 해야 합니다.

### 3. Cron 표현식 형식

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ 요일 (0-6, Sunday=0)
│ │ │ └─── 월 (1-12)
│ │ └───── 일 (1-31)
│ └─────── 시 (0-23)
└───────── 분 (0-59)
```

## 🔄 Vercel Cron vs GitHub Actions 비교

### Vercel Cron (현재 방식) ✅ 추천
- **장점:**
  - Vercel 환경 내부에서 실행 (빠름)
  - 환경 변수 자동 사용
  - 설정 간단
  - 무료
  
- **단점:**
  - Vercel 종속적

### GitHub Actions
- **장점:**
  - GitHub에서 관리
  - 복잡한 워크플로우 가능
  - 플랫폼 독립적
  
- **단점:**
  - 외부 API 호출 (느림)
  - Secrets 별도 설정 필요
  - 월 2,000분 제한
  - 최소 5분 간격

## 📝 사용 방법

### 수동 실행
1. GitHub → Actions 탭
2. "Scheduled News Publishing" 선택
3. "Run workflow" 클릭

### 로그 확인
1. GitHub → Actions 탭
2. 최근 실행된 워크플로우 클릭
3. "publish-news" 작업 로그 확인

## ⚠️ 주의사항

1. **GitHub Actions 스케줄링 지연:**
   - 정확한 시간에 실행되지 않을 수 있음 (최대 10-15분 지연 가능)
   - 부하가 높을 때는 더 지연될 수 있음

2. **무료 티어 제한:**
   - Public repo: 무제한
   - Private repo: 월 2,000분

3. **Vercel Cron이 더 나은 이유:**
   - 정확한 시간에 실행
   - 네트워크 지연 없음
   - 더 안정적

## 🎯 결론

**권장사항:** Vercel Cron을 계속 사용하세요!

GitHub Actions는 다음 경우에만 고려:
- Vercel에서 다른 플랫폼으로 이동할 계획이 있을 때
- 발행 전/후에 복잡한 작업이 필요할 때
- GitHub 중심의 워크플로우를 원할 때
