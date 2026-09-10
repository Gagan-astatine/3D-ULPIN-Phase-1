import { CallbackProperty, Cartesian2, Cartesian3, ScreenSpaceEventHandler, ScreenSpaceEventType, JulianDate } from 'cesium';
import { createParcelLayer } from '../components/ParcelLayer/ParcelLayer.js';
import { createBuildingLayer } from '../components/BuildingLayer/BuildingLayer.js';
import { createUnitLayer } from '../components/FloorLayer/UnitLayer.js';
import { createModelLayer } from '../components/ModelLayer/ModelLayer.js';
import { createFloorLayer } from '../components/FloorLayer/FloorLayer.js';
import { createArchitectureLayer } from '../components/ArchitectureLayer/ArchitectureLayer.js';
import { createInfrastructureLayer } from '../components/InfrastructureLayer/InfrastructureLayer.js';
import { createAIBuildingLayer } from '../components/ModelLayer/AIBuildingLayer.jsx';
import { color, baseFor, ease, reducedMotion } from './visualizationUtils.js';
import { offsetPoint, floorTint, isAssetVisible, isBuildingVisible } from './architectureUtils.js';
import { centroid } from './propertyUtils.js';
import { resolvePickedObject } from './selectionUtils.js';

export function createSceneController(viewer, data, onSelect) {
  const model = {
    state: null,
    ground: {},
    explode: 0,
    reveal: 1
  };
  let raf = 0,
    lastBuilding = null,
    lastFloors = false,
    lastExplode = false,
    disposed = false;
  const filteredData = {
    ...data,
    buildings: data.buildings.filter(b => b.category !== 'aiBuildings')
  };
    
  const architecture = createArchitectureLayer(viewer, filteredData, model);
  const aiBuildingLayer = createAIBuildingLayer(viewer, data);
  
  const layers = [
    createParcelLayer(viewer, filteredData.parcels), 
    createBuildingLayer(viewer, filteredData.buildings), 
    createFloorLayer(viewer, filteredData, model), 
    createUnitLayer(viewer, filteredData, model), 
    createModelLayer(viewer, filteredData, model), 
    architecture, 
    createInfrastructureLayer(viewer, filteredData, model),
    aiBuildingLayer
  ];
  const callouts = [];
  function addCallout(key, {
    text,
    shade,
    anchor,
    end,
    properties,
    visible
  }) {
    const marker = viewer.entities.add({
      id: `callout:${key}`,
      properties,
      position: new CallbackProperty(end, false),
      label: {
        text,
        font: '12px sans-serif',
        fillColor: color('#f1f7ff'),
        showBackground: true,
        backgroundColor: color('#04243b', .96),
        backgroundPadding: new Cartesian2(10, 7),
        pixelOffset: new Cartesian2(0, -8),
        disableDepthTestDistance: Infinity
      }
    });
    const line = viewer.entities.add({
      id: `callout-line:${key}`,
      properties,
      polyline: {
        positions: new CallbackProperty(() => [anchor(), end()], false),
        width: 1.8,
        material: color(shade)
      }
    });
    const point = viewer.entities.add({
      id: `callout-pin:${key}`,
      properties,
      position: new CallbackProperty(anchor, false),
      point: {
        pixelSize: 7,
        color: color(shade),
        outlineColor: color('#082033'),
        outlineWidth: 1,
        disableDepthTestDistance: Infinity
      }
    });
    callouts.push({
      entities: [marker, line, point],
      visible
    });
  }
  const tower = data.buildings[0];
  addCallout('main-parcel', {
    text: 'Land Parcel\nULPIN-DEMO-0001',
    shade: '#ffe45e',
    anchor: () => Cartesian3.fromDegrees(...offsetPoint(tower.center, -29, -29), baseFor(model.ground, tower.parcelId) + .5),
    end: () => Cartesian3.fromDegrees(...offsetPoint(tower.center, -45, -29), baseFor(model.ground, tower.parcelId) + 3),
    properties: {
      objectType: 'parcel',
      parcelId: tower.parcelId
    },
    visible: s => s.selectedParcel?.parcelId === tower.parcelId && s.layerVisibility.parcels && !s.hiddenObjects?.[tower.parcelId] && !s.isolateSelection
  });
  [2, 8, 12].forEach(number => {
    const floor = data.index.getFloorsForBuilding(tower.buildingId).find(f => f.floorNumber === number);
    const height = () => baseFor(model.ground, tower.parcelId) + (number - 1) * (3 + 2.2 * model.explode) + 1.5;
    addCallout(floor.unitId, {
      text: `${floor.unitType === 'Commercial' ? 'Commercial Space' : 'Apartment'} · Floor ${number}\n${floor.unitId}`,
      shade: floorTint(floor),
      anchor: () => Cartesian3.fromDegrees(...offsetPoint(tower.center, -15, -3), height()),
      end: () => Cartesian3.fromDegrees(...offsetPoint(tower.center, -41, -3), height() + 2),
      properties: {
        objectType: 'floor',
        ...floor
      },
      visible: s => s.showFloors && s.layerVisibility.floors && s.selectedBuilding?.buildingId === tower.buildingId && isBuildingVisible(s, tower.buildingId) && !s.isolateSelection && !s.hiddenObjects?.[floor.unitId]
    });
  });
  data.infrastructure.filter(a => a.category !== 'parking').forEach(asset => {
    const height = () => baseFor(model.ground, 'PARCEL-001') + asset.baseHeight + (asset.category === 'rooftop' ? 5 + (model.state?.selectedBuilding?.buildingId === tower.buildingId ? 11 * 2.2 * model.explode : 0) : asset.kind === 'bridge' ? 2 : 0);
    const offset = asset.category === 'rooftop' ? [24, 12] : asset.category === 'flyover' ? [19, 0] : [0, -5];
    addCallout(asset.assetId, {
      text: `${asset.name}\n${asset.assetId}`,
      shade: asset.color,
      anchor: () => Cartesian3.fromDegrees(...asset.center, height()),
      end: () => Cartesian3.fromDegrees(...offsetPoint(asset.center, ...offset), height() + 3),
      properties: {
        objectType: 'asset',
        assetId: asset.assetId
      },
      visible: s => isAssetVisible(s, asset) && (asset.baseHeight >= 0 || s.cutaway || s.cameraMode === 'underground')
    });
  });
  const active = viewer.entities.add({
    id: 'selected:ulpin',
    show: false,
    position: new CallbackProperty(() => {
      const s = model.state;
      if (!s?.selectedParcel) return Cartesian3.ZERO;
      return Cartesian3.fromDegrees(...(s.selectedBuilding?.center ?? centroid(s.selectedParcel.coordinates)), baseFor(model.ground, s.selectedParcel.parcelId) + (s.selectedBuilding?.height ?? 0) + (s.selectedBuilding?.roofHeight ?? 0) + ((s.selectedBuilding?.numberOfFloors ?? 1) - 1)*2.2*model.explode + 8);
    }, false),
    label: {
      text: '',
      font: '12px sans-serif',
      fillColor: color('#fff5aa'),
      showBackground: true,
      backgroundColor: color('#062239', .94),
      backgroundPadding: new Cartesian2(12, 8),
      disableDepthTestDistance: Infinity
    }
  });
  const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  const resolve = position => {
    return resolvePickedObject(viewer.scene.drillPick(position, 12), JulianDate.now());
  };
  handler.setInputAction(event => onSelect(resolve(event.position)), ScreenSpaceEventType.LEFT_CLICK);
  handler.setInputAction(event => {
    const picked = viewer.scene.pick(event.endPosition)?.id;
    viewer.scene.canvas.style.cursor = picked?.properties ? 'pointer' : 'grab';
  }, ScreenSpaceEventType.MOUSE_MOVE);
  function sync(state) {
    if (disposed) return;
    model.state = state;
    const changed = lastBuilding !== state.selectedBuilding?.buildingId;
    if (changed) {
      cancelAnimationFrame(raf);
      model.explode = 0;
      model.reveal = 1;
    }
    if (changed || lastExplode !== state.explodeView || lastFloors !== state.showFloors) {
      cancelAnimationFrame(raf);
      const start = model.explode,
        target = state.explodeView ? 1 : 0,
        reveal = state.showFloors && (!lastFloors || changed),
        startTime = performance.now();
      if (reveal) model.reveal = .45;
      const animate = now => {
        if (disposed) return;
        const progress = reducedMotion() ? 1 : Math.min(1, (now - startTime) / (850 / (state.motionSpeed ?? 1)));
        model.explode = start + (target - start) * ease(progress);
        model.reveal = reveal ? .45 + .55 * ease(progress) : 1;
        viewer.scene.requestRender();
        if (progress < 1) raf = requestAnimationFrame(animate);
      };
      raf = requestAnimationFrame(animate);
    }
    lastBuilding = state.selectedBuilding?.buildingId;
    lastFloors = state.showFloors;
    lastExplode = state.explodeView;
    layers.forEach(layer => layer.sync(state));
    callouts.forEach(callout => callout.entities.forEach(entity => entity.show = state.layerVisibility.labels && callout.visible(state)));
    active.show = !!state.selectedProperty && state.layerVisibility.labels && !state.hiddenObjects?.[state.selectedParcel?.parcelId] && (!state.selectedBuilding || isBuildingVisible(state, state.selectedBuilding.buildingId));
    if (state.selectedProperty) {
      active.label.text = `${state.selectedProperty.ulpin}\n${state.selectedProperty.name}`;
      active.properties = {
        objectType: 'building',
        buildingId: state.selectedBuilding?.buildingId,
        parcelId: state.selectedParcel.parcelId
      };
    }
    viewer.scene.requestRender();
  }
  return {
    sync,
    get ground() {
      return model.ground;
    },
    setGround(ground) {
      model.ground = ground;
      layers.forEach(layer => layer.setGround?.(ground));
      viewer.scene.requestRender();
    },
    setSchematic(show) {
      architecture.setSchematic(show);
      if (model.state) architecture.sync(model.state);
      viewer.scene.requestRender();
    },
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      handler.destroy();
      viewer.entities.removeAll();
    }
  };
}
