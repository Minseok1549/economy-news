import { NextResponse } from 'next/server';
import { checkWordPressConfig } from '@/lib/tistory';

/**
 * WordPress 설정 확인
 * WordPress 연결이 올바르게 설정되었는지 확인합니다
 */
export async function GET() {
  try {
    const config = checkWordPressConfig();
    
    return NextResponse.json({
      success: config.valid,
      message: config.message,
    });
  } catch (error) {
    console.error('WordPress config check error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check WordPress configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
