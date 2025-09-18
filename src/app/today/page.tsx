'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DateFolder {
  id: string;
  name: string;
  modifiedTime?: string;
}

interface TextFile {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}

interface FolderDetails {
  folder: {
    id: string;
    name: string;
    modifiedTime?: string;
  };
  files: TextFile[];
  totalFiles: number;
}

const getFileCategory = (fileName: string) => {
  const name = fileName.toLowerCase();
  if (name.includes('technology')) return { category: 'Technology', color: 'bg-blue-100 text-blue-800', icon: '💻' };
  if (name.includes('economy')) return { category: 'Economy', color: 'bg-green-100 text-green-800', icon: '📈' };
  if (name.includes('health')) return { category: 'Health', color: 'bg-red-100 text-red-800', icon: '🏥' };
  if (name.includes('environment')) return { category: 'Environment', color: 'bg-emerald-100 text-emerald-800', icon: '🌿' };
  if (name.includes('sports')) return { category: 'Sports', color: 'bg-orange-100 text-orange-800', icon: '⚽' };
  if (name.includes('science')) return { category: 'Science', color: 'bg-purple-100 text-purple-800', icon: '🔬' };
  if (name.includes('politics')) return { category: 'Politics', color: 'bg-gray-100 text-gray-800', icon: '🏛️' };
  if (name.includes('culture')) return { category: 'Culture & Arts', color: 'bg-pink-100 text-pink-800', icon: '🎨' };
  if (name.includes('business')) return { category: 'Business & Finance', color: 'bg-yellow-100 text-yellow-800', icon: '💼' };
  if (name.includes('world')) return { category: 'World Affairs', color: 'bg-indigo-100 text-indigo-800', icon: '🌍' };
  return { category: 'Investment Report', color: 'bg-gray-100 text-gray-800', icon: '📊' };
};

const extractReportDate = (fileName: string) => {
  const match = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) {
    try {
      const date = new Date(match[1]);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return match[1];
    }
  }
  return null;
};

// 파일명을 한국어 형식으로 포맷팅하는 함수
const formatFileName = (fileName: string) => {
  // .txt 제거
  let name = fileName.replace('.txt', '');
  
  // 날짜 패턴 찾기 (2025-09-15 형태)
  const dateMatch = name.match(/^(\d{4})-(\d{2})-(\d{2})_/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    // 날짜 부분을 한국어 형식으로 변경
    name = name.replace(/^\d{4}-\d{2}-\d{2}_/, `${year}.${month}.${day} `);
  }
  
  // 카테고리를 한국어로 변환
  name = name.replace(/technology/gi, '기술')
              .replace(/economy/gi, '경제')
              .replace(/health/gi, '건강')
              .replace(/environment/gi, '환경')
              .replace(/sports/gi, '스포츠')
              .replace(/science/gi, '과학')
              .replace(/politics/gi, '정치')
              .replace(/culture_arts/gi, '문화예술')
              .replace(/business_finance/gi, '비즈니스금융')
              .replace(/world_affairs/gi, '국제정세');
  
  // _investment_summary 제거 및 요약으로 변경
  name = name.replace(/_investment_summary$/gi, ' ');
  
  // 남은 언더스코어를 공백으로 변경
  name = name.replace(/_/g, ' ');
  
  return name;
};

export default function TodayPage() {
  const [todayFolder, setTodayFolder] = useState<FolderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 오늘 날짜 (2025-09-19)
  const TODAY_DATE = '2025-09-19';

  const fetchTodayNews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 먼저 모든 폴더를 가져와서 오늘 날짜 폴더 찾기
      const foldersResponse = await fetch('/api/folders');
      
      if (!foldersResponse.ok) {
        const errorData = await foldersResponse.json();
        throw new Error(errorData.error || `HTTP error! status: ${foldersResponse.status}`);
      }
      
      const foldersData = await foldersResponse.json();
      const folders: DateFolder[] = foldersData.folders || [];
      
      // 오늘 날짜에 해당하는 폴더 찾기
      const todayFolderData = folders.find(folder => folder.name === TODAY_DATE);
      
      if (!todayFolderData) {
        throw new Error(`${TODAY_DATE} 날짜의 폴더를 찾을 수 없습니다.`);
      }
      
      // 해당 폴더의 파일들 가져오기
      const filesResponse = await fetch(`/api/folders/${todayFolderData.id}`);
      
      if (!filesResponse.ok) {
        const errorData = await filesResponse.json();
        throw new Error(errorData.error || `HTTP error! status: ${filesResponse.status}`);
      }
      
      const filesData = await filesResponse.json();
      setTodayFolder(filesData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s news');
      console.error('Error fetching today\'s news:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (sizeString?: string) => {
    if (!sizeString) return '';
    
    const bytes = parseInt(sizeString);
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  const copyNewsLink = (fileId: string) => {
    const link = `${window.location.origin}/news/${fileId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('뉴스 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('링크 복사에 실패했습니다.');
    });
  };

  useEffect(() => {
    fetchTodayNews();
  }, []);

  return (
    <main className="bg-white min-h-screen">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
          
            <div>
              <h1 className="text-xl font-bold text-gray-900">오늘의 뉴스</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(TODAY_DATE).toLocaleDateString('ko-KR', { 
                  month: 'short', 
                  day: 'numeric',
                  weekday: 'short'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={fetchTodayNews}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 border-t-purple-600"></div>
        </div>
      )}

      {!loading && todayFolder && (
        <div className="space-y-3">
          {/* 뉴스 목록 */}
          {todayFolder.files.length === 0 ? (
            <div className="text-center py-16 mx-4">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">뉴스가 없습니다</h3>
              <p className="text-gray-500 text-sm">오늘은 아직 등록된 뉴스가 없어요</p>
            </div>
          ) : (
            <div className="px-4 space-y-3">
              {todayFolder.files.map((file) => {
                const categoryInfo = getFileCategory(file.name);
                
                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    {/* 카테고리 */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${categoryInfo.color}`}>
                        {categoryInfo.icon} {categoryInfo.category}
                      </span>
                      <button
                        onClick={() => copyNewsLink(file.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-bold text-gray-900 mb-4 text-base leading-snug">
                      {formatFileName(file.name)}
                    </h3>
                    
                    {/* 읽기 버튼 */}
                    <Link
                      href={`/news/${file.id}`}
                      className="block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-center text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all"
                    >
                      리포트 읽기
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}