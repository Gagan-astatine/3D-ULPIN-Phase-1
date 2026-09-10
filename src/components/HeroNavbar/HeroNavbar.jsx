import { useState } from 'react';
import logo from '../../assets/logo.png';
import LoginModal from '../LoginModal/LoginModal.jsx';
import LanguageSelector from '../LanguageSelector/LanguageSelector.jsx';
import { useTranslation } from '../../i18n/useTranslation.js';
import './HeroNavbar.css';

const NAV_ITEMS = ['Platform', 'Technology', 'About'];

export default function HeroNavbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <nav className="hero-navbar" aria-label="Hero navigation">
        <a className="hero-navbar__brand" href="#hero" aria-label="3Avastha home">
          <img src={logo} alt="" />
          <span>३Avastha</span>
        </a>
        <div className={`hero-navbar__links${menuOpen ? ' hero-navbar__links--open' : ''}`}>
          {NAV_ITEMS.map(item => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{t(`nav.${item.toLowerCase()}`)}</a>)}
        </div>
        <LanguageSelector className="hero-navbar__login" />
        <button className="hero-navbar__login" type="button" onClick={() => setLoginOpen(true)}>{t('nav.login')}</button>
        <button className="hero-navbar__menu" type="button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          <span />
          <span />
        </button>
      </nav>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
