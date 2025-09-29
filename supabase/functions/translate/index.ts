// Supabase Edge Function: translate
// Free unlimited translation service using multiple providers
// Request body: { q: string, source?: string, target?: string, getLanguages?: boolean }

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Content-Type": "application/json"
};

// Comprehensive language mapping for all world languages
const languageMap = {
  'en': { name: 'English', native: 'English' },
  'es': { name: 'Spanish', native: 'Español' },
  'fr': { name: 'French', native: 'Français' },
  'de': { name: 'German', native: 'Deutsch' },
  'it': { name: 'Italian', native: 'Italiano' },
  'pt': { name: 'Portuguese', native: 'Português' },
  'ru': { name: 'Russian', native: 'Русский' },
  'ja': { name: 'Japanese', native: '日本語' },
  'ko': { name: 'Korean', native: '한국어' },
  'zh': { name: 'Chinese (Simplified)', native: '中文 (简体)' },
  'zh-tw': { name: 'Chinese (Traditional)', native: '中文 (繁體)' },
  'ar': { name: 'Arabic', native: 'العربية' },
  'hi': { name: 'Hindi', native: 'हिन्दी' },
  'th': { name: 'Thai', native: 'ไทย' },
  'vi': { name: 'Vietnamese', native: 'Tiếng Việt' },
  'tr': { name: 'Turkish', native: 'Türkçe' },
  'pl': { name: 'Polish', native: 'Polski' },
  'nl': { name: 'Dutch', native: 'Nederlands' },
  'sv': { name: 'Swedish', native: 'Svenska' },
  'da': { name: 'Danish', native: 'Dansk' },
  'no': { name: 'Norwegian', native: 'Norsk' },
  'fi': { name: 'Finnish', native: 'Suomi' },
  'cs': { name: 'Czech', native: 'Čeština' },
  'sk': { name: 'Slovak', native: 'Slovenčina' },
  'hu': { name: 'Hungarian', native: 'Magyar' },
  'ro': { name: 'Romanian', native: 'Română' },
  'bg': { name: 'Bulgarian', native: 'Български' },
  'hr': { name: 'Croatian', native: 'Hrvatski' },
  'sr': { name: 'Serbian', native: 'Српски' },
  'sl': { name: 'Slovenian', native: 'Slovenščina' },
  'et': { name: 'Estonian', native: 'Eesti' },
  'lv': { name: 'Latvian', native: 'Latviešu' },
  'lt': { name: 'Lithuanian', native: 'Lietuvių' },
  'el': { name: 'Greek', native: 'Ελληνικά' },
  'he': { name: 'Hebrew', native: 'עברית' },
  'fa': { name: 'Persian', native: 'فارسی' },
  'ur': { name: 'Urdu', native: 'اردو' },
  'bn': { name: 'Bengali', native: 'বাংলা' },
  'ta': { name: 'Tamil', native: 'தமிழ்' },
  'te': { name: 'Telugu', native: 'తెలుగు' },
  'ml': { name: 'Malayalam', native: 'മലയാളം' },
  'kn': { name: 'Kannada', native: 'ಕನ್ನಡ' },
  'gu': { name: 'Gujarati', native: 'ગુજરાતી' },
  'pa': { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  'mr': { name: 'Marathi', native: 'मराठी' },
  'ne': { name: 'Nepali', native: 'नेपाली' },
  'si': { name: 'Sinhala', native: 'සිංහල' },
  'my': { name: 'Burmese', native: 'မြန်မာ' },
  'km': { name: 'Khmer', native: 'ខ្មែរ' },
  'lo': { name: 'Lao', native: 'ລາວ' },
  'ka': { name: 'Georgian', native: 'ქართული' },
  'am': { name: 'Amharic', native: 'አማርኛ' },
  'sw': { name: 'Swahili', native: 'Kiswahili' },
  'yo': { name: 'Yoruba', native: 'Yorùbá' },
  'ig': { name: 'Igbo', native: 'Igbo' },
  'ha': { name: 'Hausa', native: 'Hausa' },
  'zu': { name: 'Zulu', native: 'IsiZulu' },
  'xh': { name: 'Xhosa', native: 'IsiXhosa' },
  'af': { name: 'Afrikaans', native: 'Afrikaans' },
  'id': { name: 'Indonesian', native: 'Bahasa Indonesia' },
  'ms': { name: 'Malay', native: 'Bahasa Melayu' },
  'tl': { name: 'Filipino', native: 'Filipino' },
  'uk': { name: 'Ukrainian', native: 'Українська' },
  'be': { name: 'Belarusian', native: 'Беларуская' },
  'kk': { name: 'Kazakh', native: 'Қазақша' },
  'ky': { name: 'Kyrgyz', native: 'Кыргызча' },
  'uz': { name: 'Uzbek', native: 'Oʻzbekcha' },
  'tg': { name: 'Tajik', native: 'Тоҷикӣ' },
  'mn': { name: 'Mongolian', native: 'Монгол' },
  'is': { name: 'Icelandic', native: 'Íslenska' },
  'mt': { name: 'Maltese', native: 'Malti' },
  'ga': { name: 'Irish', native: 'Gaeilge' },
  'cy': { name: 'Welsh', native: 'Cymraeg' },
  'eu': { name: 'Basque', native: 'Euskera' },
  'ca': { name: 'Catalan', native: 'Català' },
  'gl': { name: 'Galician', native: 'Galego' },
  'eo': { name: 'Esperanto', native: 'Esperanto' }
};

// Free unlimited translation providers (no API key required)
const translationProviders = [
  {
    name: 'Lingva',
    url: 'https://lingva.ml/api/v1',
    translate: async (text: string, source: string, target: string) => {
      const url = `https://lingva.ml/api/v1/${source}/${target}/${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.translation;
      }
      return null;
    }
  },
  {
    name: 'Simplytranslate',
    url: 'https://simplytranslate.org/api/translate',
    translate: async (text: string, source: string, target: string) => {
      const url = `https://simplytranslate.org/api/translate?engine=google&from=${source}&to=${target}&text=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.translated_text;
      }
      return null;
    }
  },
  {
    name: 'MyMemory',
    url: 'https://api.mymemory.translated.net/get',
    translate: async (text: string, source: string, target: string) => {
      const langPair = source === 'auto' ? `${target}` : `${source}|${target}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.responseStatus === 200) {
          return data.responseData.translatedText;
        }
      }
      return null;
    }
  }
];

async function tryTranslation(text: string, source: string, target: string) {
  for (const provider of translationProviders) {
    try {
      console.log(`🔄 Attempting translation with ${provider.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const translated = await Promise.race([
        provider.translate(text.substring(0, 5000), source, target),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ]);
      
      clearTimeout(timeoutId);
      
      if (translated && translated.trim() && translated !== text) {
        console.log(`✅ Translation successful with ${provider.name}: "${translated.substring(0, 100)}..."`);
        return translated;
      } else {
        console.log(`⚠️ ${provider.name} returned same text or empty result`);
      }
    } catch (error: unknown) {
      console.log(`❌ ${provider.name} failed:`, (error as Error).message || String(error));
      continue; // Try next provider
    }
  }
  
  return null; // All providers failed
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    
    // Handle language list request
    if (requestData.getLanguages) {
      const sortedLanguages = Object.entries(languageMap)
        .map(([code, info]) => ({ code, ...info }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      return new Response(JSON.stringify({ 
        languages: sortedLanguages,
        total: sortedLanguages.length 
      }), { headers: corsHeaders });
    }

    const { q, source = 'auto', target = 'en' } = requestData;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or empty text to translate' }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    if (!target || !languageMap[target as keyof typeof languageMap]) {
      return new Response(JSON.stringify({ 
        error: 'Invalid target language code',
        availableLanguages: Object.keys(languageMap)
      }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Skip translation if source and target are the same (for non-auto detection)
    if (source !== 'auto' && source === target) {
      return new Response(JSON.stringify({ 
        translated: q,
        sourceLanguage: source,
        targetLanguage: target,
        targetLanguageName: languageMap[target as keyof typeof languageMap]?.name || target,
        skipped: true
      }), { headers: corsHeaders });
    }

    console.log(`🌐 Translating from ${source} to ${target}: "${q.substring(0, 100)}..."`);

    // Try translation with free providers
    const translated = await tryTranslation(q, source, target);

    if (!translated) {
      console.error('❌ All translation providers failed');
      return new Response(JSON.stringify({ 
        translated: q, // Return original text as fallback
        sourceLanguage: source,
        targetLanguage: target,
        targetLanguageName: languageMap[target as keyof typeof languageMap]?.name || target,
        fallback: true,
        error: 'Translation services temporarily unavailable, showing original text'
      }), { headers: corsHeaders });
    }

    return new Response(JSON.stringify({ 
      translated,
      sourceLanguage: source,
      targetLanguage: target,
      targetLanguageName: languageMap[target as keyof typeof languageMap]?.name || target
    }), { headers: corsHeaders });

  } catch (e) {
    console.error('❌ Translation service error:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal translation service error',
      message: String((e as any)?.message || e)
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});