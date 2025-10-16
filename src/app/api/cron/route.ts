import { NextRequest, NextResponse } from 'next/server';
import { getPublishCategoriesForTime } from '@/lib/scheduler';

/**
 * Vercel Cron Job 엔드포인트
 * 매 시간마다 실행되어 해당 시간에 스케줄된 뉴스를 발행합니다.
 * 
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron",
 *     "schedule": "0 14,18,20,22 * * *"
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // Cron secret 검증 (프로덕션 환경에서)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const hour = now.getHours();
    console.log(`[CRON] 실행 시작: ${now.toISOString()} (${hour}시)`);

    // 현재 시간에 발행할 카테고리 확인
    const categories = getPublishCategoriesForTime(now);

    if (categories.length === 0) {
      console.log('[CRON] 현재 시간은 발행 시간이 아닙니다.');
      return NextResponse.json({
        success: true,
        message: '현재 시간은 발행 시간이 아닙니다.',
        currentTime: now.toISOString(),
        currentHour: hour,
      });
    }

    console.log(`[CRON] ${categories.length}개 카테고리 뉴스 발행 시작: ${categories.join(', ')}`);

    // 발행 API 호출
    const publishUrl = new URL('/api/publish', request.url);
    const publishResponse = await fetch(publishUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const publishResult = await publishResponse.json();

    console.log(`[CRON] 발행 완료: ${JSON.stringify(publishResult)}`);

    return NextResponse.json({
      success: true,
      ...publishResult,
    });

  } catch (error) {
    console.error('[CRON] 오류 발생:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        currentTime: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST 메서드도 지원 (테스트용)
export async function POST(request: NextRequest) {
  return GET(request);
}
