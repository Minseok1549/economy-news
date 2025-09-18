import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

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