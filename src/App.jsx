import { useEffect, useState } from 'react';
import MapPage from './pages/MapPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import IntroLoader from './components/IntroLoader/IntroLoader.jsx';
import HeroPage from './pages/HeroPage.jsx';
import I18nProvider from './i18n/I18nProvider.jsx';
export default function App(){
  const [hash,setHash]=useState(()=>window.location.hash);
  const [introComplete,setIntroComplete]=useState(false);
  const [heroComplete,setHeroComplete]=useState(false);
  useEffect(()=>{const update=()=>setHash(window.location.hash);window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update);},[]);
  return <I18nProvider>
    {!introComplete ? <IntroLoader onComplete={() => setIntroComplete(true)} /> : !hash.startsWith('#/verify') && !heroComplete ? <HeroPage onBegin={() => setHeroComplete(true)} /> : hash.startsWith('#/verify') ? <VerificationPage hash={hash}/> : <MapPage/>}
  </I18nProvider>;
}
