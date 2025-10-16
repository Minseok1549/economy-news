/**
 * WordPress REST API 클라이언트
 * https://developer.wordpress.org/rest-api/
 */

const WORDPRESS_SITE_URL = process.env.WORDPRESS_SITE_URL || '';
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || '';
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD || '';

export interface WordPressPost {
  title: string;
  content: string;
  status?: 'publish' | 'draft' | 'pending' | 'private';
  excerpt?: string;
  categories?: number[];
  tags?: number[];
}

export interface WordPressPublishResult {
  success: boolean;
  postId?: number;
  url?: string;
  status?: string;
  error?: string;
}

/**
 * WordPress API 인증 헤더 생성
 */
function getAuthHeader(): string {
  const credentials = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * WordPress 설정 확인
 */
export function checkWordPressConfig(): { valid: boolean; message: string } {
  if (!WORDPRESS_SITE_URL) {
    return { valid: false, message: 'WORDPRESS_SITE_URL이 설정되지 않았습니다.' };
  }
  if (!WORDPRESS_USERNAME) {
    return { valid: false, message: 'WORDPRESS_USERNAME이 설정되지 않았습니다.' };
  }
  if (!WORDPRESS_APP_PASSWORD) {
    return { valid: false, message: 'WORDPRESS_APP_PASSWORD가 설정되지 않았습니다.' };
  }
  return { valid: true, message: 'WordPress 설정이 완료되었습니다.' };
}

/**
 * WordPress에 포스트 발행
 */
export async function publishToWordPress(post: WordPressPost): Promise<WordPressPublishResult> {
  try {
    const config = checkWordPressConfig();
    if (!config.valid) {
      throw new Error(config.message);
    }

    const apiUrl = `${WORDPRESS_SITE_URL}/wp-json/wp/v2/posts`;
    
    const postData = {
      title: post.title,
      content: post.content,
      status: post.status || 'publish',
      excerpt: post.excerpt || '',
      categories: post.categories || [],
      tags: post.tags || [],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthHeader(),
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `WordPress API error: ${response.status} - ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      postId: data.id,
      url: data.link,
      status: data.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish',
    };
  }
}

/**
 * WordPress 카테고리 목록 가져오기
 */
export async function getWordPressCategories() {
  const config = checkWordPressConfig();
  if (!config.valid) {
    throw new Error(config.message);
  }

  const apiUrl = `${WORDPRESS_SITE_URL}/wp-json/wp/v2/categories?per_page=100`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }

  return response.json();
}

/**
 * WordPress 태그 목록 가져오기
 */
export async function getWordPressTags() {
  const config = checkWordPressConfig();
  if (!config.valid) {
    throw new Error(config.message);
  }

  const apiUrl = `${WORDPRESS_SITE_URL}/wp-json/wp/v2/tags?per_page=100`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.status}`);
  }

  return response.json();
}

/**
 * 뉴스 콘텐츠를 WordPress 포스트 형식으로 변환
 */
export function formatNewsForWordPress(
  newsItems: Array<{ name: string; content: string; score?: number }>,
  date: string
): WordPressPost {
  const title = `📊 ${date} 경제 뉴스 브리핑`;
  
  let content = `<h2>🔥 오늘의 주요 경제 뉴스</h2>\n\n`;
  content += `<p><em>${date} 가장 주목할 만한 경제 뉴스를 엄선하여 전달합니다.</em></p>\n\n`;
  content += `<hr>\n\n`;

  newsItems.forEach((news, index) => {
    content += `<h3>${index + 1}. ${news.name}</h3>\n`;
    content += `<div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin-bottom: 20px;">\n`;
    content += `${news.content.replace(/\n/g, '<br>')}\n`;
    content += `</div>\n\n`;
  });

  content += `<hr>\n\n`;
  content += `<p style="text-align: center; color: #6c757d;">`;
  content += `<small>이 브리핑은 자동으로 생성되었습니다.</small>`;
  content += `</p>`;

  const excerpt = `${date} 주요 경제 뉴스 ${newsItems.length}건을 엄선하여 전달합니다.`;

  return {
    title,
    content,
    status: 'publish',
    excerpt,
  };
}
