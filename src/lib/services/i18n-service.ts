/**
 * =====================================================
 * INTERNATIONALIZATION SERVICE
 * AfterHoursID - Sovereign Shield & Global Expansion
 * =====================================================
 */

export type Locale = 'id' | 'en' | 'ja' | 'zh';

export interface Translation {
  key: string;
  translations: Record<Locale, string>;
}

// =====================================================
// TRANSLATIONS
// =====================================================

export const translations: Record<string, Record<Locale, string>> = {
  // Common
  'common.loading': {
    id: 'Memuat...',
    en: 'Loading...',
    ja: '読み込み中...',
    zh: '加载中...',
  },
  'common.error': {
    id: 'Terjadi kesalahan',
    en: 'An error occurred',
    ja: 'エラーが発生しました',
    zh: '发生错误',
  },
  'common.save': {
    id: 'Simpan',
    en: 'Save',
    ja: '保存',
    zh: '保存',
  },
  'common.cancel': {
    id: 'Batal',
    en: 'Cancel',
    ja: 'キャンセル',
    zh: '取消',
  },
  
  // Navigation
  'nav.home': {
    id: 'Beranda',
    en: 'Home',
    ja: 'ホーム',
    zh: '首页',
  },
  'nav.discovery': {
    id: 'Jelajahi',
    en: 'Discover',
    ja: '発見',
    zh: '发现',
  },
  'nav.booking': {
    id: 'Reservasi',
    en: 'Bookings',
    ja: '予約',
    zh: '预订',
  },
  'nav.profile': {
    id: 'Profil',
    en: 'Profile',
    ja: 'プロフィール',
    zh: '个人资料',
  },
  
  // Venue
  'venue.search': {
    id: 'Cari tempat',
    en: 'Search venues',
    ja: 'Venueを検索',
    zh: '搜索场所',
  },
  'venue.book': {
    id: 'Pesan Meja',
    en: 'Book a Table',
    ja: 'テーブル予約',
    zh: '订桌',
  },
  'venue.getDirections': {
    id: 'Petunjuk Arah',
    en: 'Get Directions',
    ja: '道順',
    zh: '路线',
  },
  
  // Booking
  'booking.date': {
    id: 'Tanggal',
    en: 'Date',
    ja: '日付',
    zh: '日期',
  },
  'booking.time': {
    id: 'Waktu',
    en: 'Time',
    ja: '時間',
    zh: '时间',
  },
  'booking.guests': {
    id: 'Tamu',
    en: 'Guests',
    ja: 'ゲスト',
    zh: '客人',
  },
  'booking.confirm': {
    id: 'Konfirmasi Reservasi',
    en: 'Confirm Booking',
    ja: '予約確定',
    zh: '确认预订',
  },
  
  // Auth
  'auth.login': {
    id: 'Masuk',
    en: 'Login',
    ja: 'ログイン',
    zh: '登录',
  },
  'auth.register': {
    id: 'Daftar',
    en: 'Register',
    ja: '登録',
    zh: '注册',
  },
  
  // Errors
  'error.required': {
    id: 'Wajib diisi',
    en: 'Required',
    ja: '必須',
    zh: '必填',
  },
  'error.invalidEmail': {
    id: 'Email tidak valid',
    en: 'Invalid email',
    ja: 'メールアドレスが無効です',
    zh: '邮箱格式无效',
  },
};

// =====================================================
// CURRENCY CONVERSION
// =====================================================

export const currencies: Record<string, {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate to IDR
}> = {
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', rate: 1 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 15500 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 16800 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 105 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 2150 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 11500 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', rate: 3450 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', rate: 445 },
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  const from = currencies[fromCurrency];
  const to = currencies[toCurrency];
  
  if (!from || !to) return amount;
  
  // Convert to IDR first, then to target currency
  const inIDR = amount * from.rate;
  return inIDR / to.rate;
}

/**
 * Format amount with currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'IDR'
): string {
  const curr = currencies[currency];
  if (!curr) return `${amount}`;
  
  if (currency === 'IDR') {
    return `${curr.symbol} ${Math.round(amount).toLocaleString('id-ID')}`;
  }
  
  return `${curr.symbol}${amount.toFixed(2)}`;
}

/**
 * Get user's local currency based on locale
 */
export function getCurrencyForLocale(locale: Locale): string {
  switch (locale) {
    case 'ja': return 'JPY';
    case 'zh': return 'CNY';
    case 'en': return 'USD';
    default: return 'IDR';
  }
}

// =====================================================
// I18N SERVICE
// =====================================================

let currentLocale: Locale = 'id';

/**
 * Set current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  // Persist to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && ['id', 'en', 'ja', 'zh'].includes(saved)) {
      return saved;
    }
  }
  return 'id';
}

/**
 * Translate a key
 */
export function t(key: string, params?: Record<string, string>): string {
  const translation = translations[key];
  
  if (!translation) {
    console.warn(`Missing translation: ${key}`);
    return key;
  }
  
  let text = translation[currentLocale] || translation['en'] || key;
  
  // Replace parameters
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  
  return text;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): { code: Locale; name: string; nativeName: string }[] {
  return [
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];
}
