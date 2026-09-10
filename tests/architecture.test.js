import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityCollection, JulianDate, PolygonGeometry, PolylineVolumeGeometry, Cartesian3, Ellipsoid, Rectangle } from 'cesium';
import { getCadastralDataset } from '../src/services/propertyService.js';
import { createInfrastructureLayer } from '../src/components/InfrastructureLayer/InfrastructureLayer.js';
import { createArchitectureLayer } from '../src/components/ArchitectureLayer/ArchitectureLayer.js';
import { clipNorthHalf, polygonFor, circleShape, isAssetVisible } from '../src/utils/architectureUtils.js';
import { cameraTarget } from '../src/utils/cameraUtils.js';
const data = await getCadastralDataset(),
  now = JulianDate.now();
const state = {
  selectedBuilding: data.buildings[0],
  selectedProperty: data.properties[0],
  selectedParcel: data.parcels[0],
  selectedFloor: null,
  selectedAsset: null,
  showFloors: true,
  cutaway: true,
  crossSection: false,
  hiddenObjects: {},
  isolateSelection: false,
  layerVisibility: {
    buildings: true,
    labels: true
  },
  cameraMode: '3d'
};
test('architectural scene has a 12-floor tower and resolvable infrastructure/context objects', () => {
  assert.equal(data.buildings[0].numberOfFloors, 12);
  assert.equal(data.infrastructure.length, 8);
  assert.equal(data.context.blocks.length, 50);
  const assets = [...data.infrastructure, ...data.context.blocks];
  assert.equal(new Set(assets.map(a => a.assetId)).size, 58);
  assets.forEach(a => assert.equal(data.index.getAsset(a.assetId), a));
  assert.equal(data.index.getFloor('UNIT-001-F08').displayColor, '#ffab40');
  assert.equal(data.parcels[0].area, 4216);
});
test('north-half section clips every valid footprint and remains triangulatable', () => {
  for (const b of data.buildings) {
    const clipped = clipNorthHalf(b.footprint, b.center[1]);
    assert.ok(clipped.length >= 3);
    assert.ok(clipped.every(p => p[1] >= b.center[1] - 1e-12));
    const geometry = PolygonGeometry.createGeometry(new PolygonGeometry({
      polygonHierarchy: polygonFor(b, true),
      height: 0,
      extrudedHeight: b.height
    }));
    assert.ok(geometry.indices.length > 0);
    assert.ok(geometry.attributes.position.values.every(Number.isFinite));
  }
});
test('all conduits triangulate as real 3D pipes at their fictional underground elevations', () => {
  for (const asset of data.infrastructure.filter(a => a.coordinates)) {
    const positions = Cartesian3.fromDegreesArrayHeights(asset.coordinates.flatMap(p => [...p, asset.baseHeight - asset.radius]));
    const geometry = PolylineVolumeGeometry.createGeometry(new PolylineVolumeGeometry({
      polylinePositions: positions,
      shapePositions: circleShape(asset.radius)
    }));
    assert.ok(geometry.indices.length > 0);
    assert.ok(geometry.attributes.position.values.every(Number.isFinite));
    const heights = [];
    for (let i = 0; i < geometry.attributes.position.values.length; i += 3) heights.push(Ellipsoid.WGS84.cartesianToCartographic(Cartesian3.fromArray(geometry.attributes.position.values, i)).height);
    assert.ok(Math.abs(Math.min(...heights) - (asset.baseHeight - asset.radius)) < .001);
    assert.ok(Math.abs(Math.max(...heights) - (asset.baseHeight + asset.radius)) < .001);
  }
});
test('infrastructure metadata, visibility, isolation and rooftop explosion stay synchronized', () => {
  const viewer = {
      entities: new EntityCollection()
    },
    model = {
      state: {
        ...state
      },
      ground: {},
      explode: 0
    };
  const layer = createInfrastructureLayer(viewer, data, model);
  layer.sync(model.state);
  const pipe = viewer.entities.getById('asset:DEMO-WATER-001:conduit');
  assert.equal(pipe.properties.getValue(now).objectType, 'asset');
  assert.equal(pipe.properties.getValue(now).assetId, 'DEMO-WATER-001');
  assert.equal(pipe.show, true);
  model.state = {
    ...model.state,
    layerVisibility: {
      ...state.layerVisibility,
      water: false
    }
  };
  layer.sync(model.state);
  assert.equal(pipe.show, false);
  model.state = {
    ...model.state,
    layerVisibility: {},
    isolateSelection: true,
    selectedAsset: data.index.getAsset('DEMO-WATER-001')
  };
  layer.sync(model.state);
  assert.equal(pipe.show, true);
  assert.equal(viewer.entities.getById('asset:DEMO-FLYOVER-001:volume').show, false);
  const rooftop = viewer.entities.getById('asset:DEMO-ROOFTOP-001:volume');
  assert.equal(rooftop.polygon.height.getValue(now), 36);
  model.explode = 1;
  assert.ok(Math.abs(rooftop.polygon.height.getValue(now) - 60.2) < 1e-8);
  model.explode = 0;
  assert.equal(rooftop.polygon.height.getValue(now), 36);
});
test('cutaway uses a bounded globe window and can return to a continuous surface', () => {
  const viewer = {
      entities: new EntityCollection(),
      scene: {
        globe: {
          translucency: {}
        }
      }
    },
    model = {
      state,
      ground: {},
      explode: 0
    };
  const layer = createArchitectureLayer(viewer, data, model);
  layer.sync(state);
  assert.equal(viewer.scene.globe.translucency.enabled, true);
  assert.ok(Rectangle.equals(viewer.scene.globe.translucency.rectangle, Rectangle.fromDegrees(...data.context.cutawayBounds)));
  const surface = viewer.entities.getById('architecture:ground');
  assert.equal(surface.polygon.hierarchy.getValue(now).holes.length, 1);
  layer.sync({
    ...state,
    cutaway: false
  });
  assert.equal(viewer.scene.globe.translucency.enabled, false);
  assert.equal(surface.polygon.hierarchy.getValue(now).holes.length, 0);
  layer.sync({
    ...state,
    cameraMode: 'underground'
  });
  assert.ok(Rectangle.equals(viewer.scene.globe.translucency.rectangle, Rectangle.fromDegrees(...data.context.undergroundBounds)));
  layer.setGround({
    'PARCEL-001': {
      base: 913
    }
  });
  assert.equal(viewer.entities.getById('architecture:excavation-bed').polygon.height.getValue(now), 897);
});
test('section and underground views have distinct, finite targets', () => {
  const underground = cameraTarget('underground', data, state),
    section = cameraTarget('section', data, state);
  assert.ok(underground.elevation < 0);
  assert.ok(section.elevation > 0);
  assert.notEqual(underground.pitch, section.pitch);
  assert.ok([underground, section].every(t => [...t.center, t.elevation, t.range, t.pitch, t.heading].every(Number.isFinite)));
});
test('four selectable property interests exactly partition each tower floor', () => {
  assert.equal(data.units.filter(u=>u.buildingId==='BUILDING-001').length, 48);
  for (const floor of data.index.getFloorsForBuilding('BUILDING-001')) {
    const units = data.index.getUnitsForFloor(floor.unitId);
    assert.equal(units.length, 4);
    assert.equal(units.reduce((sum, u) => sum + u.area, 0), floor.area);
    units.forEach(u => {
      assert.equal(u.ulpin, floor.ulpin);
      assert.equal(data.index.getUnit(u.unitId), u);
    });
  }
});
test('individual apartments stay selectable and move with the exploded floor', async () => {
  const {
    createUnitLayer
  } = await import('../src/components/FloorLayer/UnitLayer.js');
  const viewer = {
    entities: new EntityCollection()
  };
  const current = {
    ...state,
    selectedFloor: data.index.getFloor('UNIT-001-F08'),
    selectedUnit: data.index.getUnit('SPACE-001-F08-A'),
    layerVisibility: {
      floors: true,
      units: true
    }
  };
  const model = {
    state: current,
    ground: {},
    explode: 0
  };
  const layer = createUnitLayer(viewer, data, model);
  layer.sync(current);
  const unit = viewer.entities.getById('unit:SPACE-001-F08-A');
  assert.equal(unit.show, true);
  assert.equal(unit.properties.getValue(now).parentFloorId, 'UNIT-001-F08');
  assert.ok(Math.abs(unit.polygon.height.getValue(now) - 21.2) < 1e-8);
  model.explode = 1;
  assert.ok(Math.abs(unit.polygon.height.getValue(now) - 36.6) < 1e-8);
  layer.sync({
    ...current,
    isolateSelection: true
  });
  assert.equal(viewer.entities.getById('unit:SPACE-001-F08-B').show, false);
  assert.equal(unit.show, true);
  layer.sync({
    ...current,
    layerVisibility: {
      floors: true,
      units: false
    }
  });
  assert.equal(unit.show, false);
});
