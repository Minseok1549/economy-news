import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// News_Summaries 폴더 ID (환경 변수로 설정 가능)
const NEWS_SUMMARIES_FOLDER_ID = process.env.NEWS_SUMMARIES_FOLDER_ID;

interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface NewsItem {
  id: string;
  name: string;
  content: string;
  modifiedTime?: string;
}

// Google Drive 클라이언트 초기화
async function getDriveService() {
  // Private key 처리 - Base64 우선, 일반 텍스트는 백업
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

// 오늘 날짜 폴더 이름 후보들 생성
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

// 오늘 날짜 폴더 찾기
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

// 폴더 내 *_card.txt 파일들 가져오기
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCardTextFiles(drive: any, folderId: string): Promise<DriveFile[]> {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/plain' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return files.filter((file: any) => file.name && file.name.endsWith('_card.txt'));
  } catch (error) {
    console.error('Error getting card text files:', error);
    return [];
  }
}

// 파일 내용 읽기
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

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest
) {
  try {
    const drive = await getDriveService();
    
    // 오늘 날짜 폴더 찾기
    const todayFolderId = await findTodayFolder(drive);
    if (!todayFolderId) {
      return NextResponse.json({ 
        error: '오늘 날짜 폴더를 찾을 수 없습니다. 폴더 이름을 확인해주세요.' 
      }, { status: 404 });
    }

    // *_card.txt 파일들 가져오기
    const files = await getCardTextFiles(drive, todayFolderId);
    if (files.length === 0) {
      return NextResponse.json({ 
        news: [],
        message: '오늘 날짜 폴더에 *_card.txt 파일이 없습니다.' 
      });
    }

    // 각 파일의 내용 읽기
    const newsItems: NewsItem[] = [];
    
    for (const file of files) {
      const content = await getFileContent(drive, file.id!);
      newsItems.push({
        id: file.id!,
        name: file.name!.replace('_card.txt', ''),
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // 미리보기용으로 500자만
        modifiedTime: file.modifiedTime,
      });
    }

    return NextResponse.json({ 
      news: newsItems,
      totalFiles: files.length,
      folderName: `오늘 (${getTodayFolderNames()[0]})`
    });

  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json({ 
      error: '뉴스를 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}