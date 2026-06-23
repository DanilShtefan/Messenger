import { useTranslation as useTranslationI18n } from 'react-i18next';

export const useTranslation = (namespace?: string) => {
  return useTranslationI18n(namespace);
};