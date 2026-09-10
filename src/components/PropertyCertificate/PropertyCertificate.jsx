import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileCheck2, ShieldCheck, X, ExternalLink, FileJson, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { createCertificate, verificationURL, downloadBlob } from '../../services/certificateService.js';
import { certificatePDF } from '../../services/certificatePdf.js';
import { formatArea } from '../../utils/propertyUtils.js';
import { useTranslation } from '../../i18n/useTranslation.js';
export function CertificateSheet({certificate,qr}) {
  const { t } = useTranslation();
  const p=certificate.record.property;
  return <article className="certificate-paper">
    <div className="certificate-masthead"><span>{t('3D ULPIN')}</span><strong>{t('FICTIONAL DEMO')}</strong></div>
    <div className="certificate-body"><p className="certificate-eyebrow">{t('PROPERTY VISUALIZATION CERTIFICATE')}</p><h2>{t(p.name)}</h2><p className="certificate-ulpin">{p.ulpin}</p>
      <dl className="certificate-fields">{[[t('Certificate'),certificate.record.certificateId],[t('Property category'),t(p.category)],[t('Parcel'),p.parcelId],[t('Building'),p.buildingId],[t('Land area'),formatArea(p.landArea)],[t('Built-up area'),formatArea(p.builtUpArea)],[t('Floors / height'),`${p.numberOfFloors} ${t('floors')} / ${p.buildingHeight} m`],[t('CRS'),p.crs],[t('Demo tenure'),t(p.tenure)],[t('Demo issue date'),certificate.record.issuedOn]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <p className="certificate-address">{t(p.address)}</p>
      <div className="certificate-validation"><FileCheck2 size={21}/><div><strong>{certificate.valid?t('Demo record checks passed'):t('Demo record checks failed')}</strong><p>{t('Relationships, coordinates, floor sequence, areas and unit partitions.')}</p></div></div>
      <div className="certificate-proof"><div><small>{t('SHA-256 RECORD FINGERPRINT')}</small><code>{certificate.digest}</code><p>{t('Revision')} {certificate.record.revision}<br/>{t('This fingerprint checks consistency with the app’s demo dataset. It is not a digital signature.')}</p></div>{qr&&<img src={qr} alt={t('QR code to verify this demo certificate')} width="148" height="148"/>}</div>
    </div><footer>{t('DEMO DATA — Not an official government land record or ownership certificate.')}</footer>
  </article>;
}
export default function PropertyCertificate({property,data,onClose}) {
  const { t } = useTranslation();
  const dialog=useRef(null),certificate=useMemo(()=>createCertificate(property,data,t),[property,data,t]);
  const [base,setBase]=useState(()=>import.meta.env.VITE_PUBLIC_APP_URL?.trim()||`${window.location.origin}${window.location.pathname}`),[qr,setQR]=useState(''),[notice,setNotice]=useState('');
  let url='',error='';try{url=verificationURL(certificate,base);}catch{error=t('Enter the full application URL, starting with http:// or https://.');}
  useEffect(()=>{dialog.current.showModal();const node=dialog.current;return()=>node.close();},[]);
  useEffect(()=>{let alive=true;setQR('');if(url)QRCode.toDataURL(url,{width:296,margin:4,errorCorrectionLevel:'M',color:{dark:'#071e30',light:'#ffffff'}}).then(value=>{if(alive)setQR(value);}).catch(()=>{if(alive)setNotice(t('The QR could not be generated. Check the application URL.'));});return()=>{alive=false;};},[url,t]);
  const local=url&&['localhost','127.0.0.1','[::1]','0.0.0.0'].includes(new URL(url).hostname);
  return <dialog ref={dialog} className="certificate-dialog" onCancel={e=>{e.preventDefault();onClose();}}>
    <div className="certificate-toolbar"><div><FileCheck2 size={22}/><span>{t('Property certificate')}<small>{property.ulpin}</small></span></div><button className="icon-button" onClick={onClose} aria-label={t('Close certificate')}><X size={23}/></button></div>
    <div className="certificate-layout"><CertificateSheet certificate={certificate} qr={qr}/><aside className="certificate-actions"><h3><QrCode size={20}/>{t('Verification link')}</h3><p>{t('Scanning the QR opens this property’s verification page.')}</p><label htmlFor="certificate-base">{t('Application URL')}</label><input id="certificate-base" type="url" value={base} onChange={e=>setBase(e.target.value)} spellCheck="false"/>{error&&<p role="alert" className="certificate-warning">{error}</p>}{local&&<p className="certificate-warning">{t('This URL works on this computer. For phone scanning, enter this app’s reachable LAN or hosted URL.')}</p>}
      <button className="primary-button" disabled={!url||!qr} onClick={()=>downloadBlob(`${certificate.record.certificateId}.pdf`,certificatePDF(certificate,url),'application/pdf')}><Download size={17}/>{t('Download certificate PDF')}</button>
      <button disabled={!url} onClick={()=>downloadBlob(`${certificate.record.certificateId}.json`,JSON.stringify(certificate,null,2),'application/json')}><FileJson size={17}/>{t('Download verification data')}</button>
      {url&&<a className="certificate-link" href={url} target="_blank" rel="noreferrer"><ExternalLink size={17}/>{t('Open verification page')}</a>}
      <div className="certificate-checks"><h3><ShieldCheck size={19}/>{t('Record consistency')}</h3>{certificate.checks.map(c=><p key={c.key}><span className={c.passed?'passed':'failed'}>{c.passed?'✓':'×'}</span>{c.label}</p>)}</div>
      <p className="certificate-limit">{t('These are fictional records. Verification does not validate legal ownership, survey accuracy, or government registration.')}</p>{notice&&<p role="status">{notice}</p>}
    </aside></div>
  </dialog>;
}
