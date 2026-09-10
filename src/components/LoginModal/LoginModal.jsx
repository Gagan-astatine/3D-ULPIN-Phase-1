import { useEffect, useRef, useState } from 'react';
import RegistrationModal from '../RegistrationModal/RegistrationModal.jsx';
import { useTranslation } from '../../i18n/useTranslation.js';
import './LoginModal.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginModal({ onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);

  useEffect(() => {
    emailRef.current?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = t('auth.enterEmail');
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = t('auth.validEmail');
    if (!password) nextErrors.password = t('auth.enterPassword');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = event => {
    event.preventDefault();
    validate();
  };

  if (showRegistration) return <RegistrationModal onClose={onClose} onBackToLogin={() => setShowRegistration(false)} />;

  return (
    <div className="login-modal" role="presentation" onClick={onClose}>
      <section className="login-modal__panel" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={event => event.stopPropagation()}>
        <button className="login-modal__close" type="button" onClick={onClose} aria-label={t('auth.closeLogin')}>×</button>
        <p className="login-modal__eyebrow">{t('auth.eyebrow')}</p>
        <h2 id="login-modal-title">{t('auth.welcome')}</h2>
        <p className="login-modal__subtitle">{t('auth.subtitle')}</p>
        <form onSubmit={submit} noValidate>
          <label className="login-modal__field">
            <span>{t('auth.email')}</span>
            <input ref={emailRef} type="email" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'login-email-error' : undefined} autoComplete="email" />
            {errors.email && <small id="login-email-error" className="login-modal__error">{errors.email}</small>}
          </label>
          <label className="login-modal__field">
            <span>{t('auth.password')}</span>
            <span className="login-modal__password-wrap">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'login-password-error' : undefined} autoComplete="current-password" />
              <button className="login-modal__password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? t('auth.hide') : t('auth.show')}>{showPassword ? t('auth.hide') : t('auth.show')}</button>
            </span>
            {errors.password && <small id="login-password-error" className="login-modal__error">{errors.password}</small>}
          </label>
          <button className="login-modal__submit" type="submit">{t('auth.login')}</button>
        </form>
        <p className="login-modal__register">{t('auth.registerPrompt')} <button type="button" onClick={() => setShowRegistration(true)}>{t('auth.createAccount')}</button></p>
      </section>
    </div>
  );
}
