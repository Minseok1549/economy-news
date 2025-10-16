/**
 * AI 콘텐츠 가공 라이브러리
 * OpenAI 또는 Gemini를 사용하여 뉴스 콘텐츠를 변환
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface AIRewriteResult {
  title: string;
  content: string;
  summary?: string;
  investmentTip?: string;
}

/**
 * OpenAI를 사용한 콘텐츠 재작성
 */
async function rewriteWithOpenAI(
  originalTitle: string,
  originalContent: string,
  category: string
): Promise<AIRewriteResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }

  const prompt = `당신은 카카오페이, 토스 증권 앱에서 볼 수 있는 것처럼 경제 뉴스를 쉽고 친근하게 설명하는 전문가입니다.

[원본 제목]
${originalTitle}

[원본 내용]
${originalContent}

[카테고리]
${category}

다음 작업을 수행해주세요:

1. **클릭율이 높은 제목 작성**: 
   - 호기심을 자극하는 제목
   - 이모지 1-2개 포함
   - 30자 내외
   - 핵심 키워드 포함

2. **한 줄 요약 작성**:
   - 기사의 핵심 내용을 1문장으로 압축
   - 50-80자 사이

3. **본문 재작성** - 3개 단락 구성 (총 800-1200자):
   
   **첫 번째 단락** (150-200자):
   - 이모지로 시작 (📢, 🔥, ⚡️ 등)
   - 무엇이 일어났는지 명확하게 설명
   - 5W1H 포함
   - [첫 단락: 핵심 요약] 같은 괄호 표기 절대 금지!
   
   **두 번째 단락** (400-600자):
   - 이모지로 포인트 강조 (💡, 📊, 🎯 등)
   - 배경과 맥락 설명
   - 주요 인물/기업/숫자 등 구체적 정보
   - 전문 용어는 쉽게 풀어서 설명
   - [중간 단락: 상세 설명] 같은 괄호 표기 절대 금지!
   
   **세 번째 단락** (200-300자):
   - 이모지로 마무리 (🚀, 👀, ⏰ 등)
   - 왜 중요한지
   - 나/우리에게 미치는 영향
   - 앞으로의 전망이나 관전 포인트
   - [마지막 단락: 의미와 전망] 같은 괄호 표기 절대 금지!
   
   **작성 스타일:**
   - 20-30대가 이해하기 쉬운 언어
   - 문장은 짧고 명확하게 (한 문장 40자 이내)
   - 카카오톡 대화하듯 친근하게
   - 단락 구분은 \\n\\n (두 줄 띄우기)만 사용
   - 전체 800-1200자 분량

4. **투자 전략 팁** (100-150자):
   - 이 뉴스를 바탕으로 한 실질적인 투자 아이디어
   - "📊 투자 포인트:" 로 시작
   - 구체적이고 실행 가능한 조언
   - 리스크 언급 포함

응답 형식 (JSON):
{
  "title": "재작성된 제목",
  "summary": "한 줄 요약",
  "content": "재작성된 본문 (단락 구분은 \\n\\n 사용)",
  "investmentTip": "투자 전략 팁"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 경제 뉴스를 쉽고 친근하게 재작성하는 전문 에디터입니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    return {
      title: result.title,
      content: result.content,
      summary: result.summary,
      investmentTip: result.investmentTip,
    };
  } catch (error) {
    console.error('OpenAI 재작성 오류:', error);
    throw error;
  }
}

/**
 * Gemini를 사용한 콘텐츠 재작성
 */
async function rewriteWithGemini(
  originalTitle: string,
  originalContent: string,
  category: string
): Promise<AIRewriteResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const prompt = `당신은 카카오페이, 토스 증권 앱에서 볼 수 있는 것처럼 경제 뉴스를 쉽고 친근하게 설명하는 전문가입니다.

[원본 제목]
${originalTitle}

[원본 내용]
${originalContent}

[카테고리]
${category}

다음 작업을 수행해주세요:

1. **클릭율이 높은 제목 작성**: 
   - 호기심을 자극하는 제목
   - 이모지 1-2개 포함
   - 30자 내외
   - 핵심 키워드 포함

2. **한 줄 요약 작성**:
   - 기사의 핵심 내용을 1문장으로 압축
   - 50-80자 사이

3. **본문 재작성** - 3개 단락 구성 (총 800-1200자):
   
   **첫 번째 단락** (150-200자):
   - 이모지로 시작 (📢, 🔥, ⚡️ 등)
   - 무엇이 일어났는지 명확하게 설명
   - 5W1H 포함
   - [첫 단락: 핵심 요약] 같은 괄호 표기 절대 금지!
   
   **두 번째 단락** (400-600자):
   - 이모지로 포인트 강조 (💡, 📊, 🎯 등)
   - 배경과 맥락 설명
   - 주요 인물/기업/숫자 등 구체적 정보
   - 전문 용어는 쉽게 풀어서 설명
   - [중간 단락: 상세 설명] 같은 괄호 표기 절대 금지!
   
   **세 번째 단락** (200-300자):
   - 이모지로 마무리 (🚀, 👀, ⏰ 등)
   - 왜 중요한지
   - 나/우리에게 미치는 영향
   - 앞으로의 전망이나 관전 포인트
   - [마지막 단락: 의미와 전망] 같은 괄호 표기 절대 금지!
   
   **작성 스타일:**
   - 20-30대가 이해하기 쉬운 언어
   - 문장은 짧고 명확하게 (한 문장 40자 이내)
   - 카카오톡 대화하듯 친근하게
   - 단락 구분은 \\n\\n (두 줄 띄우기)만 사용
   - 전체 800-1200자 분량

4. **투자 전략 팁** (100-150자):
   - 이 뉴스를 바탕으로 한 실질적인 투자 아이디어
   - "📊 투자 포인트:" 로 시작
   - 구체적이고 실행 가능한 조언
   - 리스크 언급 포함

응답은 반드시 JSON 형식으로만 작성해주세요:
{
  "title": "재작성된 제목",
  "summary": "한 줄 요약",
  "content": "재작성된 본문 (단락 구분은 \\n\\n 사용)",
  "investmentTip": "투자 전략 팁"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API 오류: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates[0].content.parts[0].text;
    
    // JSON 추출 (코드 블록이 있을 경우 제거)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini 응답에서 JSON을 찾을 수 없습니다.');
    }
    
    const result = JSON.parse(jsonMatch[0]);

    return {
      title: result.title,
      content: result.content,
      summary: result.summary,
      investmentTip: result.investmentTip,
    };
  } catch (error) {
    console.error('Gemini 재작성 오류:', error);
    throw error;
  }
}

/**
 * AI를 사용하여 뉴스 콘텐츠 재작성 (OpenAI 우선, 실패시 Gemini 시도)
 */
export async function rewriteNewsContent(
  originalTitle: string,
  originalContent: string,
  category: string
): Promise<AIRewriteResult> {
  // OpenAI 우선 시도
  if (OPENAI_API_KEY) {
    try {
      return await rewriteWithOpenAI(originalTitle, originalContent, category);
    } catch (error) {
      console.error('OpenAI 재작성 실패, Gemini 시도:', error);
    }
  }

  // Gemini로 fallback
  if (GEMINI_API_KEY) {
    return await rewriteWithGemini(originalTitle, originalContent, category);
  }

  throw new Error('AI API 키가 설정되지 않았습니다. (OPENAI_API_KEY 또는 GEMINI_API_KEY)');
}

/**
 * 여러 뉴스를 배치로 재작성
 */
export async function batchRewriteNews(
  newsItems: Array<{ title: string; content: string; category: string }>
): Promise<Array<AIRewriteResult & { originalTitle: string }>> {
  const results = [];

  for (const item of newsItems) {
    try {
      const rewritten = await rewriteNewsContent(item.title, item.content, item.category);
      results.push({
        ...rewritten,
        originalTitle: item.title,
      });
      
      // API 레이트 리밋 방지를 위한 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`뉴스 재작성 실패 (${item.title}):`, error);
      // 실패한 경우 원본 사용
      results.push({
        title: item.title,
        content: item.content,
        summary: item.content.substring(0, 100),
        originalTitle: item.title,
      });
    }
  }

  return results;
}
