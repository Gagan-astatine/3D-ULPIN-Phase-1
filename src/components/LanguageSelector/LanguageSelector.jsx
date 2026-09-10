import { SUPPORTED_LANGUAGES } from '../../i18n/languageConfig.js';
import { useTranslation } from '../../i18n/useTranslation.js';

export default function LanguageSelector({ className = '' }) {
  const { language, setLanguage, t } = useTranslation();
  return <label className={className}>
    <span>{t('common.language')}</span>
    <select value={language} onChange={event => setLanguage(event.target.value)} aria-label={t('common.language')}>
      {SUPPORTED_LANGUAGES.map(item => <option key={item.code} value={item.code}>{item.nativeLabel}</option>)}
    </select>
  </label>;
}
