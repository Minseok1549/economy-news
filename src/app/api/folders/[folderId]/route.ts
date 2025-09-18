import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

interface TextFile {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

// Google Drive 클라이언트 초기화
async function getDriveService() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

// 폴더 내 txt 파일들 가져오기 (_card.txt 제외)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTextFiles(drive: any, folderId: string): Promise<TextFile[]> {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='text/plain' and trashed=false`,
      fields: 'files(id,name,modifiedTime,size)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];
    
    // _card.txt가 아닌 일반 txt 파일만 필터링
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return files.filter((file: any) => 
      file.name && 
      file.name.endsWith('.txt') && 
      !file.name.endsWith('_card.txt')
    );
  } catch (error) {
    console.error('Error getting text files:', error);
    return [];
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const folderId = resolvedParams.folderId;
    
    if (!folderId) {
      return NextResponse.json({ 
        error: '폴더 ID가 필요합니다.' 
      }, { status: 400 });
    }

    const drive = await getDriveService();
    
    // 폴더 정보 가져오기
    const folderResponse = await drive.files.get({
      fileId: folderId,
      fields: 'id,name,modifiedTime',
    });
    
    // 폴더 내 txt 파일들 가져오기
    const files = await getTextFiles(drive, folderId);

    return NextResponse.json({ 
      folder: {
        id: folderResponse.data.id,
        name: folderResponse.data.name,
        modifiedTime: folderResponse.data.modifiedTime,
      },
      files: files,
      totalFiles: files.length,
    });

  } catch (error) {
    console.error('Error in folder files API:', error);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 404) {
      return NextResponse.json({ 
        error: '폴더를 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: '폴더의 파일을 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}