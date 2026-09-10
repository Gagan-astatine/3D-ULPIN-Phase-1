import { useCallback, useEffect, useRef, useState } from 'react';
import { Layers3, MapPin, RotateCcw, Map, Building2, Box, Scissors, UnfoldVertical, MoveDown, Plus, Minus, RotateCw, Maximize, HelpCircle, Layers, ChevronDown, X, Compass, Settings, Activity, Search as SearchIcon, Package } from 'lucide-react';
import CesiumViewer from '../components/CesiumViewer/CesiumViewer.jsx';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import SpatialLayers from '../components/ReferencePanels/SpatialLayers.jsx';
import ObjectInspector from '../components/ReferencePanels/ObjectInspector.jsx';
import { LocationPanel, HeightProfile, AnalyticalPanels } from '../components/ReferencePanels/AnalyticalPanels.jsx';
import PropertyCertificate from '../components/PropertyCertificate/PropertyCertificate.jsx';
import PropertyBrowser from '../components/PropertyBrowser/PropertyBrowser.jsx';
import CircularMenu from '../components/CircularMenu/CircularMenu.jsx';
import { ExpandableActionBar } from '../components/ExpandableActionBar/ExpandableActionBar.jsx';
import { AnimatedTopBar } from '../components/AnimatedTopBar/AnimatedTopBar.jsx';
import { getCadastralDataset } from '../services/propertyService.js';
import { propertySelection, objectSelection } from '../utils/selectionUtils.js';
import LanguageSelector from '../components/LanguageSelector/LanguageSelector.jsx';
import { useTranslation } from '../i18n/useTranslation.js';
import logo from '../assets/logo.png';
export const initialState = {
  selectedProperty: null,
  selectedParcel: null,
  selectedBuilding: null,
  selectedFloor: null,
  selectedAsset: null,
  selectedUnit: null,
  showFloors: true,
  explodeView: false,
  crossSection: false,
  cutaway: true,
  isolateSelection: false,
  parcelOpacity: .7,
  hiddenObjects: {},
  searchQuery: '',
  searchError: '',
  cameraMode: '3d',
  motionSpeed: 1,
  autoRotate: false,
  layerVisibility: {
    details: true,
    shadows: false,
    imagery: true,
    terrain: true,
    parcels: true,
    boundaries: true,
    buildings: true,
    floors: true,
    units: true,
    rooftop: true,
    parking: true,
    contextBuildings: true,
    aiBuildings: false,
    water: true,
    sewer: true,
    electric: true,
    fiber: true,
    metro: true,
    flyover: true,
    labels: true,
    vegetation: true
  }
};
export default function MapPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null),
    [state, setState] = useState(initialState),
    [error, setError] = useState('');
  const [layerOpen, setLayerOpen] = useState(false),
    [dockOpen, setDockOpen] = useState(false),
    [showLocationMap, setShowLocationMap] = useState(false),
    [showHeightProfile, setShowHeightProfile] = useState(false),
    [showInspector, setShowInspector] = useState(false),
    [modal, setModal] = useState(''),
    [copyStatus, setCopyStatus] = useState('');
  const [certificateProperty, setCertificateProperty] = useState(null), [propertiesOpen, setPropertiesOpen] = useState(false);
  const [environment, setEnvironment] = useState({
    imagery: 'Preparing basemap…',
    terrain: 'Flat ground'
  });
  const mapRef = useRef(null),
    searchRef = useRef(null),
    stateRef = useRef(state),
    copyTimer = useRef(0);
  stateRef.current = state;
  const propertyState = propertySelection;
  useEffect(() => {
    let alive = true;
    getCadastralDataset().then(dataset => {
      if (!alive) return;
      setData(dataset);
      const next = propertyState(dataset, dataset.properties[0], initialState);
      next.selectedFloor = dataset.index.getFloor('UNIT-001-F08');
      next.selectedUnit = dataset.index.getUnit('SPACE-001-F08-A');
      setState(next);
    }).catch(() => setError(t('map.loadError')));
    return () => {
      alive = false;
      clearTimeout(copyTimer.current);
    };
  }, [propertyState]);
  const clear = useCallback(() => setState(s => ({
    ...s,
    selectedObjectType: null,
    selectedProperty: null,
    selectedParcel: null,
    selectedBuilding: null,
    selectedFloor: null,
    selectedAsset: null,
    selectedUnit: null,
    explodeView: false,
    isolateSelection: false,
    autoRotate: false,
    showFloors: true
  })), []);
  const selectObject = useCallback((metadata, fly = false) => {
    if (!data || !metadata?.objectType) {
      clear();
      return;
    }
    const next = objectSelection(data, stateRef.current, metadata, fly);
    if (!next) return;
    stateRef.current = next;
    setState(next);
    if (window.innerWidth <= 850) setLayerOpen(false);
    if (fly) mapRef.current?.fly(next.cameraMode, next);
  }, [data, clear, propertyState]);
  const selectFloor = f => selectObject({
    objectType: 'floor',
    unitId: f.unitId
  });
  const selectAsset = a => selectObject({
    objectType: 'asset',
    assetId: a.assetId
  }, a.baseHeight < 0);
  const camera = mode => {
    let next = {
      ...stateRef.current,
      cameraMode: mode,
      autoRotate: false,
      crossSection: mode === 'section',
      selectedUnit: mode === 'section' ? null : stateRef.current.selectedUnit,
      cutaway: ['section', 'underground'].includes(mode) ? true : stateRef.current.cutaway
    };
    if (['property', 'floor', 'parcel', 'section'].includes(mode) && !next.selectedProperty && data) next = propertyState(data, data.properties[0], next);
    next.cameraMode = mode;
    next.crossSection = mode === 'section';
    stateRef.current = next;
    setState(next);
    mapRef.current?.fly(mode, next);
  };
  const reset = () => {
    if (!data) return;
    const next = propertyState(data, data.properties[0], {
      ...initialState,
      layerVisibility: {
        ...initialState.layerVisibility
      },
      hiddenObjects: {}
    });
    next.selectedFloor = data.index.getFloor('UNIT-001-F08');
    next.selectedUnit = data.index.getUnit('SPACE-001-F08-A');
    stateRef.current = next;
    setState(next);
    mapRef.current?.fly('3d', next);
  };
  const search = query => {
    const p = data?.index.searchProperty(query);
    if (!p) {
      setState(s => ({
        ...s,
        searchQuery: query,
        searchError: t('map.searchError')
      }));
      return;
    }
    selectObject({
      objectType: 'building',
      parcelId: p.parcelId,
      buildingId: p.buildingId,
      ulpin: p.ulpin
    }, true);
    setState(s => ({
      ...s,
      searchQuery: query,
      searchError: ''
    }));
  };
  const explode = () => {
    if (!data) return;
    const current = stateRef.current;
    let next = current.selectedBuilding ? {
      ...current
    } : propertyState(data, data.properties[0], current);
    next = {
      ...next,
      explodeView: !next.explodeView,
      crossSection: false,
      showFloors: true,
      selectedAsset: null,
      layerVisibility: {
        ...next.layerVisibility,
        floors: true
      },
      cameraMode: '3d',
      autoRotate: false
    };
    stateRef.current = next;
    setState(next);
    mapRef.current?.fly('3d', next);
  };
  const toggleLayer = key => setState(s => {
    const visible = !s.layerVisibility[key];
    return {
      ...s,
      layerVisibility: {
        ...s.layerVisibility,
        [key]: visible
      },
      ...(key === 'units' && !visible ? {
        selectedUnit: null
      } : {}),
      ...(key === 'floors' ? {
        showFloors: visible,
        selectedFloor: visible ? s.selectedFloor : null,
        selectedUnit: visible ? s.selectedUnit : null,
        explodeView: visible ? s.explodeView : false
      } : {})
    };
  });
  const toggleCutaway = () => {
    const next = {
      ...stateRef.current,
      cutaway: !stateRef.current.cutaway
    };
    if (!next.cutaway && next.cameraMode === 'underground') {
      next.cameraMode = '3d';
      next.crossSection = false;
      mapRef.current?.fly('3d', next);
    }
    stateRef.current = next;
    setState(next);
  };
  const hideObject = key => setState(s => ({
    ...s,
    hiddenObjects: {
      ...s.hiddenObjects,
      [key]: !s.hiddenObjects[key]
    }
  }));
  const copyId = async () => {
    const id = state.selectedAsset?.assetId ?? state.selectedUnit?.unitId ?? state.selectedFloor?.unitId ?? state.selectedProperty?.ulpin;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Copy unavailable');
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(''), 2000);
  };
  const parent = () => {
    if (state.selectedUnit) {
      selectObject({
        objectType: 'floor',
        unitId: state.selectedUnit.parentFloorId
      });
      return;
    }
    if (state.selectedFloor || state.selectedAsset) selectObject({
      objectType: 'building',
      parcelId: state.selectedParcel.parcelId
    });else if (state.selectedProperty) {
      const next = {
        ...state,
        selectedObjectType: 'parcel',
        selectedBuilding: null,
        selectedFloor: null,
        selectedAsset: null,
        selectedUnit: null,
        showFloors: false
      };
      setState(next);
      stateRef.current = next;
    }
  };
  const focus = () => camera(state.selectedAsset ? state.selectedAsset.baseHeight < 0 ? 'underground' : 'asset' : state.selectedFloor ? 'floor' : 'property');
  const updateEnvironment = useCallback(patch => setEnvironment(s => ({
    ...s,
    ...patch
  })), []);
  useEffect(() => {
    const key = e => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) {
        clear();
        setModal('');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [clear]);
  const topModes = [['overview', t('map.cityOverview'), MapPin], ['parcel', t('map.parcelView'), Building2], ['property', t('map.buildingView'), Box], ['underground', t('map.undergroundView'), MoveDown], ['section', t('map.crossSectionMode'), Scissors]];
  
  const circularItems = [
    { label: t('map.explore'), icon: <Compass size={20} />, onClick: () => setModal(''), isActive: !modal && !propertiesOpen },
    { label: t('map.properties'), icon: <Building2 size={20} />, onClick: () => setPropertiesOpen(true), isActive: propertiesOpen },
    { label: t('map.layers'), icon: <Layers size={20} />, onClick: () => setLayerOpen(v => !v), isActive: layerOpen },
    { label: t('map.search'), icon: <SearchIcon size={20} />, onClick: () => searchRef.current?.focus(), isActive: false },
    { label: t('map.tools'), icon: <Settings size={20} />, onClick: () => setModal('Tools'), isActive: modal === 'Tools' },
    { label: t('map.analytics'), icon: <Activity size={20} />, onClick: () => setDockOpen(v => !v), isActive: dockOpen }
  ];

  const actionItems = [
    {
      id: "spatial-layers",
      label: t('map.spatialLayers'),
      icon: <Layers3 size={16} />,
      onClick: () => setLayerOpen(v => !v),
      active: layerOpen
    },
    {
      id: "location-map",
      label: t('map.locationMap'),
      icon: <MapPin size={16} />,
      onClick: () => setShowLocationMap(v => !v),
      active: showLocationMap
    },
    {
      id: "height-profile",
      label: t('map.heightProfile'),
      icon: <UnfoldVertical size={16} />,
      onClick: () => setShowHeightProfile(v => !v),
      active: showHeightProfile
    },
    {
      id: "building-interior",
      label: t('map.buildingInterior'),
      icon: <Box size={16} />,
      onClick: () => setDockOpen(v => !v),
      active: dockOpen
    },
    {
      id: "legends",
      label: t('map.legends'),
      icon: <Layers size={16} />,
      onClick: () => setDockOpen(v => !v),
      active: dockOpen
    },
    {
      id: "cross-section",
      label: t('map.crossSection'),
      icon: <Scissors size={16} />,
      onClick: () => setDockOpen(v => !v),
      active: dockOpen
    },
    {
      id: "property-details",
      label: t('map.propertyDetails'),
      icon: <Building2 size={16} />,
      onClick: () => setShowInspector(v => !v),
      active: showInspector
    },
    {
      id: "3d-objects",
      label: t('map.objects'),
      icon: <Package size={16} />,
      onClick: () => setShowInspector(v => !v),
      active: showInspector
    }
  ];

  return <div className={`reference-app ${layerOpen ? 'layers-open' : ''} ${dockOpen ? 'dock-open' : ''}`}>
    <header className="reference-header"><div className="reference-brand"><img className="reference-logo" src={logo} alt="3Avastha logo" /><div><h1>३AVASTHA  </h1><p>{t('map.tagline')}</p></div></div><div className="reference-location"><MapPin size={22} /><span>{t('map.location')}<small>12.9718° N, 77.5946° E</small></span></div><LanguageSelector className="reference-demo" /><span className="reference-demo">{t('map.demo')}</span></header>
    <main className="reference-workspace">
      <CircularMenu items={circularItems} onOpenChange={isOpen => {
        if (isOpen) setDockOpen(false);
      }} />
      <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', zIndex: 60, display: 'flex', flexDirection: 'column' }}> 
        <ExpandableActionBar
          items={actionItems}
          classNames={{ root: "flex-col", track: "flex-col" }}
        />
      </div>
      {data ? <CesiumViewer ref={mapRef} data={data} state={state} onSelect={selectObject} onEnvironment={updateEnvironment} onManualCamera={() => setState(s => s.autoRotate ? {...s,autoRotate:false} : s)} onBasicMode={() => setState(s => ({...s, autoRotate: false, layerVisibility: {...s.layerVisibility, details: false, shadows: false}}))} /> : <div className="scene-loading">{error || t('map.loading')}</div>}
      {layerOpen && <SpatialLayers state={state} onLayer={toggleLayer} onOpacity={parcelOpacity => setState(s => ({
        ...s,
        parcelOpacity
      }))} onMotion={motionSpeed => setState(s => ({...s,motionSpeed}))} open={layerOpen} onOpen={() => setLayerOpen(v => !v)} environment={environment} />}
      <div className="reference-search"><SearchBar ref={searchRef} query={state.searchQuery} error={state.searchError} onQuery={q => setState(s => ({
          ...s,
          searchQuery: q,
          searchError: ''
        }))} onSearch={search} /></div>
      <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 50, transform: 'scale(0.85)', transformOrigin: 'top left' }}>
        <AnimatedTopBar
          activeId={state.explodeView ? 'explode' : state.autoRotate ? 'rotate' : state.cameraMode}
          items={[
            ...topModes.map(([mode, label, Icon]) => ({
              id: mode,
              label: label,
              icon: <Icon size={20} />,
              onClick: () => camera(mode)
            })),
            {
              id: 'explode',
              label: t('map.explodedFloors'),
              icon: <UnfoldVertical size={20} />,
              onClick: explode
            },
            {
              id: 'rotate',
              label: state.autoRotate ? t('map.autoOrbit') : t('map.autoOrbitStart'),
              icon: <RotateCw size={20} />,
              onClick: () => setState(s => ({...s, autoRotate: !s.autoRotate}))
            }
          ]}
        />
      </div>
      {data && <>
        {showInspector && <ObjectInspector data={data} state={state} onObject={selectObject} onHidden={hideObject} onFocus={focus} onIsolate={() => setState(s => ({ ...s, isolateSelection: !s.isolateSelection }))} onParent={parent} onCopy={copyId} onClear={clear} onCertificate={() => setCertificateProperty(state.selectedProperty)} onBrowse={() => setPropertiesOpen(true)} copyStatus={copyStatus} />}
        {showLocationMap && <LocationPanel data={data} onOverview={() => camera('overview')} />}
        {showHeightProfile && <HeightProfile data={data} state={state} onFloor={selectFloor} onAsset={selectAsset} />}
        <AnalyticalPanels data={data} state={state} onFloor={selectFloor} onCamera={camera} open={dockOpen} onToggle={() => setDockOpen(v => !v)} />
      </>}
      <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 40 }}>
        <AnimatedTopBar
          activeId={null} // You can manage active state if desired, or let it default
          items={[
            { id: 'home', label: t('map.home'), icon: <Map size={20} />, onClick: reset },
            { id: 'zoomin', label: t('map.zoomIn'), icon: <Plus size={20} />, onClick: () => mapRef.current?.zoom(1) },
            { id: 'zoomout', label: t('map.zoomOut'), icon: <Minus size={20} />, onClick: () => mapRef.current?.zoom(-1) },
            { id: 'rotateleft', label: t('map.rotateLeft'), icon: <RotateCcw size={20} />, onClick: () => mapRef.current?.orbit(-1) },
            { id: 'rotateright', label: t('map.rotateRight'), icon: <RotateCw size={20} />, onClick: () => mapRef.current?.orbit(1) },
            { id: 'topview', label: t('map.topView'), icon: <ChevronDown size={20} />, onClick: () => camera('top') },
            { id: 'oblique', label: t('map.oblique'), icon: <Box size={20} />, onClick: () => camera('3d') },
            { id: 'cutaway', label: t('map.cutaway'), icon: <Scissors size={20} />, onClick: toggleCutaway },
            { id: 'floors', label: t('map.floors'), icon: <Layers size={20} />, onClick: () => toggleLayer('floors') },
            { id: 'explode', label: t('map.explode'), icon: <UnfoldVertical size={20} />, onClick: explode },
            { id: 'fullscreen', label: t('map.fullscreen'), icon: <Maximize size={20} />, onClick: () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => setModal(t('map.fullscreenUnavailable'))) }
          ]}
        />
      </div>
      <div className="interaction-note">{t('map.interaction')}</div>
      {propertiesOpen && data && <PropertyBrowser data={data} selected={state.selectedProperty} onClose={() => setPropertiesOpen(false)} onSelect={p => { setPropertiesOpen(false); selectObject({objectType:'building',parcelId:p.parcelId},true); }} onCertificate={p => { setPropertiesOpen(false); setCertificateProperty(p); }}/>}
      {certificateProperty && data && <PropertyCertificate property={certificateProperty} data={data} onClose={() => setCertificateProperty(null)}/>}
      {modal && <div className="reference-modal"><section className="ref-panel"><button className="modal-close" aria-label={t('common.close')} onClick={() => setModal('')}><X size={20} /></button><HelpCircle size={30} /><h2>{modal === 'Tools' ? t('map.tools') : modal === 'Analytics' ? t('map.analytics') : modal}</h2>{modal === 'Tools' ? <p>{t('map.toolsHelp')}</p> : <p>{modal === 'Analytics' ? t('map.analyticsMessage') : t('map.actionUnavailable')}</p>}<button className="primary-button" onClick={() => setModal('')}>{t('map.returnExplore')}</button></section></div>}
    </main>
  </div>;
}
