import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation.js';
import { supabase } from '../../lib/supabase.js';
import './RegistrationModal.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegistrationModal({ onClose, onBackToLogin }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const validate = () => {
    const nextErrors = {};
    if (!fullName.trim()) nextErrors.fullName = t('auth.enterName');
    if (!email.trim()) nextErrors.email = t('auth.enterEmail');
    else if (!EMAIL_PATTERN.test(email.trim())) nextErrors.email = t('auth.validEmail');
    if (!password) nextErrors.password = t('auth.createPassword');
    if (!confirmPassword) nextErrors.confirmPassword = t('auth.confirmYourPassword');
    else if (password !== confirmPassword) nextErrors.confirmPassword = t('auth.passwordsMismatch');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async event => {
    event.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim()
        }
      }
    });
    
    setLoading(false);
    
    if (error) {
      setErrors({ email: error.message });
    } else {
      // Auto close or tell them to check email (Supabase default is email confirm enabled)
      // For now we just close it and they can login
      onClose();
    }
  };

  return (
    <div className="registration-modal" role="presentation" onClick={onClose}>
      <section className="registration-modal__panel" role="dialog" aria-modal="true" aria-labelledby="registration-modal-title" onClick={event => event.stopPropagation()}>
        <button className="registration-modal__close" type="button" onClick={onClose} aria-label={t('auth.closeRegistration')}>×</button>
        <button className="registration-modal__back" type="button" onClick={onBackToLogin}>{t('auth.backToLogin')}</button>
        <p className="registration-modal__eyebrow">{t('auth.createAccess')}</p>
        <h2 id="registration-modal-title">{t('auth.registerHeading')}</h2>
        <form onSubmit={submit} noValidate>
          <label className="registration-modal__field">
            <span>{t('auth.fullName')}</span>
            <input ref={nameRef} type="text" value={fullName} onChange={event => setFullName(event.target.value)} aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'registration-name-error' : undefined} autoComplete="name" />
            {errors.fullName && <small id="registration-name-error" className="registration-modal__error">{errors.fullName}</small>}
          </label>
          <label className="registration-modal__field">
            <span>{t('auth.email')}</span>
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'registration-email-error' : undefined} autoComplete="email" />
            {errors.email && <small id="registration-email-error" className="registration-modal__error">{errors.email}</small>}
          </label>
          <label className="registration-modal__field">
            <span>{t('auth.password')}</span>
            <span className="registration-modal__password-wrap">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'registration-password-error' : undefined} autoComplete="new-password" />
              <button className="registration-modal__password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? t('auth.hide') : t('auth.show')}>{showPassword ? t('auth.hide') : t('auth.show')}</button>
            </span>
            {errors.password && <small id="registration-password-error" className="registration-modal__error">{errors.password}</small>}
          </label>
          <label className="registration-modal__field">
            <span>{t('auth.confirmPassword')}</span>
            <span className="registration-modal__password-wrap">
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'registration-confirm-password-error' : undefined} autoComplete="new-password" />
              <button className="registration-modal__password-toggle" type="button" onClick={() => setShowConfirmPassword(value => !value)} aria-label={showConfirmPassword ? t('auth.hideConfirmed') : t('auth.show')}>{showConfirmPassword ? t('auth.hide') : t('auth.show')}</button>
            </span>
            {errors.confirmPassword && <small id="registration-confirm-password-error" className="registration-modal__error">{errors.confirmPassword}</small>}
          </label>
          <button className="registration-modal__submit" type="submit" disabled={loading}>
            {loading ? '...' : t('auth.createAccountButton')}
          </button>
        </form>
      </section>
    </div>
  );
}
