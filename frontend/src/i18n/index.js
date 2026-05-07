import en from './en.json'
import hi from './hi.json'
import mr from './mr.json'
import ta from './ta.json'
import te from './te.json'
import kn from './kn.json'
import gu from './gu.json'
import pa from './pa.json'
import bn from './bn.json'
import ml from './ml.json'

export const LANGUAGES = [
    { code: 'en', name: 'English',   nativeName: 'English',  flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi',     nativeName: 'हिन्दी',    flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi',   nativeName: 'मराठी',     flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil',     nativeName: 'தமிழ்',     flag: '🇮🇳' },
    { code: 'te', name: 'Telugu',    nativeName: 'తెలుగు',    flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada',   nativeName: 'ಕನ್ನಡ',     flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati',  nativeName: 'ગુજરાતી',   flag: '🇮🇳' },
    { code: 'pa', name: 'Punjabi',   nativeName: 'ਪੰਜਾਬੀ',    flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali',   nativeName: 'বাংলা',     flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം',   flag: '🇮🇳' },
]

const translations = { en, hi, mr, ta, te, kn, gu, pa, bn, ml }

/**
 * Get a nested translation value by dot-separated key path.
 * Falls back to English, then returns the key itself.
 */
export function getTranslation(lang, keyPath) {
    const keys = keyPath.split('.')
    
    // Try requested language first
    let value = translations[lang]
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k]
        } else {
            value = undefined
            break
        }
    }
    if (typeof value === 'string') return value

    // Fall back to English
    value = translations.en
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k]
        } else {
            return keyPath // Return key path as last resort
        }
    }
    return typeof value === 'string' ? value : keyPath
}

export default translations
