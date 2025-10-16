import { NextResponse } from 'next/server';
import { getWordPressCategories } from '@/lib/tistory';

/**
 * WordPress 카테고리 목록 가져오기
 */
export async function GET() {
  try {
    const categories = await getWordPressCategories();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('WordPress categories error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch WordPress categories',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
