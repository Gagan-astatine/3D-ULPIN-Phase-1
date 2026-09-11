import { useEffect, useState } from 'react';
import MapPage from './pages/MapPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';
import IntroLoader from './components/IntroLoader/IntroLoader.jsx';
import HeroPage from './pages/HeroPage.jsx';
import I18nProvider from './i18n/I18nProvider.jsx';
import Register from './pages/Register.jsx';
import Upload from './pages/Upload.jsx';
import Conflicts from './pages/Conflicts.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

function AppContent() {
  const [hash,setHash]=useState(()=>window.location.hash);
  const [introComplete,setIntroComplete]=useState(false);
  const [heroComplete,setHeroComplete]=useState(false);
  const { session, loading } = useAuth();
  
  useEffect(()=>{
    const update=()=>setHash(window.location.hash);
    window.addEventListener('hashchange',update);
    return()=>window.removeEventListener('hashchange',update);
  },[]);

  // Check if hash is for an internal app route that bypasses hero page
  const isAppRoute = hash.startsWith('#/verify') || hash.startsWith('#/register') || hash.startsWith('#/upload') || hash.startsWith('#/conflicts');

  if (!introComplete) return <IntroLoader onComplete={() => setIntroComplete(true)} />;

  const isHeroPage = !isAppRoute && !heroComplete;

  if (loading) return <div className="scene-loading">Loading...</div>;

  // Protect all routes except HeroPage
  if (!session && !isHeroPage) {
    return <Unauthorized />;
  }
  
  if (isHeroPage) return <HeroPage onBegin={() => setHeroComplete(true)} />;

  return (
    <>
      {hash.startsWith('#/verify') ? <VerificationPage hash={hash}/> : 
       hash.startsWith('#/register') ? <Register/> :
       hash.startsWith('#/upload') ? <Upload/> :
       hash.startsWith('#/conflicts') ? <Conflicts/> :
       <MapPage/>}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AuthProvider>
  );
}
