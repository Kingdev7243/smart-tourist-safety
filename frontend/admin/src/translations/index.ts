import { en } from './en';
import { ta } from './ta';
import { hi } from './hi';

export type Language = 'en' | 'ta' | 'hi';

export const translations = {
  en,
  ta,
  hi,
};

export type TranslationKey = keyof typeof en;

export const languageNames: Record<Language, { label: string; native: string }> = {
  en: { label: 'English', native: 'English' },
  ta: { label: 'Tamil', native: 'தமிழ்' },
  hi: { label: 'Hindi', native: 'हिंदी' },
};
