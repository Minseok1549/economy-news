/**
 * 뉴스 발행 스케줄러
 * 매일 오후 2시부터 30분~1시간30분 간격으로 랜덤하게 10개 기사를 하나씩 발행
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
  minute: number;
  categories: Category[];
}

/**
 * 오후 2시(14:00 KST = 05:00 UTC)부터 시작해서 
 * 30~90분 간격으로 10개 기사를 하나씩 발행하는 스케줄 생성
 */
function generateRandomSchedule(): ScheduleConfig[] {
  const schedule: ScheduleConfig[] = [];
  let currentMinutes = 5 * 60; // UTC 05:00 = 한국시간 14:00 (오후 2시)
  
  // 카테고리 순서를 랜덤하게 섞기
  const shuffledCategories = [...CATEGORIES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < shuffledCategories.length; i++) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;
    
    schedule.push({
      hour,
      minute,
      categories: [shuffledCategories[i]],
    });
    
    // 다음 발행까지 30~90분 랜덤 간격 (마지막 기사는 제외)
    if (i < shuffledCategories.length - 1) {
      const randomInterval = Math.floor(Math.random() * 61) + 30; // 30~90분
      currentMinutes += randomInterval;
    }
  }
  
  return schedule;
}

// 서버 시작 시 한 번만 생성 (매 요청마다 바뀌지 않도록)
export const PUBLISH_SCHEDULE: ScheduleConfig[] = generateRandomSchedule();

// 디버깅용 - 생성된 스케줄 출력
console.log('📅 생성된 발행 스케줄:');
PUBLISH_SCHEDULE.forEach((s, i) => {
  const kstHour = (s.hour + 9) % 24;
  console.log(`  ${i + 1}. UTC ${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} (KST ${String(kstHour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}) - ${s.categories[0]}`);
});

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
 * 특정 시간대의 발행 카테고리 가져오기 (분 단위까지 체크)
 */
export function getPublishCategoriesForTime(date: Date): Category[] {
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  // 정확한 시간(±5분 오차 허용)
  const schedule = PUBLISH_SCHEDULE.find(s => 
    s.hour === hour && Math.abs(s.minute - minute) <= 5
  );
  
  return schedule?.categories || [];
}

/**
 * 현재 시간에 가장 가까운 발행 스케줄 찾기 (GitHub Actions cron은 정확하지 않을 수 있음)
 */
export function getClosestPublishCategories(date: Date): Category[] {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const currentMinutes = hour * 60 + minute;
  
  // 가장 가까운 스케줄 찾기 (최대 30분 차이까지 허용)
  let closestSchedule = null;
  let minDiff = Infinity;
  
  for (const schedule of PUBLISH_SCHEDULE) {
    const scheduleMinutes = schedule.hour * 60 + schedule.minute;
    const diff = Math.abs(currentMinutes - scheduleMinutes);
    
    if (diff < minDiff && diff <= 30) {
      minDiff = diff;
      closestSchedule = schedule;
    }
  }
  
  return closestSchedule?.categories || [];
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
