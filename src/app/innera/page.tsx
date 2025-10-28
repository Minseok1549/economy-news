'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  product_image: string;
  product_name: string;
  product_url: string;
  product_price?: number;
  keyword?: string;
}

// 더미 데이터
const dummyProducts: Product[] = [
  {
    id: '1',
    keyword: '',
    product_image: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/08b1/3ab0321c310696d9819c5bb5dfaba3d481d012070b21d65d5046eec7f42b.jpg',
    product_name: '하우스 랩스 바이 레이디 가가 하이 파워 아이 치크 립 피그먼트 페인트',
    product_price: 65800,
    product_url: 'https://link.coupang.com/a/cYQDsh'
  },
  {
    id: '2',
    keyword: '',
    product_image: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/dbfc/2fbfd2dc2ea36e8f0d17f77a90868604aab1cfb6bafe5ad127cf2d026a31.jpg',
    product_name: '하우스랩스 바이 레이디 가가 르 몬스터 립 크레용 비건 립스틱 앤 라이너',
    product_price: 65800,
    product_url: 'https://link.coupang.com/a/cZrEcy'
  },
  {
    id: '3',
    keyword: '',
    product_image: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/vendor_inventory/10e2/e26808d38a8e0e2d67d65ce16bd05a4b434711167ff2acd512bb9196703c.jpg',
    product_name: '하우스 랩스 바이 레이디 가가 미니 PhD 하이브리드 하이드레이팅 틴티드 립 오일',
    product_price: 51000,
    product_url: 'https://link.coupang.com/a/cZrFE4'
  },
];

export default function SupplementsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // 로딩 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProducts(dummyProducts);
        
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('제품을 불러오는 중 오류가 발생했습니다.');
        // 에러 발생 시에도 더미 데이터 표시
        setProducts(dummyProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductClick = (productUrl: string) => {
    window.open(productUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">제품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200">
      {/* Header */}
      <div className="bg-pink-50 shadow-sm border-b border-pink-200 pt-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <img 
                src="/images/logo.png" 
                alt="innera 로고" 
                className="w-full h-full object-contain rounded-full border-2 border-pink-300"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              innera
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              비즈니스 문의 : ▼ ees238@naver.com
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 쿠팡 꿀템 제품 섹션 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">제품 정보</h2>
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleProductClick(product.product_url)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.product_image ? (
                      <img
                        src={product.product_image}
                        alt={product.product_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjMyIiB5PSIzNyIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOUIxMDBGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5OmPC90ZXh0Pgo8L3N2Zz4K';
                        }}
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {product.product_name}
                    </p>
                      <p className="text-sm text-gray-500 mt-1">
                        레이디 가가 픽! 촉촉 블러셔
                      </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-pink-50 border-t border-pink-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-xs text-gray-500">
            <p className="mb-2">
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
            </p>
            <p>
              제품 구매 결정에 도움이 되도록 정확한 정보를 제공하기 위해 노력하고 있습니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}