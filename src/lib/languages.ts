// 100+ language registry for Lingua AI.
// Free plan: access only the first FREE_LIMIT entries (the most common languages).
// Pro / Business: unlocked everything.

export interface Language {
  code: string;
  name: string;       // English name
  native: string;     // native name
  flag: string;       // emoji
  region: Region;
  rtl?: boolean;
}

export type Region =
  | "Popular"
  | "European"
  | "Asian"
  | "Middle Eastern"
  | "African"
  | "Americas"
  | "Other";

export const FREE_LIMIT = 20;

// Order matters — the first FREE_LIMIT entries are the free tier.
export const LANGUAGES: Language[] = [
  { code: "en", name: "English",    native: "English",    flag: "🇺🇸", region: "Popular" },
  { code: "es", name: "Spanish",    native: "Español",    flag: "🇪🇸", region: "Popular" },
  { code: "fr", name: "French",     native: "Français",   flag: "🇫🇷", region: "Popular" },
  { code: "de", name: "German",     native: "Deutsch",    flag: "🇩🇪", region: "Popular" },
  { code: "it", name: "Italian",    native: "Italiano",   flag: "🇮🇹", region: "Popular" },
  { code: "pt", name: "Portuguese", native: "Português",  flag: "🇵🇹", region: "Popular" },
  { code: "ru", name: "Russian",    native: "Русский",    flag: "🇷🇺", region: "Popular" },
  { code: "zh", name: "Chinese",    native: "中文",        flag: "🇨🇳", region: "Popular" },
  { code: "ja", name: "Japanese",   native: "日本語",      flag: "🇯🇵", region: "Popular" },
  { code: "ko", name: "Korean",     native: "한국어",      flag: "🇰🇷", region: "Popular" },
  { code: "ar", name: "Arabic",     native: "العربية",    flag: "🇸🇦", region: "Middle Eastern", rtl: true },
  { code: "hi", name: "Hindi",      native: "हिन्दी",      flag: "🇮🇳", region: "Asian" },
  { code: "tr", name: "Turkish",    native: "Türkçe",     flag: "🇹🇷", region: "Middle Eastern" },
  { code: "nl", name: "Dutch",      native: "Nederlands", flag: "🇳🇱", region: "European" },
  { code: "pl", name: "Polish",     native: "Polski",     flag: "🇵🇱", region: "European" },
  { code: "sv", name: "Swedish",    native: "Svenska",    flag: "🇸🇪", region: "European" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", flag: "🇮🇩", region: "Asian" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", flag: "🇻🇳", region: "Asian" },
  { code: "th", name: "Thai",       native: "ไทย",         flag: "🇹🇭", region: "Asian" },
  { code: "uk", name: "Ukrainian",  native: "Українська", flag: "🇺🇦", region: "European" },
  // ---- Premium tier below (locked on Free) ----
  { code: "fa", name: "Persian",    native: "فارسی",      flag: "🇮🇷", region: "Middle Eastern", rtl: true },
  { code: "he", name: "Hebrew",     native: "עברית",      flag: "🇮🇱", region: "Middle Eastern", rtl: true },
  { code: "ur", name: "Urdu",       native: "اردو",        flag: "🇵🇰", region: "Asian", rtl: true },
  { code: "bn", name: "Bengali",    native: "বাংলা",       flag: "🇧🇩", region: "Asian" },
  { code: "pa", name: "Punjabi",    native: "ਪੰਜਾਬੀ",     flag: "🇮🇳", region: "Asian" },
  { code: "ta", name: "Tamil",      native: "தமிழ்",       flag: "🇮🇳", region: "Asian" },
  { code: "te", name: "Telugu",     native: "తెలుగు",      flag: "🇮🇳", region: "Asian" },
  { code: "ml", name: "Malayalam",  native: "മലയാളം",    flag: "🇮🇳", region: "Asian" },
  { code: "kn", name: "Kannada",    native: "ಕನ್ನಡ",      flag: "🇮🇳", region: "Asian" },
  { code: "mr", name: "Marathi",    native: "मराठी",       flag: "🇮🇳", region: "Asian" },
  { code: "gu", name: "Gujarati",   native: "ગુજરાતી",     flag: "🇮🇳", region: "Asian" },
  { code: "ne", name: "Nepali",     native: "नेपाली",       flag: "🇳🇵", region: "Asian" },
  { code: "si", name: "Sinhala",    native: "සිංහල",       flag: "🇱🇰", region: "Asian" },
  { code: "my", name: "Burmese",    native: "မြန်မာ",      flag: "🇲🇲", region: "Asian" },
  { code: "km", name: "Khmer",      native: "ខ្មែរ",         flag: "🇰🇭", region: "Asian" },
  { code: "lo", name: "Lao",        native: "ລາວ",         flag: "🇱🇦", region: "Asian" },
  { code: "ms", name: "Malay",      native: "Bahasa Melayu", flag: "🇲🇾", region: "Asian" },
  { code: "tl", name: "Filipino",   native: "Filipino",   flag: "🇵🇭", region: "Asian" },
  { code: "mn", name: "Mongolian",  native: "Монгол",     flag: "🇲🇳", region: "Asian" },
  { code: "ka", name: "Georgian",   native: "ქართული",   flag: "🇬🇪", region: "Asian" },
  { code: "hy", name: "Armenian",   native: "Հայերեն",   flag: "🇦🇲", region: "Asian" },
  { code: "az", name: "Azerbaijani", native: "Azərbaycanca", flag: "🇦🇿", region: "Asian" },
  { code: "kk", name: "Kazakh",     native: "Қазақ",      flag: "🇰🇿", region: "Asian" },
  { code: "uz", name: "Uzbek",      native: "Oʻzbek",     flag: "🇺🇿", region: "Asian" },
  { code: "ky", name: "Kyrgyz",     native: "Кыргызча",   flag: "🇰🇬", region: "Asian" },
  { code: "tg", name: "Tajik",      native: "Тоҷикӣ",     flag: "🇹🇯", region: "Asian" },
  { code: "tk", name: "Turkmen",    native: "Türkmen",    flag: "🇹🇲", region: "Asian" },
  { code: "ps", name: "Pashto",     native: "پښتو",        flag: "🇦🇫", region: "Middle Eastern", rtl: true },
  { code: "ku", name: "Kurdish",    native: "Kurdî",      flag: "🇮🇶", region: "Middle Eastern" },
  // European
  { code: "el", name: "Greek",      native: "Ελληνικά",   flag: "🇬🇷", region: "European" },
  { code: "cs", name: "Czech",      native: "Čeština",    flag: "🇨🇿", region: "European" },
  { code: "sk", name: "Slovak",     native: "Slovenčina", flag: "🇸🇰", region: "European" },
  { code: "hu", name: "Hungarian",  native: "Magyar",     flag: "🇭🇺", region: "European" },
  { code: "ro", name: "Romanian",   native: "Română",     flag: "🇷🇴", region: "European" },
  { code: "bg", name: "Bulgarian",  native: "Български",  flag: "🇧🇬", region: "European" },
  { code: "sr", name: "Serbian",    native: "Српски",     flag: "🇷🇸", region: "European" },
  { code: "hr", name: "Croatian",   native: "Hrvatski",   flag: "🇭🇷", region: "European" },
  { code: "bs", name: "Bosnian",    native: "Bosanski",   flag: "🇧🇦", region: "European" },
  { code: "sl", name: "Slovenian",  native: "Slovenščina", flag: "🇸🇮", region: "European" },
  { code: "mk", name: "Macedonian", native: "Македонски", flag: "🇲🇰", region: "European" },
  { code: "sq", name: "Albanian",   native: "Shqip",      flag: "🇦🇱", region: "European" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių",   flag: "🇱🇹", region: "European" },
  { code: "lv", name: "Latvian",    native: "Latviešu",   flag: "🇱🇻", region: "European" },
  { code: "et", name: "Estonian",   native: "Eesti",      flag: "🇪🇪", region: "European" },
  { code: "fi", name: "Finnish",    native: "Suomi",      flag: "🇫🇮", region: "European" },
  { code: "no", name: "Norwegian",  native: "Norsk",      flag: "🇳🇴", region: "European" },
  { code: "da", name: "Danish",     native: "Dansk",      flag: "🇩🇰", region: "European" },
  { code: "is", name: "Icelandic",  native: "Íslenska",   flag: "🇮🇸", region: "European" },
  { code: "ga", name: "Irish",      native: "Gaeilge",    flag: "🇮🇪", region: "European" },
  { code: "cy", name: "Welsh",      native: "Cymraeg",    flag: "🏴", region: "European" },
  { code: "gd", name: "Scottish Gaelic", native: "Gàidhlig", flag: "🏴", region: "European" },
  { code: "mt", name: "Maltese",    native: "Malti",      flag: "🇲🇹", region: "European" },
  { code: "eu", name: "Basque",     native: "Euskara",    flag: "🇪🇸", region: "European" },
  { code: "ca", name: "Catalan",    native: "Català",     flag: "🇪🇸", region: "European" },
  { code: "gl", name: "Galician",   native: "Galego",     flag: "🇪🇸", region: "European" },
  { code: "be", name: "Belarusian", native: "Беларуская", flag: "🇧🇾", region: "European" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", flag: "🇱🇺", region: "European" },
  { code: "fo", name: "Faroese",    native: "Føroyskt",   flag: "🇫🇴", region: "European" },
  // African
  { code: "sw", name: "Swahili",    native: "Kiswahili",  flag: "🇰🇪", region: "African" },
  { code: "am", name: "Amharic",    native: "አማርኛ",       flag: "🇪🇹", region: "African" },
  { code: "yo", name: "Yoruba",     native: "Yorùbá",     flag: "🇳🇬", region: "African" },
  { code: "ig", name: "Igbo",       native: "Igbo",       flag: "🇳🇬", region: "African" },
  { code: "ha", name: "Hausa",      native: "Hausa",      flag: "🇳🇬", region: "African" },
  { code: "zu", name: "Zulu",       native: "isiZulu",    flag: "🇿🇦", region: "African" },
  { code: "xh", name: "Xhosa",      native: "isiXhosa",   flag: "🇿🇦", region: "African" },
  { code: "af", name: "Afrikaans",  native: "Afrikaans",  flag: "🇿🇦", region: "African" },
  { code: "st", name: "Sesotho",    native: "Sesotho",    flag: "🇱🇸", region: "African" },
  { code: "sn", name: "Shona",      native: "chiShona",   flag: "🇿🇼", region: "African" },
  { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda", flag: "🇷🇼", region: "African" },
  { code: "ny", name: "Chichewa",   native: "Chichewa",   flag: "🇲🇼", region: "African" },
  { code: "mg", name: "Malagasy",   native: "Malagasy",   flag: "🇲🇬", region: "African" },
  { code: "so", name: "Somali",     native: "Soomaali",   flag: "🇸🇴", region: "African" },
  // Americas / Other
  { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen", flag: "🇭🇹", region: "Americas" },
  { code: "qu", name: "Quechua",    native: "Runa Simi",  flag: "🇵🇪", region: "Americas" },
  { code: "ay", name: "Aymara",     native: "Aymar aru",  flag: "🇧🇴", region: "Americas" },
  { code: "gn", name: "Guarani",    native: "Avañe'ẽ",    flag: "🇵🇾", region: "Americas" },
  { code: "haw", name: "Hawaiian",  native: "ʻŌlelo Hawaiʻi", flag: "🌺", region: "Other" },
  { code: "mi", name: "Maori",      native: "Te Reo",     flag: "🇳🇿", region: "Other" },
  { code: "sm", name: "Samoan",     native: "Gagana Samoa", flag: "🇼🇸", region: "Other" },
  { code: "to", name: "Tongan",     native: "Lea fakatonga", flag: "🇹🇴", region: "Other" },
  { code: "fj", name: "Fijian",     native: "Vosa Vakaviti", flag: "🇫🇯", region: "Other" },
  // Constructed / classical
  { code: "la", name: "Latin",      native: "Latina",     flag: "📜", region: "Other" },
  { code: "eo", name: "Esperanto",  native: "Esperanto",  flag: "🟢", region: "Other" },
  { code: "yi", name: "Yiddish",    native: "ייִדיש",       flag: "✡️", region: "Other", rtl: true },
  { code: "jv", name: "Javanese",   native: "Basa Jawa",  flag: "🇮🇩", region: "Asian" },
  { code: "su", name: "Sundanese",  native: "Basa Sunda", flag: "🇮🇩", region: "Asian" },
];

export const LANG_BY_CODE: Record<string, Language> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
);

export const FREE_CODES = new Set(LANGUAGES.slice(0, FREE_LIMIT).map((l) => l.code));

export function isLanguageLocked(code: string, plan: "free" | "pro" | "business"): boolean {
  if (plan !== "free") return false;
  return !FREE_CODES.has(code);
}

export function getLanguage(code: string): Language | undefined {
  return LANG_BY_CODE[code];
}

export function languageLabel(code: string): string {
  const l = LANG_BY_CODE[code];
  return l ? `${l.flag} ${l.native}` : code.toUpperCase();
}

export function isRtl(code: string): boolean {
  return !!LANG_BY_CODE[code]?.rtl;
}

export function searchLanguages(query: string): Language[] {
  const q = query.trim().toLowerCase();
  if (!q) return LANGUAGES;
  return LANGUAGES.filter(
    (l) =>
      l.code.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.native.toLowerCase().includes(q),
  );
}

// English-name map for the AI translation prompt (server-side).
export const LANG_NAMES: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l.name]),
);
