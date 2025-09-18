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
  name = name.replace(/_investment_summary$/gi, ' 요약');
  
  // 남은 언더스코어를 공백으로 변경
  name = name.replace(/_/g, ' ');
  
  return name;
};

export default function Home() {
  const [folders, setFolders] = useState<DateFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderDetails | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    setError(null);
    
    try {
      const response = await fetch('/api/folders');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setFolders(data.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
      console.error('Error fetching folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  const fetchFolderFiles = async (folderId: string) => {
    setLoadingFiles(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/folders/${folderId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedFolder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folder files');
      console.error('Error fetching folder files:', err);
    } finally {
      setLoadingFiles(false);
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
    fetchFolders();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">뉴스 아카이브</h1>
            <p className="text-gray-600 mt-1">날짜별 뉴스를 탐색하고 공유하세요</p>
          </div>
          <button
            onClick={fetchFolders}
            disabled={loadingFolders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingFolders ? '로딩 중...' : '새로고침'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 날짜 폴더 목록 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              날짜 폴더 ({folders.length})
            </h2>
            
            {loadingFolders && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loadingFolders && folders.length === 0 && !error && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">날짜 폴더가 없습니다.</p>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                    selectedFolder?.folder.id === folder.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => fetchFolderFiles(folder.id)}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">
                    📅 {folder.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    수정: {formatDate(folder.modifiedTime)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    클릭하여 뉴스 보기
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 폴더의 파일 목록 */}
          <div className="lg:sticky lg:top-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">뉴스 목록</h2>
              {selectedFolder && (
                <span className="text-sm text-gray-600">
                  {selectedFolder.totalFiles}개 파일
                </span>
              )}
            </div>
            
            {!selectedFolder && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">
                  왼쪽에서 날짜를 선택하면 해당 날짜의 뉴스를 볼 수 있습니다.
                </p>
              </div>
            )}

            {loadingFiles && (
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              </div>
            )}

            {selectedFolder && !loadingFiles && (
              <div className="space-y-3">
                {/* 폴더 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    📁 {selectedFolder.folder.name}
                  </h3>
                  <p className="text-sm text-blue-700">
                    수정: {formatDate(selectedFolder.folder.modifiedTime)}
                  </p>
                </div>

                {/* 파일 목록 */}
                {selectedFolder.files.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      이 날짜에는 일반 txt 파일이 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedFolder.files.map((file) => {
                      const categoryInfo = getFileCategory(file.name);
                      const reportDate = extractReportDate(file.name);
                      
                      return (
                        <div
                          key={file.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* 카테고리 배지 */}
                          <div className="mb-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                              {categoryInfo.icon} {categoryInfo.category}
                            </span>
                            {reportDate && (
                              <span className="ml-2 text-xs text-gray-500">
                                📅 {reportDate}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-semibold text-gray-900 flex-1 text-sm leading-tight">
                              {formatFileName(file.name)}
                            </h4>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>📝 수정: {formatDate(file.modifiedTime)}</span>
                            <span>📊 {formatFileSize(file.size)}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link
                              href={`/news/${file.id}`}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 text-center font-medium transition-all"
                            >
                              📖 투자 리포트 보기
                            </Link>
                            <button
                              onClick={() => copyNewsLink(file.id)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                              title="링크 복사하여 공유하기"
                            >
                              🔗
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">사용법</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>날짜 선택:</strong> 왼쪽 목록에서 날짜를 클릭하면 해당 날짜의 뉴스 파일들을 볼 수 있습니다</li>
            <li>• <strong>뉴스 읽기:</strong> "📖 읽기" 버튼을 클릭하면 뉴스 전체 내용을 볼 수 있습니다</li>
            <li>• <strong>링크 공유:</strong> "🔗" 버튼을 클릭하면 해당 뉴스의 고유 링크가 복사됩니다</li>
            <li>• <strong>외부 공유:</strong> 복사된 링크를 다른 사람에게 보내면 같은 뉴스를 볼 수 있습니다</li>
            <li>• *_card.txt 파일은 표시되지 않으며, 일반 .txt 파일만 표시됩니다</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
