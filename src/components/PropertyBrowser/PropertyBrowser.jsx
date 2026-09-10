import { useEffect, useRef } from 'react';
import { Building2, House, Landmark, ShoppingBag, Trees, School, HeartPulse, Hotel, X, Navigation, FileCheck2 } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation.js';

export const propertyIcon=style=>({mansion:House,temple:Landmark,mall:ShoppingBag,park:Trees,school:School,hospital:HeartPulse,hotel:Hotel,museum:Landmark,civic:Landmark})[style]??Building2;
export default function PropertyBrowser({data,selected,onSelect,onCertificate,onClose}){
  const { t } = useTranslation();
  const dialog=useRef(null);
  useEffect(()=>{dialog.current.showModal();const node=dialog.current;return()=>node.close();},[]);
  return <dialog ref={dialog} className="property-browser ref-panel" onCancel={e=>{e.preventDefault();onClose();}}><header><div><h2>{t('Explore 12 demo properties')}</h2><p>{t('Select a building to fly to its model, floors and property units.')}</p></div><button onClick={onClose} aria-label={t('Close property browser')}><X/></button></header><div className="property-catalog">{data.properties.map(p=>{const Icon=propertyIcon(p.architecturalStyle);return <article className={selected?.ulpin===p.ulpin?'active':''} key={p.ulpin}><div><Icon size={28}/><span>{t(p.category)}</span></div><h3>{t(p.name)}</h3><code>{p.ulpin}</code><p>{p.numberOfFloors} {t('floors')} · {p.buildingHeight} m · {p.landArea.toLocaleString('en-IN')} m² {t('land')}</p><footer><button onClick={()=>onSelect(p)}><Navigation size={16}/>{t('View in 3D')}</button><button onClick={()=>onCertificate(p)} aria-label={`${t('Certificate for')} ${t(p.name)}`}><FileCheck2 size={18}/></button></footer></article>;})}</div></dialog>;
}
