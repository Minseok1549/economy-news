import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

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
  // 환경 변수 디버깅
  const envVars = {
    hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
    hasPrivateKeyId: !!process.env.GOOGLE_PRIVATE_KEY_ID,
    hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    hasPrivateKeyBase64: !!process.env.GOOGLE_PRIVATE_KEY_BASE64,
    hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    projectId: process.env.GOOGLE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
    privateKeyBase64Length: process.env.GOOGLE_PRIVATE_KEY_BASE64?.length || 0,
  };
  
  console.log('Environment variables check:', envVars);

  // 필수 환경 변수 검증
  const requiredVars = ['GOOGLE_PROJECT_ID', 'GOOGLE_CLIENT_EMAIL', 'GOOGLE_PRIVATE_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Private key 처리 - 두 가지 형식 모두 지원
  let privateKey: string;
  if (process.env.GOOGLE_PRIVATE_KEY) {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    
    // 실제 줄바꿈이 있는지 확인 (Vercel 방식)
    if (rawKey.includes('\n')) {
      privateKey = rawKey; // 이미 실제 줄바꿈이 있음
      console.log('Using multiline GOOGLE_PRIVATE_KEY (Vercel style)');
      console.log('Private key length:', rawKey.length);
      console.log('First 100 chars:', rawKey.substring(0, 100));
      console.log('Last 100 chars:', rawKey.substring(rawKey.length - 100));
    } else {
      // 이스케이프 문자가 있는 경우 (.env 파일 방식)
      privateKey = rawKey.replace(/\\n/g, '\n');
      console.log('Using escaped GOOGLE_PRIVATE_KEY (local .env style)');
      console.log('Original key length:', rawKey.length);
      console.log('Processed key length:', privateKey.length);
    }
  } else if (process.env.GOOGLE_PRIVATE_KEY_BASE64) {
    try {
      privateKey = Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
      console.log('Using Base64 encoded private key (fallback)');
    } catch (error) {
      console.error('Error decoding Base64 private key:', error);
      throw new Error('Invalid Base64 private key');
    }
  } else {
    throw new Error('No private key found (neither GOOGLE_PRIVATE_KEY nor GOOGLE_PRIVATE_KEY_BASE64)');
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

  console.log('Credentials object created with client_email:', credentials.client_email);
  console.log('Private key starts with:', privateKey);

  const auth = new google.auth.GoogleAuth({
    credentials,
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
    console.log('=== DEBUG: Environment Check ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    console.log('Environment variables present:');
    console.log('- GOOGLE_PROJECT_ID:', !!process.env.GOOGLE_PROJECT_ID);
    console.log('- GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('- GOOGLE_CLIENT_EMAIL:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('- NEWS_SUMMARIES_FOLDER_ID:', !!process.env.NEWS_SUMMARIES_FOLDER_ID);
    
    // 환경 변수 확인
    if (!NEWS_SUMMARIES_FOLDER_ID) {
      return NextResponse.json({ 
        error: 'NEWS_SUMMARIES_FOLDER_ID 환경 변수가 설정되지 않았습니다.',
        debug: {
          hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
          hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          nodeEnv: process.env.NODE_ENV,
          isVercel: !!process.env.VERCEL,
        }
      }, { status: 500 });
    }

    const drive = await getDriveService();
    
    // 먼저 폴더가 존재하는지 확인
    try {
      const folderCheck = await drive.files.get({
        fileId: NEWS_SUMMARIES_FOLDER_ID,
        fields: 'id,name'
      });
      
      console.log('Parent folder found:', folderCheck.data.name);
    } catch (folderError) {
      console.error('Parent folder access error:', folderError);
      return NextResponse.json({ 
        error: `폴더 접근 권한이 없거나 존재하지 않습니다. 폴더 ID: ${NEWS_SUMMARIES_FOLDER_ID}`,
        details: folderError instanceof Error ? folderError.message : 'Unknown error'
      }, { status: 404 });
    }
    
    // News_Summaries 폴더 하위의 모든 폴더 가져오기
    const response = await drive.files.list({
      q: `'${NEWS_SUMMARIES_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      orderBy: 'modifiedTime desc',
    });

    const allFolders = response.data.files || [];
    
    // 디버깅 정보 출력
    console.log(`Found ${allFolders.length} folders in parent folder`);
    
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

    console.log(`Filtered to ${sortedFolders.length} date folders`);

    return NextResponse.json({ 
      folders: sortedFolders,
      totalFolders: sortedFolders.length,
      debug: {
        parentFolderId: NEWS_SUMMARIES_FOLDER_ID,
        totalFound: allFolders.length,
        dateFiltered: sortedFolders.length,
        allFolderNames: allFolders.map(f => f.name).slice(0, 10) // 처음 10개만
      }
    });

  } catch (error) {
    console.error('Error in date folders API:', error);
    return NextResponse.json({ 
      error: '날짜 폴더를 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}