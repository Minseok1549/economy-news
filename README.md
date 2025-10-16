# � 경제 뉴스 자동 발행 시스템

AI 기반 경제 뉴스 자동 발행 플랫폼입니다. Google Drive의 뉴스를 AI로 가공하여 매일 정해진 시간에 자동으로 WordPress에 발행합니다.

## ✨ 주요 기능

### 🤖 AI 콘텐츠 가공
- **본문 재작성**: 카카오페이/토스 증권 스타일의 쉬운 언어로 자동 변환
- **제목 최적화**: 클릭율을 높이는 매력적인 제목 생성
- **요약 생성**: 핵심 내용을 1-2문장으로 압축

### ⏰ 스마트 스케줄링
- **자동 발행 시간**:
  - 오후 2시: 3개 뉴스
  - 오후 6시: 2개 뉴스
  - 오후 8시: 3개 뉴스
  - 오후 10시: 2개 뉴스
- **카테고리 밸런싱**: 10개 테마를 균형있게 분배
- **우선순위 정렬**: 중요도 점수 기반 자동 선별

### 📊 10개 카테고리
1. 💼 비즈니스·금융 (business_finance)
2. 🎨 문화 (culture)
3. 💰 경제 (economy)
4. 🌱 환경 (environment)
5. 🏥 건강 (health)
6. 🏛️ 정치 (politics)
7. 🔬 과학 (science)
8. 👥 사회 (society)
9. ⚽ 스포츠 (sports)
10. 💻 기술 (technology)

### 🔍 뉴스 아카이브
- Google Drive에서 날짜별 뉴스 폴더 자동 탐색
- 중요도 점수 기반 정렬 및 큐레이션
- 뉴스 상세 보기 및 공유 링크 생성

### 🚀 WordPress 자동 발행
- 선택한 뉴스를 WordPress 블로그에 원클릭으로 발행
- 자동 포맷팅 (보기 좋은 HTML 레이아웃)
- 커스텀 제목 및 내용 편집 가능

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Firebase Firestore
- **AI**: OpenAI GPT-4o-mini / Google Gemini
- **External APIs**: Google Drive API, WordPress REST API
- **Deployment**: Vercel (with Cron Jobs)

## 📦 설치 및 실행

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd economy-news
npm install
```

### 2. 환경 변수 설정

`.env.local.example` 파일을 `.env.local`로 복사하고 필요한 값을 입력합니다:

```bash
cp .env.local.example .env.local
```

필요한 환경 변수:
- **Google Drive API**: Service Account 정보
- **WordPress API**: 사이트 URL, Username, Application Password

자세한 설정 방법은 [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md)를 참고하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 📖 사용 방법

### 뉴스 탐색
1. 메인 페이지에서 날짜 폴더를 클릭합니다
2. 해당 날짜의 뉴스 목록이 중요도 순으로 표시됩니다
3. 뉴스를 클릭하여 전체 내용을 확인할 수 있습니다

### WordPress 발행
1. 발행하고 싶은 뉴스를 체크박스로 선택합니다
   - 또는 "상위 3개 선택" / "상위 5개 선택" 버튼 사용
2. "🚀 WordPress 발행" 버튼을 클릭합니다
3. 모달에서 제목과 내용을 확인/수정합니다
4. "발행하기" 또는 "임시저장" 버튼을 클릭합니다

## 🔐 WordPress 연동 설정

WordPress Application Password 설정이 필요합니다:

1. WordPress 관리자 페이지 로그인
2. **사용자 > 프로필**에서 **Application Passwords** 섹션으로 이동
3. 새 애플리케이션 이름 입력 후 **Add New** 클릭
4. 생성된 비밀번호를 `.env.local`에 저장

자세한 내용은 [WORDPRESS_SETUP.md](./WORDPRESS_SETUP.md)를 참고하세요.

## 📂 프로젝트 구조

```
economy-news/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── folders/          # Google Drive 폴더 API
│   │   │   ├── news/              # 뉴스 내용 API
│   │   │   └── tistory/           # Tistory 발행 API
│   │   ├── news/[id]/             # 뉴스 상세 페이지
│   │   └── page.tsx               # 메인 페이지
│   ├── components/
│   │   └── PublishModal.tsx       # 발행 모달 컴포넌트
│   └── lib/
│       ├── newsScoring.ts         # 중요도 점수 계산
│       └── tistory.ts             # WordPress API 연동
├── .env.local.example             # 환경 변수 예시
├── WORDPRESS_SETUP.md             # WordPress 설정 가이드
└── README.md
```

## 🚧 향후 계획

### 2단계: 완전 자동화
- **스케줄링**: Vercel Cron Jobs 또는 GitHub Actions
- **자동 선별**: 매일 오전 8시, 전날의 상위 3~5개 뉴스를 자동으로 선별
- **자동 발행**: 사용자 개입 없이 WordPress에 자동으로 발행
- **알림**: 발행 완료 시 이메일 또는 슬랙 알림
- **카테고리/태그**: WordPress 카테고리 및 태그 자동 설정

### AI 기반 큐레이션 (선택사항)
- OpenAI API를 활용한 지능형 뉴스 선별
- 전체 뉴스 요약 및 시장 브리핑 자동 생성
- 더욱 정교한 중요도 분석

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📄 라이선스

MIT License

---

Built with ❤️ using Next.js and TypeScript
