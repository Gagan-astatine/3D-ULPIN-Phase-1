import { useState, useEffect } from 'react';
import HeroNavbar from '../components/HeroNavbar/HeroNavbar.jsx';
import logo from '../assets/logo.png';
import { useTranslation } from '../i18n/useTranslation.js';
import { useAuth } from '../context/AuthContext.jsx';
import './HeroPage.css';

export default function HeroPage({ onBegin }) {
  const { t } = useTranslation();
  const [departing, setDeparting] = useState(false);
  const [activeLayer, setActiveLayer] = useState(0);
  const { session } = useAuth();

  const beginJourney = () => {
    setDeparting(true);
    window.setTimeout(onBegin, 520);
  };

  useEffect(() => {
    // If user logs in while on HeroPage, automatically begin the journey
    if (session) {
      beginJourney();
    }
  }, [session]);

  const slideLabels = t('hero.slideLabels');
  const slideDescriptions = t('hero.slideDescriptions');
  const layers = ['01', '02', '03', '04'].map((number, index) => [number, slideLabels[index], slideDescriptions[index]]);
  const capabilities = [
    ['01', t('hero.capabilityTitles.0'), t('hero.capabilityDescriptions.0')],
    ['02', t('hero.capabilityTitles.1'), t('hero.capabilityDescriptions.1')],
    ['03', t('hero.capabilityTitles.2'), t('hero.capabilityDescriptions.2')],
    ['04', t('hero.capabilityTitles.3'), t('hero.capabilityDescriptions.3')]
  ];
  const workflowTitles = t('hero.workflowTitles');
  const workflowDescriptions = t('hero.workflowDescriptions');
  return <main className={`hero-page${departing ? ' hero-page--departing' : ''}`}>
    <section className="hero-page__hero" id="hero">
      <HeroNavbar />
      <div className="hero-page__terrain" aria-hidden="true"><span /><span /><span /></div>
      <div className="hero-page__coordinates" aria-hidden="true"><span>12.9718° N</span><span>77.5946° E</span></div>
      <div className="hero-page__hero-grid">
        <section className="hero-page__content">
          <p className="hero-page__eyebrow">{t('hero.eyebrow')}</p>
          <h1>{t('hero.headline.0')}<br />{t('hero.headline.1')}<br /><em>{t('hero.headline.2')}</em><br />{t('hero.headline.3')}</h1>
          <p className="hero-page__description">{t('hero.description')}</p>
          <div className="hero-page__actions"><button className="hero-page__cta" type="button" onClick={beginJourney}>{t('hero.begin')} <span aria-hidden="true">→</span></button><a href="#platform" className="hero-page__secondary">{t('hero.explore')} <span>↓</span></a></div>
        </section>
        <div className="hero-page__visual" aria-label="Digital twin layer visualization">
          <div className="hero-page__orb"><span className="hero-page__orb-ring" /><span className="hero-page__orb-core" /></div>
          <div className="hero-page__visual-label"><small>{t('hero.live')}</small><strong>{layers[activeLayer][1]}</strong><p>{layers[activeLayer][2]}</p></div>
          <div className="hero-page__slide-controls">{layers.map(([number], index) => <button key={number} className={activeLayer === index ? 'active' : ''} onClick={() => setActiveLayer(index)} aria-label={`Show slide ${number}`}>{number}</button>)}</div>
        </div>
      </div>
      <div className="hero-page__dimensions"><span><b>{t('hero.dimensions.0')}</b>{t('hero.dimensions.1')}</span><span><b>{t('hero.dimensions.2')}</b>{t('hero.dimensions.3')}</span><span><b>{t('hero.dimensions.4')}</b>{t('hero.dimensions.5')}</span></div>
      <a className="hero-page__scroll" href="#platform">{t('hero.scroll')} <span>↓</span></a>
    </section>

    <section className="hero-page__section hero-page__overview" id="platform">
      <p className="hero-page__section-label">{t('hero.overviewLabel')}</p><h2>{t('hero.overviewTitle')}</h2>
      <p className="hero-page__section-intro">{t('hero.overviewOne')}</p>
      <p className="hero-page__section-intro">{t('hero.overviewTwo')}</p>
    </section>

    <section className="hero-page__section hero-page__capabilities" id="technology"><p className="hero-page__section-label">{t('hero.capabilitiesLabel')}</p><h2>{t('hero.capabilitiesTitle')}</h2><div className="hero-page__capability-grid">{capabilities.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>

    <section className="hero-page__section hero-page__workflow" id="about"><p className="hero-page__section-label">{t('hero.workflowLabel')}</p><h2>{t('hero.workflowTitle')}</h2><div className="hero-page__workflow-grid">{['01', '02', '03', '04'].map((number, index) => <article key={number}><span>{number}</span><h3>{workflowTitles[index]}</h3><p>{workflowDescriptions[index]}</p></article>)}</div></section>

    <section className="hero-page__vision"><div><p className="hero-page__section-label">{t('hero.visionLabel')}</p><h2>{t('hero.visionTitle.0')}<br />{t('hero.visionTitle.1')}<br />{t('hero.visionTitle.2')}</h2><p>{t('hero.visionDescription')}</p></div><div className="hero-page__vision-mark" aria-hidden="true"><img src={logo} alt="" /></div></section>

    <section className="hero-page__final"><p className="hero-page__section-label">{t('hero.finalLabel')}</p><h2>{t('hero.finalTitle')}</h2><p>{t('hero.finalDescription')}</p><button className="hero-page__cta" type="button" onClick={beginJourney}>{t('hero.begin')} <span aria-hidden="true">→</span></button></section>

    <footer className="hero-page__footer"><div><strong>{t('hero.footerBrand')}</strong><p>{t('hero.footerTagline.0')}<br />{t('hero.footerTagline.1')}<br />{t('hero.footerTagline.2')}</p><small>{t('hero.footerDescription')}</small></div>{t('hero.footerGroups').map(group => <div key={group[0]}><b>{group[0]}</b>{group.slice(1).map(item => <span key={item}>{item}</span>)}</div>)}<div className="hero-page__footer-bottom">{t('hero.footerCopyright')}</div></footer>
  </main>;
}
