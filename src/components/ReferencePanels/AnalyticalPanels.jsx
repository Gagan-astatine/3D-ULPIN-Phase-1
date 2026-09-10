import { MapPin, Layers3, Scissors } from 'lucide-react';
import { floorTint } from '../../utils/architectureUtils.js';
import { useTranslation } from '../../i18n/useTranslation.js';
export function LocationPanel({
  data,
  onOverview
}) {
  const { t } = useTranslation();
  const bounds = data.context.extent,
    center = data.context.center;
  const point = ([lng, lat]) => [110 + (lng - center[0]) * 57000, 92 - (lat - center[1]) * 57000];
  return <section className="ref-panel location-panel"><div className="ref-panel-heading"><span><MapPin size={16} />{t('Location Map')}</span><small>{t('SCHEMATIC')}</small></div><button onClick={onOverview} aria-label={t('View complete neighborhood')}><svg viewBox="0 0 220 175" role="img" aria-label={t('Fictional Bengaluru neighborhood plan')}><rect width="220" height="175" fill="#283f44" />{data.context.roads.map((road, i) => <polyline key={i} points={road.coordinates.map(p => point(p).join(',')).join(' ')} fill="none" stroke="#758184" strokeWidth="7" />)}{data.parcels.map(p => <polygon key={p.parcelId} points={p.coordinates.map(c => point(c).join(',')).join(' ')} fill={p.parcelId === 'PARCEL-001' ? '#ead64955' : '#647e7044'} stroke={p.parcelId === 'PARCEL-001' ? '#ffeb56' : '#90a68e'} strokeWidth="1" />)}{data.buildings.map(b => <polygon key={b.buildingId} points={b.footprint.map(c => point(c).join(',')).join(' ')} fill="#bcc8c8" />)}<circle cx="110" cy="92" r="5" fill="#10b4ff" stroke="white" strokeWidth="2" /><text x="195" y="20" fill="white" fontSize="11">{t('N')} ↑</text><text x="12" y="159" fill="#e5f3ff" fontSize="10">{t('Bengaluru · fictional layout')}</text></svg></button></section>;
}
export function HeightProfile({
  data,
  state,
  onFloor,
  onAsset
}) {
  const { t } = useTranslation();
  const floors = data.index.getFloorsForBuilding(state.selectedBuilding?.buildingId ?? 'BUILDING-001');
  return <section className="ref-panel height-profile"><div className="ref-panel-heading">{t('Vertical Height Profile')}</div><div className="height-profile-content">{[...floors].reverse().filter((f, i) => i % 2 === 0 || f.floorNumber === 8).map(f => <button key={f.unitId} className={state.selectedFloor?.unitId === f.unitId ? 'selected' : ''} onClick={() => onFloor(f)}><span>+{f.floorNumber * 3} m</span><i style={{
          background: floorTint(f)
        }} /><span>{t('Floor')} {f.floorNumber}</span></button>)}<div className="height-zero"><span>0 m</span><i />{t('Ground Level')}</div>{data.infrastructure.filter(a => a.kind === 'pipe' || a.kind === 'tunnel').map(a => <button key={a.assetId} onClick={() => onAsset(a)}><span>{a.baseHeight} m</span><i style={{
          background: a.color
        }} /><span>{t(a.name)}</span></button>)}</div></section>;
}
export function AnalyticalPanels({
  data,
  state,
  onFloor,
  onCamera,
  open,
  onToggle
}) {
  const { t } = useTranslation();
  const b = state.selectedBuilding ?? data.buildings[0],
    floors = data.index.getFloorsForBuilding(b.buildingId);
  const legend = [['#ffe45e', t('Land Parcel')], ['#5e9eff', t('Building')], ['#b55bef', t('Apartment / Unit')], ['#35df85', t('Commercial Space')], ['#27cbe5', t('Parking')], ['#d17aff', t('Rooftop')], ['#ff982e', t('Underground Utilities')], ['#639dff', t('Flyover / Air Rights')], ['#f06177', t('Metro Tunnel')]];
  return <div className={`analysis-dock ${open ? '' : 'closed'}`}>{open && <><section className="ref-panel floor-stack-panel"><div className="ref-panel-heading"><span><Layers3 size={16} />{t('Building Interior View')}</span><small>{t('FLOOR STACK')}</small></div><div className="floor-stack-content"><svg viewBox="0 0 120 165" aria-label={t('Selectable floor stack')} role="img">{floors.map(f => {
              const y = 148 - (f.floorNumber - 1) * 11;
              return <g key={f.unitId} onClick={() => onFloor(f)} style={{
                cursor: 'pointer'
              }}><polygon points={`20,${y} 66,${y - 9} 104,${y} 58,${y + 9}`} fill={floorTint(f)} fillOpacity={state.selectedFloor?.unitId === f.unitId ? 1 : .5} stroke={state.selectedFloor?.unitId === f.unitId ? '#fff18a' : '#b9d8ef'} strokeWidth=".7" /><path d={`M20 ${y}v3l38 9 46-9v-3`} fill={floorTint(f)} fillOpacity=".3" /></g>;
            })}</svg><div className="compact-floor-list">{[...floors].reverse().map(f => <button key={f.unitId} className={state.selectedFloor?.unitId === f.unitId ? 'selected' : ''} onClick={() => onFloor(f)}><i style={{
                background: floorTint(f)
              }} />{t('Floor')} {f.floorNumber}<small>{f.unitType === 'Commercial' ? t('Commercial') : t('Unit')}</small></button>)}</div></div></section><section className="ref-panel legend-panel"><div className="ref-panel-heading">{t('Legend')}</div><div className="ref-legend">{legend.map(([shade, title]) => <span key={title}><i style={{
              background: shade
            }} />{title}</span>)}</div></section><section className="ref-panel section-panel"><div className="ref-panel-heading"><span><Scissors size={16} />{t('Cross-Section View')}</span></div><button aria-label={t('Open cross-section camera')} onClick={() => onCamera('section')}><svg viewBox="0 0 280 165" role="img" aria-label={t('Schematic elevation of the building and underground utilities')}><rect width="280" height="165" fill="#0b3953" /><path d="M15 107H267V162H15Z" fill="#3b3632" />{floors.map(f => <rect key={f.unitId} x="50" y={105 - f.floorNumber * 7} width="36" height="6" fill={floorTint(f)} stroke="#d6edff" strokeWidth=".5" />)}<path d="M17 107H267" stroke="#ead75a" strokeWidth="2" /><path d="M115 73H243M146 74v31M215 74v31" stroke="#9bacb9" strokeWidth="5" />{data.infrastructure.filter(a => a.kind === 'pipe').map((a, i) => <path key={a.assetId} d={`M18 ${115 + i * 7}H235`} stroke={a.color} strokeWidth="3" />)}<rect x="40" y="146" width="166" height="12" rx="4" fill="#af3c53" stroke="#ed6678" />{['+36 m', '0 m', '−12 m'].map((s, i) => <text key={s} x="239" y={[24, 110, 158][i]} fill="#cde4f5" fontSize="9">{s}</text>)}</svg></button></section></>}</div>;
}
