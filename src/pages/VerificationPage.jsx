import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX, ArrowLeft, FileJson } from 'lucide-react';
import { getCadastralDataset } from '../services/propertyService.js';
import { verifyCertificateLink, verifyCertificateFile } from '../services/certificateService.js';
import { CertificateSheet } from '../components/PropertyCertificate/PropertyCertificate.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
export default function VerificationPage({hash}){
  const { t } = useTranslation();
  const [data,setData]=useState(null),[result,setResult]=useState(null),[fileError,setFileError]=useState('');
  useEffect(()=>{let alive=true;getCadastralDataset().then(d=>{if(alive)setData(d);}).catch(()=>{if(alive)setFileError('Demo records could not load. Reload to retry.');});return()=>{alive=false;};},[]);
  useEffect(()=>{if(data){setResult(verifyCertificateLink(hash,data,t));setFileError('');}},[data,hash,t]);
  const upload=async e=>{const f=e.target.files?.[0];if(!f||!data)return;setFileError('');if(f.size>1000000){setFileError(t('verification.fileTooLarge'));return;}try{setResult(verifyCertificateFile(JSON.parse(await f.text()),data,t));}catch{setFileError(t('verification.invalidFile'));}e.target.value='';};
  const matched=result?.status==='matched';
  const messageKey = result?.status ? `verification.messages.${result.status}` : '';
  const translatedMessage = messageKey ? t(messageKey) : '';
  const resultMessage = translatedMessage === messageKey ? result?.message : translatedMessage;
  return <main className="verification-page"><header><a href="#/"><ArrowLeft size={18}/>{t('verification.back')}</a><strong>3D ULPIN <span>{t('verification.demo')}</span></strong></header><section className={`verification-result ${matched?'matched':'unmatched'}`}>
    {matched?<ShieldCheck size={38}/>:<ShieldX size={38}/>}<h1>{!result?t('verification.loading'):matched?t('verification.matched'):t('verification.unmatched')}</h1><p role="status">{resultMessage}</p><p>{t('verification.disclaimer')}</p>
    <label className="certificate-link"><FileJson size={18}/>{t('verification.upload')}<input type="file" accept=".json,application/json" onChange={upload} disabled={!data}/></label>{fileError&&<p role="alert">{fileError}</p>}
  </section>{matched&&<CertificateSheet certificate={result.certificate}/>}<footer>{t('verification.footer')}</footer></main>;
}
