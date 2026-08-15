import { SegmentedButtons } from 'react-native-paper';
import { useLanguage } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/strings';

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <SegmentedButtons
      value={lang}
      onValueChange={(value) => setLang(value as Lang)}
      buttons={[
        { value: 'ar', label: 'العربية' },
        { value: 'en', label: 'English' },
      ]}
      density="small"
      style={{ maxWidth: 220, alignSelf: 'center' }}
    />
  );
}
