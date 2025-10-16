'use client';

import { useState } from 'react';

interface ScheduleInfo {
  schedule: Array<{ hour: number; categories: string[]; count: number }>;
  nextPublishTime: string;
  nextPublishCategories: string[];
  currentTime: string;
  preparedNewsCount: number;
}

interface PrepareResult {
  message: string;
  totalProcessed: number;
  results: Array<{
    id?: string;
    originalTitle: string;
    newTitle?: string;
    category?: string;
    error?: string;
  }>;
}

interface PublishResult {
  message?: string;
  currentTime: string;
  totalPublished?: number;
  results?: Array<{
    id: string;
    title: string;
    success: boolean;
    url?: string;
    error?: string;
  }>;
}

export default function AutomationPanel() {
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);
  const [prepareResult, setPrepareResult] = useState<PrepareResult | null>(null);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduleInfo = async () => {
    setLoading('schedule-info');
    setError(null);
    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) throw new Error('스케줄 정보를 가져올 수 없습니다.');
      const data = await res.json();
      setScheduleInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const prepareNews = async () => {
    if (!confirm('Google Drive에서 뉴스를 가져와 AI로 재작성합니다. 계속하시겠습니까?')) {
      return;
    }

    setLoading('prepare');
    setError(null);
    setPrepareResult(null);
    
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare' }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '뉴스 준비 실패');
      }
      
      const data = await res.json();
      setPrepareResult(data);
      
      // 준비 완료 후 스케줄 정보 다시 가져오기
      fetchScheduleInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  const publishNow = async () => {
    if (!confirm('현재 시간에 맞는 카테고리의 뉴스를 즉시 발행합니다. 계속하시겠습니까?')) {
      return;
    }

    setLoading('publish');
    setError(null);
    setPublishResult(null);
    
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '발행 실패');
      }
      
      const data = await res.json();
      setPublishResult(data);
      
      // 발행 완료 후 스케줄 정보 다시 가져오기
      fetchScheduleInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">🤖 뉴스 자동 발행 관리</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={fetchScheduleInfo}
            disabled={loading === 'schedule-info'}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {loading === 'schedule-info' ? '조회 중...' : '📅 스케줄 정보 조회'}
          </button>

          <button
            onClick={prepareNews}
            disabled={loading === 'prepare'}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
          >
            {loading === 'prepare' ? '처리 중...' : '🔄 1. 뉴스 준비 (AI 재작성)'}
          </button>

          <button
            onClick={publishNow}
            disabled={loading === 'publish'}
            className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
          >
            {loading === 'publish' ? '발행 중...' : '🚀 2. 즉시 발행'}
          </button>
        </div>

        {scheduleInfo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-lg mb-3">📅 발행 스케줄</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {scheduleInfo.schedule.map((s) => (
                <div key={s.hour} className="p-3 bg-white rounded border">
                  <div className="font-semibold">{s.hour}:00</div>
                  <div className="text-sm text-gray-600 mb-1">{s.count}개 발행</div>
                  <div className="text-xs text-gray-500">
                    {s.categories.join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="text-sm">
                <strong>준비된 뉴스:</strong>{' '}
                <span className="text-blue-600 font-semibold">
                  {scheduleInfo.preparedNewsCount}개
                </span>
              </div>
              <div className="text-sm">
                <strong>다음 발행:</strong>{' '}
                {new Date(scheduleInfo.nextPublishTime).toLocaleString('ko-KR')}
                <div className="mt-1 text-xs text-gray-600">
                  카테고리: {scheduleInfo.nextPublishCategories.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {prepareResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-lg mb-3">✅ {prepareResult.message}</h3>
            <p className="mb-3">총 {prepareResult.totalProcessed}개 처리됨</p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {prepareResult.results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded border ${
                    result.error
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {result.error ? (
                    <>
                      <div className="font-medium text-red-700">
                        ❌ {result.originalTitle}
                      </div>
                      <div className="text-sm text-red-600">{result.error}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-500">
                        원본: {result.originalTitle}
                      </div>
                      <div className="font-medium">{result.newTitle}</div>
                      <div className="text-sm text-gray-600">
                        {result.category}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {publishResult && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-bold text-lg mb-3">
              🚀 {publishResult.message || '발행 완료'}
            </h3>
            {publishResult.totalPublished !== undefined && (
              <p className="mb-3">{publishResult.totalPublished}개 발행 성공</p>
            )}
            {publishResult.results && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {publishResult.results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-3 rounded border ${
                      result.success
                        ? 'bg-white border-gray-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="font-medium">
                      {result.success ? '✅' : '❌'} {result.title}
                    </div>
                    {result.success && result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {result.url}
                      </a>
                    )}
                    {!result.success && result.error && (
                      <div className="text-sm text-red-600">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">📖 사용 가이드</h2>
        <ol className="space-y-3 list-decimal list-inside">
          <li>
            <strong>스케줄 정보 조회</strong>: 현재 발행 스케줄 및 준비된 뉴스 확인
          </li>
          <li>
            <strong>뉴스 준비</strong>: Google Drive에서 오늘의 뉴스를 가져와 AI로 재작성
          </li>
          <li>
            <strong>즉시 발행</strong>: 현재 시간에 맞는 카테고리의 뉴스를 WordPress에 발행
          </li>
        </ol>
        <div className="mt-4 space-y-2">
          <h3 className="font-semibold">⏰ 시간대별 발행 카테고리:</h3>
          <ul className="space-y-1 text-sm">
            <li>• <strong>14시:</strong> 경제, 비즈니스금융, 스포츠</li>
            <li>• <strong>18시:</strong> 문화예술, 환경</li>
            <li>• <strong>20시:</strong> 건강, 과학</li>
            <li>• <strong>22시:</strong> 기술, 정치, 국제정세</li>
          </ul>
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            💡 <strong>자동 실행:</strong> Vercel에 배포하면 매일 14시, 18시,
            20시, 22시에 자동으로 발행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
