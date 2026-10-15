export interface CountryOption {
  code: string;       // ISO 3166-1 alpha-2
  name: string;       // Country name
  dialCode: string;   // International dialing code (e.g. +91, +1)
  flag: string;       // Flag emoji
  format: string;     // Sample format / placeholder
  digits: number;     // Expected national digits
  isPopular?: boolean;// Featured in quick-pick list
}

export const COUNTRIES: CountryOption[] = [
  // Primary Featured Countries (India and US prominently first)
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    format: '98765 43210',
    digits: 10,
    isPopular: true,
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    format: '(555) 019-2834',
    digits: 10,
    isPopular: true,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    format: '7911 123456',
    digits: 10,
    isPopular: true,
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    format: '(555) 014-9921',
    digits: 10,
    isPopular: true,
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    format: '50 123 4567',
    digits: 9,
    isPopular: true,
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    format: '412 345 678',
    digits: 9,
    isPopular: true,
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    format: '8123 4567',
    digits: 8,
    isPopular: true,
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    format: '151 12345678',
    digits: 10,
    isPopular: true,
  },

  // Additional Global Countries
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', format: '6 12 34 56 78', digits: 9 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', format: '90 1234 5678', digits: 10 },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', format: '50 123 4567', digits: 9 },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', format: '3312 3456', digits: 8 },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', format: '9123 4567', digits: 8 },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', format: '9123 4567', digits: 8 },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', format: '3912 3456', digits: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', format: '12-345 6789', digits: 9 },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', format: '812-3456-7890', digits: 10 },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', format: '917 123 4567', digits: 10 },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', format: '91 234 5678', digits: 9 },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', format: '81 234 5678', digits: 9 },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', format: '10-1234-5678', digits: 10 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', format: '138 0013 8000', digits: 11 },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰', format: '9123 4567', digits: 8 },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼', format: '912 345 678', digits: 9 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', format: '21 123 4567', digits: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', format: '82 123 4567', digits: 9 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', format: '802 123 4567', digits: 10 },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', format: '100 123 4567', digits: 10 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', format: '712 345678', digits: 9 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', format: '11 98765-4321', digits: 11 },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', format: '55 1234 5678', digits: 10 },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', format: '9 11 1234-5678', digits: 10 },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', format: '300 1234567', digits: 10 },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', format: '9 1234 5678', digits: 9 },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', format: '78 123 45 67', digits: 9 },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', format: '6 12345678', digits: 9 },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', format: '70 123 45 67', digits: 9 },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', format: '412 34 567', digits: 8 },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', format: '20 12 34 56', digits: 8 },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', format: '40 1234567', digits: 9 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', format: '85 123 4567', digits: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', format: '312 345 6789', digits: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', format: '612 34 56 78', digits: 9 },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', format: '912 345 678', digits: 9 },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', format: '664 1234567', digits: 10 },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', format: '470 12 34 56', digits: 9 },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', format: '512 345 678', digits: 9 },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', format: '532 123 4567', digits: 10 },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', format: '691 234 5678', digits: 10 },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', format: '50-123-4567', digits: 9 },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', format: '300 1234567', digits: 10 },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', format: '1712 345678', digits: 10 },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', format: '71 234 5678', digits: 9 },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', format: '984 1234567', digits: 10 },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', format: '912 345-67-89', digits: 10 },
];

export const POPULAR_COUNTRIES: CountryOption[] = COUNTRIES.filter((c) => c.isPopular);

export const DEFAULT_COUNTRY: CountryOption = COUNTRIES[0]; // India (+91)

export function findCountryByCode(code: string): CountryOption {
  const match = COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return match || DEFAULT_COUNTRY;
}

export function findCountryByDialCode(dialCode: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.dialCode === dialCode);
}

/**
 * Intelligently parse a phone string:
 * - If it starts with a known dialCode (e.g. +91 or +1), extract country and national number
 * - Otherwise default to India/US
 */
export function parsePhoneNumber(raw: string, defaultCode = 'IN'): { country: CountryOption; nationalNumber: string } {
  if (!raw) {
    return { country: findCountryByCode(defaultCode), nationalNumber: '' };
  }

  const clean = raw.trim();

  if (clean.startsWith('+')) {
    // Sort dial codes by length descending (e.g. +880 before +8) to match the longest prefix
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        const national = clean.slice(c.dialCode.length).trim();
        return { country: c, nationalNumber: national };
      }
    }
  }

  return { country: findCountryByCode(defaultCode), nationalNumber: clean };
}
