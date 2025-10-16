#!/bin/bash

# Vercel 배포 테스트 스크립트
# 사용법: ./test-vercel.sh https://your-app.vercel.app YOUR_CRON_SECRET

VERCEL_URL=$1
CRON_SECRET=$2

if [ -z "$VERCEL_URL" ] || [ -z "$CRON_SECRET" ]; then
    echo "❌ 사용법: ./test-vercel.sh https://your-app.vercel.app YOUR_CRON_SECRET"
    exit 1
fi

echo "🚀 Vercel 배포 테스트 시작..."
echo ""

# 1. 스케줄 정보 확인
echo "1️⃣ 스케줄 정보 확인..."
curl -s "$VERCEL_URL/api/schedule" | jq '.'
echo ""
echo "---"
echo ""

# 2. 뉴스 준비 (AI 재작성)
echo "2️⃣ 뉴스 준비 중... (시간이 좀 걸릴 수 있습니다)"
curl -s -X POST "$VERCEL_URL/api/schedule" \
  -H "Content-Type: application/json" \
  -d '{"action":"prepare"}' | jq '.'
echo ""
echo "---"
echo ""

# 3. 발행 대상 확인
echo "3️⃣ 발행 대상 뉴스 확인..."
curl -s "$VERCEL_URL/api/publish" | jq '.'
echo ""
echo "---"
echo ""

# 4. 실제 발행 (WordPress에 포스팅)
echo "4️⃣ WordPress에 발행 중..."
read -p "⚠️  실제로 WordPress에 발행하시겠습니까? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    curl -s -X POST "$VERCEL_URL/api/publish" | jq '.'
    echo ""
    echo "---"
    echo ""
fi

# 5. Cron 엔드포인트 테스트
echo "5️⃣ Cron 엔드포인트 테스트..."
curl -s "$VERCEL_URL/api/cron" \
  -H "Authorization: Bearer $CRON_SECRET" | jq '.'
echo ""
echo "---"
echo ""

echo "✅ 테스트 완료!"
