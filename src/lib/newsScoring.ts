/**
 * 뉴스 중요도 점수 계산 시스템
 * 키워드 기반으로 뉴스의 중요도를 평가합니다
 */

interface ScoreKeywords {
  high: string[];      // 높은 가중치 (10점)
  medium: string[];    // 중간 가중치 (5점)
  low: string[];       // 낮은 가중치 (2점)
}

const SCORE_KEYWORDS: ScoreKeywords = {
  high: [
    '금리 인상', '금리 인하', '기준금리',
    '실적 발표', '어닝 서프라이즈', '실적 쇼크',
    'M&A', '인수합병', '기업 인수',
    '역대 최고', '사상 최대', '기록 경신',
    '상장', 'IPO', '공모주',
    '파산', '부도', '워크아웃', '법정관리',
    '주가 급등', '주가 급락', '서킷브레이커',
    '긴급', '이례적', '역사적'
  ],
  medium: [
    '투자', '배당', '자사주',
    '매출', '영업이익', '순이익',
    '신제품', '신사업', '사업 확장',
    '제재', '규제', '정책',
    '협력', '파트너십', '계약',
    '증가', '감소', '상승', '하락'
  ],
  low: [
    '발표', '계획', '예정',
    '전망', '예상', '추정',
    '검토', '고려', '논의'
  ]
};

/**
 * 뉴스 파일명과 내용을 기반으로 중요도 점수를 계산합니다
 */
export function calculateNewsScore(
  input: string | { title: string; content: string; category?: string },
  content: string = ''
): number {
  let score = 0;
  let text: string;
  
  // 문자열 또는 객체 형식 모두 지원
  if (typeof input === 'string') {
    text = `${input} ${content}`.toLowerCase();
  } else {
    text = `${input.title} ${input.content} ${input.category || ''}`.toLowerCase();
  }

  // 높은 가중치 키워드
  SCORE_KEYWORDS.high.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 10;
    }
  });

  // 중간 가중치 키워드
  SCORE_KEYWORDS.medium.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 5;
    }
  });

  // 낮은 가중치 키워드
  SCORE_KEYWORDS.low.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 2;
    }
  });

  // 카테고리별 기본 점수 (경제, 비즈니스 관련 뉴스에 가산점)
  if (text.includes('economy') || text.includes('경제')) {
    score += 3;
  }
  if (text.includes('business_finance') || text.includes('비즈니스') || text.includes('금융')) {
    score += 3;
  }

  return score;
}

/**
 * 뉴스 배열을 점수순으로 정렬합니다
 */
export function sortNewsByScore<T extends { name: string; content?: string }>(
  news: T[],
  limit?: number
): (T & { score: number })[] {
  const newsWithScores = news.map(item => ({
    ...item,
    score: calculateNewsScore(item.name, item.content || '')
  }));

  const sorted = newsWithScores.sort((a, b) => b.score - a.score);
  
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * 상위 N개의 중요 뉴스를 선별합니다
 */
export function getTopNews<T extends { name: string; content?: string }>(
  news: T[],
  count: number = 5
): (T & { score: number })[] {
  return sortNewsByScore(news, count);
}
