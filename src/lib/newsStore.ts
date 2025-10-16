/**
 * 뉴스 저장소 - schedule과 publish route 간 공유
 */
import { type NewsItem } from '@/lib/scheduler';

// 메모리에 준비된 뉴스 저장
const preparedNews: Map<string, NewsItem> = new Map();

export function setPreparedNews(news: Map<string, NewsItem>) {
  preparedNews.clear();
  news.forEach((value, key) => {
    preparedNews.set(key, value);
  });
}

export function getPreparedNews(): Map<string, NewsItem> {
  return preparedNews;
}

export function clearPreparedNews() {
  preparedNews.clear();
}
