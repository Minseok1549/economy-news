/**
 * 뉴스 발행 스케줄러
 * 매일 14시, 18시, 20시, 22시에 각각 3개, 2개, 3개, 2개의 뉴스를 발행
 */

// Firebase imports removed - not using database storage

export const CATEGORIES = [
  'economy',
  'business_finance',
  'sports',
  'culture',
  'environment',
  'health',
  'science',
  'technology',
  'politics',
  'world_affairs',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface ScheduleConfig {
  hour: number;
  categories: Category[];
}

// 발행 스케줄 설정 (시간대별 고정 카테고리)
export const PUBLISH_SCHEDULE: ScheduleConfig[] = [
  { hour: 12, categories: ['economy', 'business_finance', 'sports'] },        // 오후 12시 (테스트용)
  { hour: 14, categories: ['economy', 'business_finance', 'sports'] },        // 오후 2시
  { hour: 18, categories: ['culture', 'environment'] },                        // 오후 6시
  { hour: 20, categories: ['health', 'science'] },                            // 오후 8시
  { hour: 22, categories: ['technology', 'politics', 'world_affairs'] },      // 오후 10시
];

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: Category;
  originalTitle?: string;
  originalContent?: string;
  summary?: string;
  investmentTip?: string;
}

/**
 * 파일명에서 카테고리 추출
 * 예: "business_finance_card.txt" -> "business_finance"
 */
export function extractCategoryFromFileName(fileName: string): Category {
  const name = fileName.replace('_card.txt', '').replace('.txt', '').toLowerCase();
  
  // 카테고리 매핑
  if (name.includes('economy') || name.includes('경제')) return 'economy';
  if (name.includes('business_finance') || name.includes('비즈니스금융')) return 'business_finance';
  if (name.includes('sports') || name.includes('스포츠')) return 'sports';
  if (name.includes('culture') || name.includes('문화')) return 'culture';
  if (name.includes('environment') || name.includes('환경')) return 'environment';
  if (name.includes('health') || name.includes('건강')) return 'health';
  if (name.includes('science') || name.includes('과학')) return 'science';
  if (name.includes('technology') || name.includes('기술')) return 'technology';
  if (name.includes('politics') || name.includes('정치')) return 'politics';
  if (name.includes('world') || name.includes('국제')) return 'world_affairs';
  
  // 기본값
  return 'economy';
}

/**
 * 다음 발행 시간 계산
 */
export function getNextPublishTime(): Date {
  const now = new Date();
  const currentHour = now.getHours();
  
  // 오늘의 남은 스케줄 찾기
  const todaySchedules = PUBLISH_SCHEDULE.filter(s => s.hour > currentHour);
  
  if (todaySchedules.length > 0) {
    // 오늘 남은 스케줄 중 가장 빠른 시간
    const nextSchedule = todaySchedules[0];
    const nextTime = new Date(now);
    nextTime.setHours(nextSchedule.hour, 0, 0, 0);
    return nextTime;
  } else {
    // 내일의 첫 스케줄
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(PUBLISH_SCHEDULE[0].hour, 0, 0, 0);
    return tomorrow;
  }
}

/**
 * 특정 시간대의 발행 카테고리 가져오기
 */
export function getPublishCategoriesForTime(date: Date): Category[] {
  const hour = date.getHours();
  const schedule = PUBLISH_SCHEDULE.find(s => s.hour === hour);
  return schedule?.categories || [];
}

/**
 * 오늘의 모든 발행 시간 가져오기
 */
export function getTodayPublishTimes(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return PUBLISH_SCHEDULE.map(schedule => {
    const time = new Date(today);
    time.setHours(schedule.hour, 0, 0, 0);
    return time;
  });
}

/**
 * 카테고리 한글 라벨 가져오기
 */
export function getCategoryLabel(category: Category): string {
  const labels: Record<Category, string> = {
    economy: '경제',
    business_finance: '비즈니스금융',
    sports: '스포츠',
    culture: '문화예술',
    environment: '환경',
    health: '건강',
    science: '과학',
    technology: '기술',
    politics: '정치',
    world_affairs: '국제정세',
  };
  return labels[category];
}
