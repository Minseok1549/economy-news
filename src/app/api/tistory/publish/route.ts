import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { publishToWordPress, formatNewsForWordPress } from '@/lib/tistory';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

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

/**
 * 선택된 뉴스를 Tistory에 발행합니다
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileIds, title, customContent } = body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No files selected' }, { status: 400 });
    }

    // Google Drive에서 선택된 파일들의 내용 가져오기
    const drive = await getDriveService();
    const newsItems = [];

    for (const fileId of fileIds) {
      try {
        // 파일 메타데이터 가져오기
        const fileMetadata = await drive.files.get({
          fileId: fileId,
          fields: 'id,name',
        });

        const content = await getFileContent(drive, fileId);
        
        newsItems.push({
          name: fileMetadata.data.name?.replace('.txt', '').replace('_card', '') || 'Untitled',
          content: content,
        });
      } catch (error) {
        console.error(`Error fetching file ${fileId}:`, error);
      }
    }

    if (newsItems.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch news content' }, { status: 500 });
    }

    // WordPress 포스트 형식으로 변환
    let post;
    if (customContent) {
      // 사용자가 커스텀 내용을 입력한 경우
      post = {
        title: title || `📊 경제 뉴스 브리핑 - ${new Date().toLocaleDateString('ko-KR')}`,
        content: customContent,
        status: 'publish' as const,
        excerpt: customContent.substring(0, 150),
      };
    } else {
      // 자동 포맷팅
      const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      post = formatNewsForWordPress(newsItems, today);
      if (title) {
        post.title = title;
      }
    }

    // WordPress에 발행
    const result = await publishToWordPress(post);

    if (result.success) {
      return NextResponse.json({
        success: true,
        postId: result.postId,
        url: result.url,
        status: result.status,
        message: 'Successfully published to WordPress',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('WordPress publish error:', error);
    return NextResponse.json(
      {
        error: 'Failed to publish to WordPress',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
