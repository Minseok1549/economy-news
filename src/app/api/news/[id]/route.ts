import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import path from 'path';

// 서비스 계정 키 파일 경로
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Google Drive 클라이언트 초기화
async function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

// 파일 내용과 메타데이터 가져오기
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFileDetails(drive: any, fileId: string) {
  try {
    // 파일 메타데이터 가져오기
    const metaResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,modifiedTime,size',
    });

    // 파일 내용 가져오기
    const contentResponse = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    return {
      ...metaResponse.data,
      content: contentResponse.data || '',
    };
  } catch (error) {
    console.error('Error getting file details:', error);
    throw error;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const fileId = resolvedParams.id;
    
    if (!fileId) {
      return NextResponse.json({ 
        error: '파일 ID가 필요합니다.' 
      }, { status: 400 });
    }

    const drive = await getDriveService();
    const fileDetails = await getFileDetails(drive, fileId);

    return NextResponse.json({
      id: fileDetails.id,
      name: fileDetails.name,
      content: fileDetails.content,
      modifiedTime: fileDetails.modifiedTime,
      size: fileDetails.size,
    });

  } catch (error) {
    console.error('Error in news detail API:', error);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === 404) {
      return NextResponse.json({ 
        error: '파일을 찾을 수 없습니다.' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      error: '파일을 가져오는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}