import { Layers3, ChevronUp, Mountain, Boxes, Cable, MapPin } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation.js';
const groups = [['Base Data', [['imagery', 'Satellite / Basemap'], ['terrain', 'Terrain / DEM'], ['parcels', 'GIS Parcel Layers'], ['boundaries', 'Property Boundaries']]], ['Building Data', [['buildings', 'Buildings'], ['details', 'Models & Textures'], ['floors', 'Floors'], ['units', 'Property Unit Overlays'], ['rooftop', 'Rooftop / Solar'], ['parking', 'Basement Parking'], ['contextBuildings', 'Surrounding Architecture'], ['aiBuildings', 'AI-Detected Building']]], ['Infrastructure', [['water', 'Water Pipeline'], ['sewer', 'Sewer Line'], ['electric', 'Electric Cable'], ['fiber', 'Fiber Optic'], ['metro', 'Metro Tunnel'], ['flyover', 'Flyover / Air Rights']]], ['Scene', [['labels', 'Spatial Labels'], ['shadows', 'Sun Shadows'], ['vegetation', 'Trees / Landscaping']]]];
export default function SpatialLayers({
  state,
  onLayer,
  onOpacity,
  onMotion,
  open,
  onOpen,
  environment
}) {
  const { t } = useTranslation();
  return <section className={`spatial-panel ref-panel ${open ? '' : 'is-collapsed'}`} aria-label={t('layers.panel')}><button className="ref-panel-heading" onClick={onOpen} aria-expanded={open}><span><Layers3 size={19} />{t('layers.panel')}</span><ChevronUp size={16} /></button>{open && <div className="spatial-scroll">{groups.map(([title, options], groupIndex) => <div className="spatial-group" key={title}><h3>{t('layers.groups')[groupIndex]}</h3>{options.map(([key]) => <label className="spatial-option" key={key}><input type="checkbox" checked={state.layerVisibility[key] !== false} onChange={() => onLayer(key)} /><span>{t(`layers.labels.${key}`)}</span><i className={state.layerVisibility[key] !== false ? 'on' : ''} /></label>)}{title === 'Base Data' && <label className="opacity-control"><span>{t('layers.opacity')}</span><input aria-label={t('layers.parcelOpacity')} type="range" min="0" max="1" step=".05" value={state.parcelOpacity} onChange={e => onOpacity(Number(e.target.value))} /><span>{Math.round(state.parcelOpacity * 100)}%</span></label>}</div>)}<div className="reference-data"><h3>{t('layers.reference')} <small>{t('layers.future')}</small></h3>{[['lidar', 'LiDAR / Point Cloud'], ['drone', 'Drone Imagery'], ['floorPlans', 'Floor Plans'], ['gnss', 'GNSS / CORS Points']].map(([key]) => <label key={key}><input type="checkbox" disabled />{t(`layers.${key}`)}</label>)}</div><label className="motion-speed">{t('layers.speed')}<select value={state.motionSpeed} onChange={e=>onMotion(Number(e.target.value))}><option value="0.65">{t('layers.slow')}</option><option value="1">{t('layers.normal')}</option><option value="1.5">{t('layers.fast')}</option></select></label><p className="source-status">{environment.imagery}<br />{environment.terrain}</p></div>}</section>;
}
