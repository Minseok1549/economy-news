'use client';

import { useState } from 'react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: Array<{ id: string; name: string }>;
  onPublish: (title: string, content: string) => Promise<void>;
}

export default function PublishModal({
  isOpen,
  onClose,
  selectedFiles,
  onPublish,
}: PublishModalProps) {
  const [title, setTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [useAutoFormat, setUseAutoFormat] = useState(true);

  if (!isOpen) return null;

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(title, useAutoFormat ? '' : customContent);
      onClose();
    } catch (error) {
      console.error('Publish error:', error);
      alert('발행 중 오류가 발생했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  const defaultTitle = `📊 경제 뉴스 브리핑 - ${new Date().toLocaleDateString('ko-KR')}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">📝 WordPress 발행</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 선택된 뉴스 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              선택된 뉴스 ({selectedFiles.length}개)
            </label>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={file.id} className="text-sm text-gray-600 mb-1">
                  {index + 1}. {file.name.replace('.txt', '').replace('_card', '')}
                </div>
              ))}
            </div>
          </div>

          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              포스트 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              비워두면 기본 제목이 사용됩니다
            </p>
          </div>

          {/* 자동 포맷팅 옵션 */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAutoFormat}
                onChange={(e) => setUseAutoFormat(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                자동 포맷팅 사용 (권장)
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              선택된 뉴스를 보기 좋게 자동으로 포맷팅합니다
            </p>
          </div>

          {/* 커스텀 내용 (자동 포맷팅 비활성화 시) */}
          {!useAutoFormat && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                커스텀 내용 (HTML 사용 가능)
              </label>
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="포스트 내용을 직접 입력하세요..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>📌 참고:</strong> 발행 버튼을 클릭하면 선택된 뉴스가 WordPress
              블로그에 즉시 발행됩니다. 발행 후 WordPress 관리자 페이지에서 수정할
              수 있습니다.
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isPublishing ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                발행 중...
              </>
            ) : (
              '🚀 WordPress에 발행'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
