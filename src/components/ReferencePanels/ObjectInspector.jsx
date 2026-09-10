import { useState } from 'react';
import { propertyIcon } from '../PropertyBrowser/PropertyBrowser.jsx';
import { Box, Building2, Layers3, ParkingSquare, TrainFront, Cable, Waves, Sun, Eye, EyeOff, ChevronUp, Navigation, Scan, Copy, CornerUpLeft, X } from 'lucide-react';
import { floorTint } from '../../utils/architectureUtils.js';
import { inspectorObjects } from '../../utils/selectionUtils.js';
import { formatArea } from '../../utils/propertyUtils.js';
import { useTranslation } from '../../i18n/useTranslation.js';
export const assetIcon = asset => ({
  rooftop: Sun,
  parking: ParkingSquare,
  metro: TrainFront,
  water: Waves,
  sewer: Waves,
  electric: Cable,
  fiber: Cable,
  flyover: Building2
})[asset?.category] ?? Building2;
export default function ObjectInspector({
  data,
  state,
  onObject,
  onHidden,
  onFocus,
  onIsolate,
  onParent,
  onCopy,
  onClear,
  copyStatus,
  onCertificate,
  onBrowse
}) {
  const { t } = useTranslation();
  const [tab,setTab]=useState('properties');
  const p = state.selectedProperty,
    b = state.selectedBuilding,
    f = state.selectedUnit ?? state.selectedFloor,
    a = state.selectedAsset;
  const objects = inspectorObjects(data, state).map(object => ({
    ...object,
    shade: object.asset?.color ?? (object.floor ? floorTint(object.floor) : object.meta.objectType === 'parcel' ? '#ffe451' : '#57a4fa'),
    icon: object.asset ? assetIcon(object.asset) : object.floor ? Layers3 : object.meta.objectType === 'parcel' ? Box : Building2
  }));
  const propertyObjects = data.properties.map(p=>({key:p.buildingId,label:p.name,detail:p.category,shade:'#91c3da',icon:propertyIcon(p.architecturalStyle),meta:{objectType:'building',parcelId:p.parcelId}}));
  const shownObjects = tab === 'properties' ? propertyObjects : objects;
  const current = tab === 'properties' ? b?.buildingId ?? p?.buildingId : state.selectedObjectType === 'parcel' ? p?.parcelId : a?.assetId ?? f?.unitId ?? b?.buildingId ?? p?.parcelId;
  const title = a?.name ? t(a.name) : state.selectedUnit?.name ? t(state.selectedUnit.name) : (f ? `${t(f.unitType)} · ${t('Floor')} ${f.floorNumber}` : p?.name ? t(p.name) : t('Select a 3D object'));
  const details = a ? [[t('Object ID'), a.assetId], [t('Type'), t(a.name)], [t('Elevation'), `${a.baseHeight} m`], [t('Vertical Range'), `${a.baseHeight - (a.radius ?? 0)} m to ${a.baseHeight + (a.height ?? a.radius)} m`], [t('Area'), a.area ? formatArea(a.area) : t('Linear infrastructure')], [t('Parent ULPIN'), a.ulpin ?? t('No cadastral record')], [t('Status'), t('Fictional demo asset')]] : f ? [[t('ULPIN'), f.ulpin], [t('Unit ID'), f.unitId], [t('Type'), t(f.unitType)], [t('Building'), t(b.name)], [t('Floor'), f.floorNumber], [t('Area'), formatArea(f.area)], [t('Volume'), `${(f.area * b.floorHeight).toLocaleString('en-IN')} m³`], [t('Vertical Range'), `${(f.floorNumber - 1) * b.floorHeight} m to ${f.floorNumber * b.floorHeight} m`], [t('Parcel'), f.parcelId], [t('CRS'), p.crs], [t('Status'), t('Validated · mock')]] : p ? [[t('ULPIN'), p.ulpin], [t('Category'), t(p.category)], [t('Type'), t(p.propertyType)], [t('Building'), p.buildingId ?? t('Unbuilt')], [t('Parcel'), p.parcelId], [t('Land Area'), formatArea(p.landArea)], [t('Built-up Area'), formatArea(p.builtUpArea)], [t('Height'), `${p.buildingHeight} m`], [t('Floors'), p.numberOfFloors], [t('CRS'), p.crs], [t('Status'), t('Validated · mock')]] : [];
  return <aside className="inspector-column"><section className="ref-panel object-panel"><div className="ref-panel-heading"><span><Layers3 size={19} />{t('3D ULPIN Objects')}</span><ChevronUp size={16} /></div><div className="object-tabs"><button className={tab === 'properties' ? 'active' : ''} onClick={()=>setTab('properties')}>{t('12 Properties')}</button><button className={tab === 'objects' ? 'active' : ''} onClick={()=>setTab('objects')}>{t('Scene objects')}</button><button onClick={onBrowse} aria-label={t('Open property catalog')}>↗</button></div><div className="object-scroll">{shownObjects.map(object => {
          const Icon = object.icon;
          return <div className={`object-row ${current === object.key ? 'selected' : ''}`} key={object.key}><button onClick={() => onObject(object.meta, true)} aria-pressed={current === object.key}><i style={{
                color: object.shade,
                borderColor: object.shade + '66'
              }}><Icon size={21} /></i><span>{t(object.label)}<small>{t(object.detail)}</small></span></button><button className="object-eye" onClick={() => onHidden(object.key)} aria-label={`${state.hiddenObjects[object.key] ? t('Show') : t('Hide')} ${t(object.label)}`}>{state.hiddenObjects[object.key] ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>;
        })}</div></section>
  <section className="ref-panel detail-panel"><div className="ref-panel-heading"><span><Building2 size={20} />{t('Property Details')}</span><button aria-label={t('Clear selection')} onClick={onClear}><X size={16} /></button></div><div className="detail-scroll"><h2>{title}</h2><dl>{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{state.selectedFloor && data.index.getUnitsForFloor(state.selectedFloor.unitId).length > 0 && <div className="unit-picker"><span>{t('SELECT A PROPERTY UNIT')}</span>{data.index.getUnitsForFloor(state.selectedFloor.unitId).map(unit => <button key={unit.unitId} className={state.selectedUnit?.unitId === unit.unitId ? 'active' : ''} onClick={() => onObject({
            objectType: 'unit',
            unitId: unit.unitId
          })}>{unit.name.split(' ').at(-1)}</button>)}</div>}{(p || a) && <div className="detail-actions"><button onClick={onFocus}><Navigation size={16} />{t('Fly To')}</button><button className={state.isolateSelection ? 'active' : ''} onClick={onIsolate}><Scan size={16} />{state.isolateSelection ? t('Show All') : t('Isolate')}</button><button onClick={onParent} disabled={!p}><CornerUpLeft size={16} />{t('Show Parent')}</button><button onClick={onCopy}><Copy size={16} />{copyStatus ? t(copyStatus) : t('Copy ID')}</button></div>}{p && <button className="certificate-launch" onClick={onCertificate}>{t('View property certificate & QR')}</button>}<p className="demo-record-note"><strong>{t('DEMO DATA')}</strong> — {t('Fictional architecture, identifiers and infrastructure. Not official government land records.')}</p></div></section></aside>;
}
