import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation.js';
import './IntroLoader.css';

export default function IntroLoader({ onComplete }) {
  const { t } = useTranslation();
  const loadingSteps = t('loader.steps');
  const [stepIndex, setStepIndex] = useState(-1);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const stepTimer = window.setTimeout(() => setStepIndex(0), 850);
    return () => window.clearTimeout(stepTimer);
  }, []);

  useEffect(() => {
    if (stepIndex < 0) return undefined;
    if (stepIndex < loadingSteps.length - 1) {
      const nextTimer = window.setTimeout(() => setStepIndex(value => value + 1), 950);
      return () => window.clearTimeout(nextTimer);
    }
    const finishTimer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onComplete, 650);
    }, 1250);
    return () => window.clearTimeout(finishTimer);
  }, [stepIndex, onComplete, loadingSteps.length]);

  return (
    <main className={`intro-loader${leaving ? ' intro-loader--leaving' : ''}`} aria-label={t('loader.init')}>
      <div className="intro-loader__grid" aria-hidden="true" />
      <div className="intro-loader__content">
        <div className="intro-loader__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="intro-loader__brand">३Avastha</p>
        <p className="intro-loader__label">{t('loader.init')}</p>
        <div className="intro-loader__status" aria-live="polite">
          <span className="intro-loader__status-line" key={stepIndex}>
            {stepIndex >= 0 ? loadingSteps[stepIndex] : ' '}
          </span>
        </div>
        <div className="intro-loader__progress" aria-hidden="true">
          <span style={{ width: `${Math.max(0, (stepIndex + 1) / loadingSteps.length * 100)}%` }} />
        </div>
      </div>
      <p className="intro-loader__edition">{t('loader.edition')}</p>
    </main>
  );
}
