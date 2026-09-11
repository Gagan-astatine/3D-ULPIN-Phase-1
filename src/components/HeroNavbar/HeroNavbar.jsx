import { useState } from 'react';
import logo from '../../assets/logo.png';
import LoginModal from '../LoginModal/LoginModal.jsx';
import LanguageSelector from '../LanguageSelector/LanguageSelector.jsx';
import { useTranslation } from '../../i18n/useTranslation.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';
import './HeroNavbar.css';

const NAV_ITEMS = ['Platform', 'Technology', 'About'];

export default function HeroNavbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { session } = useAuth();

  const handleAuthClick = async () => {
    if (session) {
      await supabase.auth.signOut();
      // Optional: reset hash if on protected route
      window.location.hash = '';
    } else {
      setLoginOpen(true);
    }
  };

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
        <div className="hero-navbar__actions">
          <LanguageSelector className="hero-navbar__lang" />
          <button className="hero-navbar__login" type="button" onClick={handleAuthClick}>
            {session ? t('auth.logout') || 'Logout' : t('nav.login')}
          </button>
        </div>
        <button className="hero-navbar__menu" type="button" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          <span />
          <span />
        </button>
      </nav>
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </>
  );
}
