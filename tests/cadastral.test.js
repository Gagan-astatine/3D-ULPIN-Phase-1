import test from "node:test";
import assert from "node:assert/strict";
import { EntityCollection, JulianDate, PolygonGeometry, Cartesian3, Ellipsoid } from "cesium";
import { getCadastralDataset } from "../src/services/propertyService.js";
import { hierarchy, floorBaseHeight, SELECTED_COLOR, color } from "../src/utils/visualizationUtils.js";
import { createParcelLayer } from "../src/components/ParcelLayer/ParcelLayer.js";
import { createBuildingLayer } from "../src/components/BuildingLayer/BuildingLayer.js";
import { createFloorLayer } from "../src/components/FloorLayer/FloorLayer.js";
import { flyCamera } from "../src/utils/cameraUtils.js";
const data = await getCadastralDataset();
const time = JulianDate.now();
const visible = {
  details: false,
  parcels: true,
  buildings: true,
  floors: true,
  labels: true,
  boundaries: true,
  terrain: true
};
const selected = p => ({
  selectedProperty: p,
  selectedBuilding: data.index.getBuildingForProperty(p),
  selectedParcel: data.index.getParcelForProperty(p),
  selectedFloor: null,
  showFloors: false,
  explodeView: false,
  layerVisibility: {
    ...visible
  }
});
test("dataset integrity: counts, unique IDs, ownership, complete vertical stacks", () => {
  assert.equal(data.parcels.length, 12);
  assert.equal(data.buildings.length, 12);
  assert.equal(data.floors.length, 54);
  for (const [rows, key] of [[data.properties, "ulpin"], [data.parcels, "parcelId"], [data.buildings, "buildingId"], [data.floors, "unitId"]]) assert.equal(new Set(rows.map(r => r[key])).size, rows.length);
  for (const b of data.buildings) {
    const p = data.index.getPropertyByBuildingId(b.buildingId),
      parcel = data.index.getParcelForBuilding(b),
      floors = data.index.getFloorsForBuilding(b.buildingId);
    assert.equal(p.parcelId, parcel.parcelId);
    assert.equal(p.crs, "EPSG:4326");
    assert.equal(b.height, b.floorHeight * b.numberOfFloors);
    assert.equal(floors.length, b.numberOfFloors);
    assert.equal(p.builtUpArea, floors.reduce((sum, f) => sum + f.area, 0));
    floors.forEach((f, i) => {
      assert.equal(f.floorNumber, i + 1);
      assert.equal(f.ulpin, p.ulpin);
      assert.equal(f.parcelId, p.parcelId);
    });
    const minX = Math.min(...parcel.coordinates.map(c => c[0])),
      maxX = Math.max(...parcel.coordinates.map(c => c[0]));
    const minY = Math.min(...parcel.coordinates.map(c => c[1])),
      maxY = Math.max(...parcel.coordinates.map(c => c[1]));
    for (const [x, y] of b.footprint) {
      assert.ok(x > minX && x < maxX && y > minY && y < maxY);
    }
  }
  assert.equal(new Set(data.buildings.map(b => b.propertyType)).size, 5);
  assert.ok(new Set(data.buildings.map(b => b.footprint.length)).size >= 3);
});
test("all identifier types resolve with case and arbitrary whitespace; all twelve property records resolve", () => {
  for (const p of data.properties) {
    for (const id of [p.ulpin, p.parcelId, p.buildingId].filter(Boolean)) assert.equal(data.index.searchProperty(` \t${id.toLowerCase().replace("-", " - ")}\n`), p);
  }
  assert.equal(data.index.searchProperty("ULPIN-DEMO-0002").name, "Meridian House");
  assert.equal(data.index.searchProperty("PARCEL-009").buildingId, "BUILDING-009");
  for (const q of ["", "   ", "NOT-FOUND", "BUILDING-999", "ULPIN-DEMO"]) assert.equal(data.index.searchProperty(q), null);
});
test("each building footprint triangulates as an actual Cesium extruded polygon", () => {
  for (const b of data.buildings) {
    const geometry = PolygonGeometry.createGeometry(new PolygonGeometry({
      polygonHierarchy: hierarchy(b.footprint),
      height: 0,
      extrudedHeight: b.height
    }));
    assert.ok(geometry.indices.length > 0);
    assert.ok(geometry.attributes.position.values.every(Number.isFinite));
    let min = Infinity,
      max = -Infinity;
    const positions = geometry.attributes.position.values;
    for (let i = 0; i < positions.length; i += 3) {
      const h = Ellipsoid.WGS84.cartesianToCartographic(Cartesian3.fromArray(positions, i)).height;
      min = Math.min(min, h);
      max = Math.max(max, h);
    }
    assert.ok(Math.abs(min) < 0.001);
    assert.ok(Math.abs(max - b.height) < 0.001);
  }
});
test("selection, floor reveal, explosion reversal and independent layers preserve entity identity", () => {
  const viewer = {
    entities: new EntityCollection()
  };
  const model = {
    ground: {},
    state: null,
    explode: 0,
    reveal: 1
  };
  const parcelLayer = createParcelLayer(viewer, data.parcels),
    buildingLayer = createBuildingLayer(viewer, data.buildings, model),
    floorLayer = createFloorLayer(viewer, data, model);
  const originalIds = viewer.entities.values.map(e => e.id);
  const state = selected(data.properties[0]);
  model.state = state;
  const sync = () => [parcelLayer, buildingLayer, floorLayer].forEach(layer => layer.sync(state));
  sync();
  const building = viewer.entities.getById("building:BUILDING-001");
  assert.equal(building.show, true);
  const parentBoundary = viewer.entities.getById("boundary:PARCEL-001");
  assert.equal(parentBoundary.polyline.width.getValue(time), 3);
  state.showFloors = true;
  sync();
  assert.equal(building.show, false);
  const unit = viewer.entities.getById("floor:UNIT-001-F03");
  assert.equal(unit.show, true);
  assert.equal(unit.properties.getValue(time).objectType, "floor");
  assert.equal(unit.properties.getValue(time).ulpin, "ULPIN-DEMO-0001");
  assert.ok(Math.abs(unit.polygon.height.getValue(time) - 6.17) < 0.00001);
  state.selectedFloor = data.index.getFloor("UNIT-001-F03");
  sync();
  assert.ok(unit.polygon.material.getValue(time).color.equals(color("#35df85", 0.76)));
  for (const progress of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
    model.explode = progress;
    assert.ok(Math.abs(unit.polygon.height.getValue(time) - (6 + 4.4 * progress + 0.17)) < 1e-8);
    assert.ok(Math.abs(unit.polygon.extrudedHeight.getValue(time) - unit.polygon.height.getValue(time) - 2.73) < 1e-8);
  }
  model.ground = {
    "PARCEL-001": {
      base: 913,
      min: 912
    }
  };
  buildingLayer.setGround(model.ground);
  assert.equal(building.polygon.height.getValue(time), 913);
  assert.equal(building.polygon.extrudedHeight.getValue(time), 949);
  assert.ok(Math.abs(unit.polygon.height.getValue(time) - 919.17) < 1e-8);
  state.layerVisibility.parcels = false;
  sync();
  assert.equal(viewer.entities.getById("parcel:PARCEL-001").show, false);
  assert.equal(parentBoundary.show, true);
  state.layerVisibility.boundaries = false;
  sync();
  assert.equal(parentBoundary.show, false);
  state.layerVisibility.floors = false;
  sync();
  assert.equal(unit.show, false);
  assert.equal(building.show, true);
  state.layerVisibility.buildings = false;
  sync();
  assert.equal(building.show, false);
  assert.deepEqual(viewer.entities.values.map(e => e.id), originalIds);
});
test("floor intervals never overlap; explode offsets preserve the first floor", () => {
  for (const b of data.buildings) {
    const floors = data.index.getFloorsForBuilding(b.buildingId);
    assert.equal(floorBaseHeight(floors[0], b, 1), 0);
    for (let i = 1; i < floors.length; i++) {
      assert.equal(floorBaseHeight(floors[i], b, 0), i * 3);
      assert.ok(floorBaseHeight(floors[i], b, 1) >= floorBaseHeight(floors[i - 1], b, 1) + 3 + 2.19);
    }
  }
});
test("all camera modes produce finite geographic targets and short transitions", () => {
  const calls = [];
  const viewer = {
    isDestroyed: () => false,
    scene: {
      requestRender() {}
    },
    camera: {
      cancelFlight() {},
      lookAtTransform() {},
      flyToBoundingSphere: (sphere, options) => calls.push({
        sphere,
        options
      })
    }
  };
  const state = selected(data.properties[0]);
  state.selectedFloor = data.floors[2];
  state.explodeView = true;
  for (const mode of ["overview", "top", "3d", "property", "floor"]) flyCamera(viewer, mode, data, state, {
    "PARCEL-001": {
      base: 913
    }
  });
  assert.equal(calls.length, 5);
  calls.forEach(({
    sphere,
    options
  }) => {
    assert.ok(Number.isFinite(sphere.center.x));
    assert.ok(options.duration <= 1.2);
    assert.ok(options.offset.range > 0);
  });
  assert.equal(calls[1].options.offset.pitch, -Math.PI / 2);
  assert.ok(calls[4].options.offset.range < calls[3].options.offset.range);
});
