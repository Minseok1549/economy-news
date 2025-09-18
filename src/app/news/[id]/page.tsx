'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface NewsDetail {
  id: string;
  name: string;
  content: string;
  modifiedTime?: string;
  size?: string;
}

export default function NewsDetailPage() {
  const params = useParams();
  const [newsDetail, setNewsDetail] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileId = params.id as string;

  const fetchNewsDetail = async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/news/${fileId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setNewsDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      console.error('Error fetching news detail:', err);
    } finally {
      setLoading(false);
    }
  };





  // 투자 리포트 내용을 파싱하고 구조화하는 함수
  const parseInvestmentReport = (content: string) => {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = '';
    let inTable = false;
    let inList = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 메인 헤더 (### 로 시작)
      if (trimmedLine.startsWith('### ')) {
        if (currentSection) {
          // 열린 태그들 닫기
          if (inTable) {
            currentContent += '</table>\n';
            inTable = false;
          }
          if (inList) {
            currentContent += '</ul>\n';
            inList = false;
          }
          sections.push({ ...currentSection, content: currentContent });
        }
        currentSection = {
          type: 'title',
          title: trimmedLine.replace('### ', ''),
          content: ''
        };
        currentContent = '';
      }
      // 섹션 헤더 (**로 감싸진 부분**)
      else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
        if (inTable) {
          currentContent += '</table>\n';
          inTable = false;
        }
        if (inList) {
          currentContent += '</ul>\n';
          inList = false;
        }
        currentContent += `<h3 class="section-header">${trimmedLine.replace(/\*\*/g, '')}</h3>`;
      }
      // 테이블 감지 (| 로 구분된 행)
      else if (trimmedLine.includes('|') && trimmedLine.split('|').length >= 3) {
        // 구분선 (---|---) 스킵
        if (trimmedLine.includes('---')) {
          continue;
        }
        
        if (!inTable) {
          if (inList) {
            currentContent += '</ul>\n';
            inList = false;
          }
          currentContent += '\n<table class="investment-table">';
          inTable = true;
        }
        
        const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
        const isHeader = !inTable || currentContent.split('<tr>').length <= 1;
        
        if (isHeader) {
          // 테이블 헤더에서도 **텍스트** 변환 적용
          const headerCells = cells.map(cell => {
            const convertedCell = cell.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
            return `<th>${convertedCell}</th>`;
          });
          currentContent += '<thead><tr>' + headerCells.join('') + '</tr></thead><tbody>';
        } else {
          // 테이블 데이터 셀에서도 **텍스트** 변환 적용
          const dataCells = cells.map(cell => {
            const convertedCell = cell.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
            return `<td>${convertedCell}</td>`;
          });
          currentContent += '<tr>' + dataCells.join('') + '</tr>';
        }
      }
      // 리스트 아이템 (- 로 시작)
      else if (trimmedLine.startsWith('- ')) {
        if (inTable) {
          currentContent += '</tbody></table>\n';
          inTable = false;
        }
        if (!inList) {
          currentContent += '\n<ul class="investment-list">';
          inList = true;
        }
        // 리스트 아이템에서도 **텍스트** 변환 적용
        let listContent = trimmedLine.substring(2);
        listContent = listContent.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
        currentContent += `<li>${listContent}</li>`;
      }
      // 번호 리스트 (1) 또는 1. 로 시작)
      else if (/^\d+[\)\.]\s/.test(trimmedLine)) {
        if (inTable) {
          currentContent += '</tbody></table>\n';
          inTable = false;
        }
        if (inList) {
          currentContent += '</ul>\n';
          inList = false;
        }
        if (!currentContent.includes('<ol class="numbered-list">')) {
          currentContent += '\n<ol class="numbered-list">';
        }
        // 번호 리스트 아이템에서도 **텍스트** 변환 적용
        let listContent = trimmedLine.replace(/^\d+[\)\.]\s/, '');
        listContent = listContent.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
        currentContent += `<li>${listContent}</li>`;
      }
      // 일반 텍스트
      else if (trimmedLine) {
        // 테이블이나 리스트가 끝났는지 확인하고 태그 닫기
        if (inTable && !trimmedLine.includes('|')) {
          currentContent += '</tbody></table>\n';
          inTable = false;
        }
        if (inList && !trimmedLine.startsWith('- ')) {
          currentContent += '</ul>\n';
          inList = false;
        }
        if (currentContent.includes('<ol class="numbered-list">') && !/^\d+[\)\.]\s/.test(trimmedLine)) {
          currentContent += '</ol>\n';
        }

        // **텍스트** 형태를 <strong>으로 변환 (개선된 정규식)
        let processedLine = trimmedLine;
        
        // **전체 라인**이 굵은 글씨인 경우 섹션 헤더로 이미 처리되었는지 확인
        const isFullLineBold = processedLine.startsWith('**') && processedLine.endsWith('**') && processedLine.length > 4;
        const hasNoOtherText = processedLine.replace(/\*\*/g, '').trim().indexOf(' ') === -1 || processedLine.replace(/\*\*/g, '').trim().length < 20;
        
        if (isFullLineBold && hasNoOtherText) {
          // 섹션 헤더로 처리되었으므로 스킵
        } else {
          // 라인 내의 **텍스트** 부분을 굵게 변환 (더 강력한 정규식 사용)
          processedLine = processedLine.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong>$1</strong>');
          

        }
        
        // 특별한 형식들 처리
        if (processedLine.startsWith('---')) {
          currentContent += '<hr class="section-divider">\n';
        } else if (processedLine.match(/^[A-Za-z가-힣\s]+:$/)) {
          // 카테고리 헤더 (예: "투자 기회:", "리스크 요인:")
          currentContent += `<h4 class="category-header">${processedLine}</h4>\n`;
        } else {
          currentContent += `<p>${processedLine}</p>\n`;
        }
      }
      // 빈 줄 처리
      else {
        if (inTable) {
          currentContent += '</tbody></table>\n';
          inTable = false;
        }
        if (inList) {
          currentContent += '</ul>\n';
          inList = false;
        }
        if (currentContent.includes('<ol class="numbered-list">')) {
          currentContent += '</ol>\n';
        }
      }
    }

    // 마지막 섹션 추가
    if (currentSection) {
      // 열린 태그들 닫기
      if (inTable) {
        currentContent += '</tbody></table>';
      }
      if (inList) {
        currentContent += '</ul>';
      }
      if (currentContent.includes('<ol class="numbered-list">') && !currentContent.includes('</ol>')) {
        currentContent += '</ol>';
      }
      sections.push({ ...currentSection, content: currentContent });
    }

    return sections;
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

  useEffect(() => {
    fetchNewsDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  useEffect(() => {
    fetchNewsDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  if (!newsDetail) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">뉴스를 찾을 수 없습니다.</p>
          </div>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const sections = parseInvestmentReport(newsDetail.content);

  return (
    <main className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {formatFileName(newsDetail.name)}
          </h1>
        </div>

        {/* 투자 리포트 내용 */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {section.type === 'title' && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {section.title}
                  </h2>
                </div>
              )}
              
              <div className="p-6">
                <div 
                  className="prose prose-lg max-w-none investment-report-content"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                  style={{
                    lineHeight: '1.7'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}