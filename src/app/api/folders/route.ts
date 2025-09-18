import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

// 서비스 계정 키 파일 경로
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// News_Summaries 폴더 ID (환경 변수로 설정 가능)
const NEWS_SUMMARIES_FOLDER_ID = process.env.NEWS_SUMMARIES_FOLDER_ID;

interface DateFolder {
  id: string;
  name: string;
  modifiedTime?: string;
}

// Google Drive 클라이언트 초기화
async function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

// 날짜 형식인지 확인하는 함수
function isDateFolder(folderName: string): boolean {
  // 다양한 날짜 형식을 지원
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // 2025-01-17
    /^\d{8}$/, // 20250117
    /^\d{4}\.\d{2}\.\d{2}$/, // 2025.01.17
    /^\d{4}년\s*\d{1,2}월\s*\d{1,2}일$/, // 2025년 1월 17일
  ];
  
  return datePatterns.some(pattern => pattern.test(folderName));
}

// 날짜 폴더들을 날짜 순으로 정렬하는 함수
function sortDateFolders(folders: DateFolder[]): DateFolder[] {
  return folders.sort((a, b) => {
    // 날짜를 파싱해서 정렬
    const dateA = parseDateFromFolderName(a.name);
    const dateB = parseDateFromFolderName(b.name);
    
    if (dateA && dateB) {
      return dateB.getTime() - dateA.getTime(); // 최신 날짜가 위로
    }
    
    // 파싱할 수 없으면 이름으로 정렬
    return b.name.localeCompare(a.name);
  });
}

// 폴더 이름에서 날짜 파싱
function parseDateFromFolderName(folderName: string): Date | null {
  try {
    // 2025-01-17 형식
    if (/^\d{4}-\d{2}-\d{2}$/.test(folderName)) {
      return new Date(folderName);
    }
    
    // 20250117 형식
    if (/^\d{8}$/.test(folderName)) {
      const year = folderName.substring(0, 4);
      const month = folderName.substring(4, 6);
      const day = folderName.substring(6, 8);
      return new Date(`${year}-${month}-${day}`);
    }
    
    // 2025.01.17 형식
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(folderName)) {
      return new Date(folderName.replace(/\./g, '-'));
    }
    
    // 2025년 1월 17일 형식
    const koreanMatch = folderName.match(/^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/);
    if (koreanMatch) {
      const year = koreanMatch[1];
      const month = koreanMatch[2].padStart(2, '0');
      const day = koreanMatch[3].padStart(2, '0');
      return new Date(`${year}-${month}-${day}`);
    }
  } catch (error) {
    console.error('Error parsing date from folder name:', folderName, error);
  }
  
  return null;
}

export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _request: NextRequest
) {
  try {
    const drive = await getDriveService();
    
    // News_Summaries 폴더 하위의 모든 폴더 가져오기
    const response = await drive.files.list({
      q: `'${NEWS_SUMMARIES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    const allFolders = response.data.files || [];
    
    // 날짜 형식 폴더만 필터링
    const dateFolders: DateFolder[] = allFolders
      .filter(folder => folder.name && isDateFolder(folder.name))
      .map(folder => ({
        id: folder.id!,
        name: folder.name!,
        modifiedTime: folder.modifiedTime || undefined,
      }));

    // 날짜 순으로 정렬
    const sortedFolders = sortDateFolders(dateFolders);

    return NextResponse.json({ 
      folders: sortedFolders,
      totalFolders: sortedFolders.length,
    });

  } catch (error) {
    console.error('Error in date folders API:', error);
    return NextResponse.json({ 
      error: '날짜 폴더를 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}