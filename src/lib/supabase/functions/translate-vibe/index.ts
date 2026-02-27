// AI Translation Edge Function for Vibe Checks
// This would be deployed to Supabase Edge Functions

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mock translations (in production, use LLM API)
const mockTranslations: Record<string, Record<string, string>> = {
  'en': {
    'vibe': 'vibe',
    'great': 'great',
    'amazing': 'amazing',
    'love': 'love',
    'night': 'night',
    'music': 'music',
    'atmosphere': 'atmosphere',
    'service': 'service',
    'food': 'food',
    'drinks': 'drinks',
    'recommend': 'recommend'
  },
  'zh': {
    'vibe': '氛围',
    'great': '很棒',
    'amazing': '惊人',
    'love': '喜欢',
    'night': '夜晚',
    'music': '音乐',
    'atmosphere': '氛围',
    'service': '服务',
    'food': '食物',
    'drinks': '饮品',
    'recommend': '推荐'
  },
  'ja': {
    'vibe': 'バイブ',
    'great': '素晴らしい',
    'amazing': '素晴らしい',
    'love': '愛する',
    'night': '夜',
    'music': '音楽',
    'atmosphere': '雰囲気',
    'service': 'サービス',
    'food': '食べ物',
    'drinks': 'ドリンク',
    'recommend': 'おすすめ'
  },
  'ko': {
    'vibe': '분위기',
    'great': '훌륭해요',
    'amazing': '엄청나요',
    'love': '사랑해요',
    'night': '밤',
    'music': '음악',
    'atmosphere': '분위기',
    'service': '서비스',
    'food': '음식',
    'drinks': '음료',
    'recommend': '추천'
  }
};

// Sentiment analysis for vibe checks
function analyzeSentiment(text: string): { score: number; label: string } {
  const positiveWords = ['great', 'amazing', 'love', 'excellent', 'fantastic', 'perfect', 'best', 'awesome', 'incredible'];
  const negativeWords = ['bad', 'terrible', 'worst', 'awful', 'poor', 'disappointing', 'hate', 'horrible'];
  
  const lowerText = text.toLowerCase();
  let score = 0;
  
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });
  
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });
  
  if (score > 0) return { score, label: 'positive' };
  if (score < 0) return { score, label: 'negative' };
  return { score: 0, label: 'neutral' };
}

// Extract key themes from text
function extractThemes(text: string): string[] {
  const themes: string[] = [];
  const themeKeywords = {
    'Music': ['music', 'dj', 'band', 'live', 'sound', 'playlist'],
    'Service': ['service', 'staff', 'waiter', 'bartender', 'service'],
    'Atmosphere': ['vibe', 'atmosphere', 'ambiance', 'crowd', 'people'],
    'Drinks': ['drink', 'cocktail', 'beer', 'wine', 'bartender'],
    'Food': ['food', 'menu', 'appetizer', 'main', 'dessert'],
    'Value': ['price', 'value', 'worth', 'money', 'expensive', 'cheap']
  };
  
  const lowerText = text.toLowerCase();
  
  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some(kw => lowerText.includes(kw))) {
      themes.push(theme);
    }
  });
  
  return themes;
}

// Simple translation function (mock)
function translateText(text: string, targetLang: string): string {
  // In production, this would call an LLM API
  // For demo, we do simple mock translation
  
  const words = text.toLowerCase().split(/\s+/);
  const translated = words.map(word => {
    for (const [lang, dict] of Object.entries(mockTranslations)) {
      if (dict[word]) {
        return dict[word];
      }
    }
    return word;
  });
  
  // Add target language indicator
  const langPrefix: Record<string, string> = {
    'en': '[EN] ',
    'zh': '[中文] ',
    'ja': '[日本語] ',
    'ko': '[한국어] '
  };
  
  return langPrefix[targetLang] || '' + translated.join(' ');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, target_language, analyze } = await req.json();
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const targetLang = target_language || 'en';
    
    // Prepare response
    const response: any = {
      original_text: text,
      translated_text: translateText(text, targetLang),
      detected_language: 'id',
      target_language: targetLang
    };
    
    // Include analysis if requested
    if (analyze) {
      response.sentiment = analyzeSentiment(text);
      response.themes = extractThemes(text);
      response.summary = `This is a ${response.sentiment.label} review mentioning ${response.themes.join(', ')}`;
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
