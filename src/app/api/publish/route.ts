import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { rewriteNewsContent } from '@/lib/ai';
import { 
  CATEGORIES,
  getCategoryLabel, 
  extractCategoryFromFileName,
  type NewsItem,
  type Category
} from '@/lib/scheduler';
import { publishToWordPress } from '@/lib/tistory';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const NEWS_SUMMARIES_FOLDER_ID = process.env.NEWS_SUMMARIES_FOLDER_ID;

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

// 발행 순서 추적 (0부터 시작, 매일 초기화됨)
let publishIndex = 0;

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
      orderBy: 'modifiedTime asc',  // 오래된 파일부터 (생성 순서대로)
    });

    const files = response.data.files || [];
    // _card.txt가 붙지 않은 .txt 파일만 가져오기 (_published 포함)
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

/**
 * GET /api/publish - 현재 발행 상태 조회
 */
export async function GET() {
  try {
    const now = new Date();
    const currentCategory = CATEGORIES[publishIndex % CATEGORIES.length];
    
    return NextResponse.json({
      currentTime: now.toISOString(),
      currentHour: now.getHours(),
      publishIndex: publishIndex,
      totalPublished: publishIndex,
      currentCategory: currentCategory,
      currentCategoryLabel: getCategoryLabel(currentCategory),
      nextCategory: CATEGORIES[(publishIndex + 1) % CATEGORIES.length],
      nextCategoryLabel: getCategoryLabel(CATEGORIES[(publishIndex + 1) % CATEGORIES.length]),
    });
  } catch (error) {
    console.error('발행 대상 조회 오류:', error);
    return NextResponse.json(
      { error: '발행 대상 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/publish - Google Drive에서 뉴스 가져와 AI 재작성 후 WordPress에 발행
 */
export async function POST() {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    // 현재 발행할 카테고리 결정 (순환)
    const currentCategory = CATEGORIES[publishIndex % CATEGORIES.length];
    console.log(`📅 발행 요청 #${publishIndex + 1} - 카테고리: ${getCategoryLabel(currentCategory)}`);
    
    // 1. Google Drive에서 오늘의 뉴스 가져오기
    const drive = await getDriveService();
    const todayFolderId = await findTodayFolder(drive);
    
    if (!todayFolderId) {
      return NextResponse.json(
        { 
          error: '오늘 날짜 폴더를 찾을 수 없습니다.',
          currentTime: now.toISOString(),
          currentHour: hour,
        },
        { status: 404 }
      );
    }

    const files = await getCardTextFiles(drive, todayFolderId);
    
    if (files.length === 0) {
      return NextResponse.json(
        { 
          error: '오늘 날짜 폴더에 뉴스 파일이 없습니다.',
          currentTime: now.toISOString(),
          currentHour: hour,
        },
        { status: 404 }
      );
    }
    
    console.log(`📁 전체 파일 ${files.length}개 발견`);
    
    // 2. 현재 카테고리에 해당하는 파일 찾기
    const categoryFiles = files.filter(file => {
      const fileCategory = extractCategoryFromFileName(file.name!);
      return fileCategory === currentCategory;
    });
    
    console.log(`📰 ${getCategoryLabel(currentCategory)} 파일 ${categoryFiles.length}개 발견`);
    
    if (categoryFiles.length === 0) {
      return NextResponse.json({
        message: `${getCategoryLabel(currentCategory)} 카테고리 뉴스가 없습니다.`,
        currentTime: now.toISOString(),
        currentHour: hour,
        category: currentCategory,
        publishIndex: publishIndex,
        totalPublished: 0,
      });
    }
    
    // 3. 해당 카테고리의 첫 번째 파일 선택
    const file = categoryFiles[0];
    console.log(`🎯 발행 대상: ${file.name}`);
    
    // 4. 파일 처리: AI 재작성 → WordPress 발행
    try {
      const originalContent = await getFileContent(drive, file.id!);
      const originalTitle = file.name!.replace('.txt', '');
      const category = extractCategoryFromFileName(file.name!);
      
      console.log(`🤖 AI 재작성 중: ${originalTitle} (${category})`);
      
      // AI로 재작성
      const rewritten = await rewriteNewsContent(
        originalTitle,
        originalContent,
        category
      );
      
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
      
      console.log(`✅ AI 재작성 완료: ${rewritten.title}`);
      
      // WordPress에 발행
      console.log(`📝 WordPress 발행 중...`);
      const result = await publishToWordPress({
        title: newsItem.title,
        content: formatContentForWordPress(newsItem),
        status: 'publish',
        excerpt: newsItem.summary || '',
      });
      
      if (result.success) {
        // 발행 성공 - 인덱스 증가
        publishIndex++;
        
        console.log(`✅ 발행 성공: ${result.url}`);
        console.log(`📊 다음 발행: ${getCategoryLabel(CATEGORIES[publishIndex % CATEGORIES.length])}`);
        
        return NextResponse.json({
          message: '뉴스 발행 완료',
          currentTime: now.toISOString(),
          currentHour: hour,
          publishIndex: publishIndex,
          totalPublished: publishIndex,
          totalRemaining: CATEGORIES.length - (publishIndex % CATEGORIES.length),
          nextCategory: getCategoryLabel(CATEGORIES[publishIndex % CATEGORIES.length]),
          result: {
            id: file.id,
            fileName: file.name,
            title: newsItem.title,
            category,
            categoryLabel: getCategoryLabel(category),
            success: true,
            url: result.url,
          },
        });
      } else {
        console.error(`❌ 발행 실패: ${result.error}`);
        return NextResponse.json({
          message: '뉴스 발행 실패',
          currentTime: now.toISOString(),
          currentHour: hour,
          publishIndex: publishIndex,
          totalPublished: publishIndex,
          result: {
            id: file.id,
            fileName: file.name,
            title: newsItem.title,
            category,
            success: false,
            error: result.error,
          },
        });
      }
      
    } catch (error) {
      console.error(`❌ 파일 처리 실패 (${file.name}):`, error);
      return NextResponse.json(
        {
          error: '뉴스 처리 중 오류가 발생했습니다.',
          fileName: file.name,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ 발행 오류:', error);
    return NextResponse.json(
      {
        error: '발행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 뉴스 콘텐츠를 WordPress 형식으로 변환
 */
function formatContentForWordPress(news: NewsItem): string {
  let html = '';
  
  // Helper function to convert **text** to <strong>text</strong>
  const formatBoldText = (text: string): string => {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  };
  
  // 카테고리 뱃지
  html += `<div style="margin-bottom: 25px;">`;
  html += `<span style="background-color: #007bff; color: white; padding: 8px 20px; border-radius: 25px; font-size: 14px; font-weight: 600; box-shadow: 0 2px 8px rgba(0,123,255,0.3);">`;
  html += `${getCategoryLabel(news.category)}`;
  html += `</span>`;
  html += `</div>\n\n`;
  
  // 한 줄 요약 (강조 박스)
  if (news.summary) {
    html += `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; margin-bottom: 35px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">`;
    html += `<div style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 10px;">📌 한 줄 요약</div>`;
    html += `<p style="color: white; font-size: 17px; line-height: 1.6; margin: 0;">${formatBoldText(news.summary)}</p>`;
    html += `</div>\n\n`;
  }
  
  // 본문 내용 (단락 구분과 스타일링, **텍스트** 볼드 처리)
  const paragraphs = news.content.split('\n\n');
  
  paragraphs.forEach((paragraph, index) => {
    if (paragraph.trim()) {
      // 첫 단락은 좀 더 큰 글씨로
      const fontSize = index === 0 ? '18px' : '16px';
      const fontWeight = index === 0 ? '500' : '400';
      
      html += `<p style="line-height: 1.9; font-size: ${fontSize}; font-weight: ${fontWeight}; margin-bottom: 25px; color: #333;">`;
      html += formatBoldText(paragraph.replace(/\n/g, '<br>'));
      html += `</p>\n\n`;
    }
  });
  
  // 투자 전략 팁 (있는 경우)
  if (news.investmentTip) {
    html += `<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 25px; border-radius: 12px; margin: 35px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">`;
    html += `<div style="color: white; font-size: 18px; font-weight: 700; margin-bottom: 15px;">📊 투자 포인트</div>`;
    html += `<p style="color: white; font-size: 16px; line-height: 1.8; margin: 0;">${formatBoldText(news.investmentTip)}</p>`;
    html += `</div>\n\n`;
  }
  
  // 원본 내용 섹션 (NewsDetailPage 스타일)
  if (news.originalContent || news.originalTitle) {
    console.log('=== 원본 내용 디버깅 ===');
    console.log('originalTitle:', news.originalTitle);
    console.log('originalContent 존재:', !!news.originalContent);
    console.log('originalContent 길이:', news.originalContent?.length || 0);
    console.log('originalContent 미리보기:', news.originalContent?.substring(0, 100));
    
    html += `<hr style="margin: 50px 0; border: none; border-top: 2px solid #e5e7eb;">\n`;
    
    // 원본 참고자료 섹션
    html += `<div style="background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; margin: 30px 0;">`;
    
    // 헤더
    html += `<div style="background: linear-gradient(to right, #1e40af, #1e3a8a); padding: 20px 24px;">`;
    html += `<h2 style="color: white; font-size: 20px; font-weight: 700; margin: 0;">📄 원본 투자 리포트</h2>`;
    html += `</div>`;
    
    // 본문
    html += `<div style="padding: 24px;">`;
    
    if (news.originalTitle) {
      html += `<div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">`;
      html += `<h4 style="color: #6b7280; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">제목</h4>`;
      html += `<p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0; line-height: 1.6;">${news.originalTitle}</p>`;
      html += `</div>`;
    }
    
    if (news.originalContent) {
      html += `<div>`;
      html += `<h4 style="color: #6b7280; font-size: 13px; font-weight: 600; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px;">내용</h4>`;
      html += `<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">`;
      
      // 원본 내용을 단락으로 나누어 포맷팅
      const originalParagraphs = news.originalContent.split('\n\n');
      originalParagraphs.forEach((paragraph: string, index: number) => {
        if (paragraph.trim()) {
          // ### 제목 처리
          if (paragraph.trim().startsWith('###')) {
            html += `<h3 style="color: #1f2937; font-size: 18px; font-weight: 700; margin: ${index > 0 ? '24px' : '0'} 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #3b82f6;">`;
            html += formatBoldText(paragraph.replace('###', '').trim());
            html += `</h3>`;
          }
          // ** 섹션 헤더 처리
          else if (paragraph.trim().startsWith('**') && paragraph.trim().endsWith('**')) {
            html += `<h4 style="color: #374151; font-size: 16px; font-weight: 600; margin: ${index > 0 ? '20px' : '0'} 0 10px 0;">`;
            html += paragraph.replace(/\*\*/g, '').trim();
            html += `</h4>`;
          }
          // 테이블 처리 (| 포함된 경우)
          else if (paragraph.includes('|')) {
            const lines = paragraph.split('\n');
            html += `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">`;
            lines.forEach((line: string, lineIndex: number) => {
              if (line.includes('---')) return; // 구분선 스킵
              const cells = line.split('|').map((cell: string) => cell.trim()).filter((cell: string) => cell);
              if (cells.length > 0) {
                if (lineIndex === 0) {
                  html += `<thead><tr>`;
                  cells.forEach((cell: string) => {
                    html += `<th style="background-color: #e5e7eb; padding: 10px 12px; text-align: left; font-weight: 600; border: 1px solid #d1d5db;">${formatBoldText(cell)}</th>`;
                  });
                  html += `</tr></thead><tbody>`;
                } else {
                  html += `<tr>`;
                  cells.forEach((cell: string) => {
                    html += `<td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${formatBoldText(cell)}</td>`;
                  });
                  html += `</tr>`;
                }
              }
            });
            html += `</tbody></table>`;
          }
          // 리스트 처리 (- 로 시작)
          else if (paragraph.trim().startsWith('- ')) {
            html += `<ul style="margin: 12px 0; padding-left: 20px; list-style-type: disc;">`;
            const items = paragraph.split('\n').filter((item: string) => item.trim().startsWith('- '));
            items.forEach((item: string) => {
              html += `<li style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 6px 0;">${formatBoldText(item.substring(2))}</li>`;
            });
            html += `</ul>`;
          }
          // 일반 단락
          else {
            html += `<p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: ${index > 0 ? '12px' : '0'} 0;">`;
            html += formatBoldText(paragraph.replace(/\n/g, '<br>'));
            html += `</p>`;
          }
        }
      });
      
      html += `</div>`;
      html += `</div>`;
    }
    
    html += `</div>`;
    html += `</div>\n`;
  } else {
    console.log('⚠️ 원본 내용 없음 - originalContent:', !!news.originalContent, 'originalTitle:', !!news.originalTitle);
  }
  
  // 푸터 정보
  html += `<div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #ffc107;">`;
  html += `<p style="color: #856404; font-size: 13px; margin: 0; line-height: 1.6;">`;
  html += `💡 <strong>알림:</strong> 이 기사는 AI가 원본 투자 리포트를 쉽게 재작성한 것입니다. 투자 결정은 신중하게 하시기 바랍니다.`;
  html += `</p>`;
  html += `</div>\n`;
  
  return html;
}


