import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { rewriteNewsContent } from '@/lib/ai';
import {
  extractCategoryFromFileName,
  getNextPublishTime,
  getPublishCategoriesForTime,
  PUBLISH_SCHEDULE,
  type NewsItem,
} from '@/lib/scheduler';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const NEWS_SUMMARIES_FOLDER_ID = process.env.NEWS_SUMMARIES_FOLDER_ID;

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

// Google Drive 클라이언트 초기화
async function getDriveService() {
  let privateKey: string;
  if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  } else if (process.env.GOOGLE_PRIVATE_KEY) {
    privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else {
    throw new Error('No private key found');
  }

  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

// 오늘 날짜 폴더 찾기
function getTodayFolderNames(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return [
    `${year}-${month}-${day}`,
    `${year}${month}${day}`,
    `${year}.${month}.${day}`,
    `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`,
    `${year}년 ${month}월 ${day}일`,
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findTodayFolder(drive: any): Promise<string | null> {
  const candidates = new Set(getTodayFolderNames());
  
  try {
    const response = await drive.files.list({
      q: `'${NEWS_SUMMARIES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
    });

    const folders = response.data.files || [];
    
    for (const folder of folders) {
      if (folder.name && candidates.has(folder.name)) {
        return folder.id;
      }
    }
  } catch (error) {
    console.error('Error finding today folder:', error);
  }
  
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCardTextFiles(drive: any, folderId: string): Promise<DriveFile[]> {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/plain' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];
    // _card.txt가 붙지 않은 .txt 파일만 가져오기
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return files.filter((file: any) => file.name && file.name.endsWith('.txt') && !file.name.endsWith('_card.txt'));
  } catch (error) {
    console.error('Error getting card text files:', error);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFileContent(drive: any, fileId: string): Promise<string> {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });
    
    return response.data || '';
  } catch (error) {
    console.error('Error getting file content:', error);
    return '';
  }
}

// 메모리에 준비된 뉴스 저장 (간단한 인메모리 스토리지)
const preparedNews: Map<string, NewsItem> = new Map();

/**
 * GET /api/schedule - 현재 스케줄 정보 조회
 */
export async function GET() {
  try {
    const nextPublishTime = getNextPublishTime();
    const publishCategories = getPublishCategoriesForTime(nextPublishTime);
    
    return NextResponse.json({
      schedule: PUBLISH_SCHEDULE.map(s => ({
        hour: s.hour,
        categories: s.categories,
        count: s.categories.length,
      })),
      nextPublishTime: nextPublishTime.toISOString(),
      nextPublishCategories: publishCategories,
      currentTime: new Date().toISOString(),
      preparedNewsCount: preparedNews.size,
    });
  } catch (error) {
    console.error('스케줄 조회 오류:', error);
    return NextResponse.json(
      { error: '스케줄 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schedule - 뉴스 AI 재작성 및 메모리 저장
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'prepare') {
      // Google Drive에서 오늘의 뉴스 가져오기
      const drive = await getDriveService();
      const todayFolderId = await findTodayFolder(drive);
      
      if (!todayFolderId) {
        return NextResponse.json(
          { error: '오늘 날짜 폴더를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const files = await getCardTextFiles(drive, todayFolderId);
      
      if (files.length === 0) {
        return NextResponse.json(
          { error: '오늘 날짜 폴더에 뉴스 파일이 없습니다.' },
          { status: 404 }
        );
      }

      const results = [];
      preparedNews.clear(); // 기존 데이터 클리어
      
      // 각 파일 처리
      for (const file of files) {
        try {
          const originalContent = await getFileContent(drive, file.id!);
          const originalTitle = file.name!.replace('.txt', '');
          const category = extractCategoryFromFileName(file.name!);
          
          // AI로 재작성
          console.log(`AI 재작성 중: ${originalTitle} (${category})`);
          const rewritten = await rewriteNewsContent(
            originalTitle,
            originalContent,
            category
          );
          
          // 메모리에 저장
          const newsItem: NewsItem = {
            id: file.id!,
            title: rewritten.title,
            content: rewritten.content,
            category,
            originalTitle,
            originalContent,
            summary: rewritten.summary,
            investmentTip: rewritten.investmentTip,
          };
          
          console.log(`✅ NewsItem 저장 완료 - ID: ${file.id}`);
          console.log(`   - originalTitle: ${originalTitle}`);
          console.log(`   - originalContent 길이: ${originalContent?.length || 0}`);
          console.log(`   - summary: ${rewritten.summary?.substring(0, 50)}...`);
          console.log(`   - investmentTip 존재: ${!!rewritten.investmentTip}`);
          
          preparedNews.set(file.id!, newsItem);
          
          results.push({
            id: file.id,
            originalTitle,
            newTitle: rewritten.title,
            category,
          });
          
          // API 레이트 리밋 방지
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`파일 처리 실패 (${file.name}):`, error);
          results.push({
            originalTitle: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      return NextResponse.json({
        message: '뉴스 준비 완료',
        totalProcessed: results.length,
        results,
      });
    }
    
    return NextResponse.json(
      { error: '올바른 action을 지정해주세요. (prepare)' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('스케줄링 오류:', error);
    return NextResponse.json(
      { 
        error: '스케줄링 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 준비된 뉴스를 가져오는 헬퍼 - publish route에서 사용
 * Dynamic import를 통해 접근 가능하도록 global 변수로 노출
 */
if (typeof global !== 'undefined') {
  (global as any).__getPreparedNews = () => {
    const now = new Date();
    const categories = getPublishCategoriesForTime(now);
    
    const newsToPublish: NewsItem[] = [];
    
    for (const category of categories) {
      for (const [, news] of preparedNews) {
        if (news.category === category) {
          newsToPublish.push(news);
          break;
        }
      }
    }
    
    return newsToPublish;
  };
}
