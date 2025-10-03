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
    keyword: 'Doctors Best 헤어 & 스킨 콤플렉스',
    product_image: 'https://ads-partners.coupang.com/image1/2xrVOQSOL0VEANj227-hQA4BeGyJYMRSKy2RNaRI_Y64z6cgI6UuovTdb9NVKiXJ1EZzf6q9aLdbwHuNS2GXKjV4AOHr58RVDrC4vhfJCswgIIYsCL8yYi8uJsa1EZ_1M1CdEbLZKFDXDOtol4yveQX3nZmtmhYegV44uwcwYTlRpaUzTXUS8tU1OcFNqACT3Yhwte0vx5sgBiyApYER9bUPCuG5yPKh_pHk5cq2R6GPBQKNzKqpKzQCldBAWAUWMV5eERPLN7Ly272jkOc8RQCOEmKh--FqWcCipqqDZBs-PR8m1ZYJbGZ--A==',
    product_name: '닥터스베스트 하이 앱솔션 헤어 & 스킨 컴플렉스 베지 캡',
    product_price: 26540,
    product_url: 'https://link.coupang.com/re/AFFSDP?lptag=AF1425347&subid=AF1425347&pageKey=8968351588&itemId=26247038969&vendorItemId=93225632304&traceid=V0-153-87193087e6754631&requestid=20251001032221857047375569&token=31850C%7CGM&landing_exp=APP_LANDING_A'
  },
  {
    id: '2',
    keyword: 'MagMind',
    product_image: 'https://ads-partners.coupang.com/image1/dmjvIGPia-5V28Atdubt-_G6FjaiwO-PWudxE8XLNa5kosCc0Yl_DrUor_xRiVHO5Ih1D15GRPjTQSGtiB3Hyg3ISZzdiP6MwT8-BWd0IWGdHIQyCkl8xkS_PURQpdbhJngELU7iXkki8xxbX7fp_5wo0FEQMnfmfrZpG-a0OZJ42uTpEKhFhhLE8Q83wX_4XgSf0houi0Wx3CEZyQK7SybVIRSYQhKj2bVX8a1phxjr1akvKA21AnLyw30M5jrlV6inLf39opi6L0hMYPcuTaI6Ox0mH-MTg2iciZjUTTcCJw8fw6glA6Rb',
    product_name: '재로우 매그마인드 MagMind 90정',
    product_price: 60200,
    product_url: 'https://link.coupang.com/re/AFFSDP?lptag=AF1425347&subid=AF1425347&pageKey=8633511497&itemId=24449231826&vendorItemId=91463101285&traceid=V0-153-0205086b761e5b0d&requestid=20251001051851437146932146&token=31850C%7CGM&landing_exp=APP_LANDING_A'
  },
  {
    id: '3',
    keyword: 'BCAA 아미노 에너지',
    product_image: 'https://ads-partners.coupang.com/image1/pOY9lYokm76r3kLLpP_ILXHFJ-ot8qSjJExcBWTsUW40QYm1j0Hs98NehJjf-chIPP08OHg4D2Vn-WDIFAbLDXFFC_LdrAvLiOfaT2ZGP6LrbBIKzD1g_XO3sXrfX1QPZwGb-gN6dMyXIZp5geUAVrtv8BncHbnLlaoKsQcsLK1Yh4Q-iPkjbeseoIfd0hUMUnUBYRieRSg-Qk0lNus7p0vo8ATscp1vAfGpMF8n8LOqCaMZDJswG3O6i71x0_9HH1SwE38lTZtHHKbeDd-QLGy-D4L9TkonMKbIk8WB0_v73Fb4Q8lNTvI4',
    product_name: '옵티멈 뉴트리션 아미노 에너지 파우더 플러스 수분 보충 BCAA 전해질 카페인 딸기 버스트 30회분',
    product_price: 76100,
    product_url: 'https://link.coupang.com/re/AFFSDP?lptag=AF1425347&subid=AF1425347&pageKey=8794766334&itemId=25601932273&vendorItemId=93620227528&traceid=V0-153-5e2e569fb687dde0&requestid=20251003153200484221514920&token=31850C%7CMIXED&landing_exp=APP_LANDING_A'
  },
  {
    id: '4',
    keyword: '크레아틴',
    product_image: 'https://ads-partners.coupang.com/image1/TaOqrY2a64xHVIQ6Tbs3RvK7vdmqUpC4OB1f92KDdSwSFLMRdhIFnBKBauDaMYigtyEkNs3IxXxeXblm2B3Frv6Kbk6Li8IokMx9j9n7XFGVfGVc_SIfuELsmxQFJag8vWyaWRMu21Sz2xcaVQuFuEaNpwGY2Tm21PLe-2aWIYdWxJXG_-zjtztcpgI9ziX-OMKBdnFCu6SEj3zwTCLkvwjEZEgGvbz8Ca5UGdFik1iXhcZJElbZml220PQfWrI10Fn0woCQKhDPN9wIjpB63B_baM67AFL8ud_q_5zi8U7PtCIYRhnVSg==',
    product_name: '옵티멈뉴트리션 마이크로나이즈드 크레아틴 파우더',
    product_price: 49400,
    product_url: 'https://link.coupang.com/re/AFFSDP?lptag=AF1425347&subid=AF1425347&pageKey=65099029&itemId=2303394333&vendorItemId=3531472605&traceid=V0-153-21d117a3c5386c7d&requestid=20251003153345646134345872&token=31850C%7CMIXED&landing_exp=APP_LANDING_A'
  }
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
      <div className="bg-pink-50 shadow-sm border-b border-pink-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
              <img 
                src="/images/logo.png" 
                alt="비타픽 로고" 
                className="w-full h-full object-contain rounded-full border-2 border-pink-300"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              비타픽 | VitaPick
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
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">💊 영양제 제품 정보 💊</h2>
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
                    {product.product_price && (
                      <p className="text-sm text-gray-500 mt-1">
                        {product.product_price.toLocaleString()}원
                      </p>
                    )}
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