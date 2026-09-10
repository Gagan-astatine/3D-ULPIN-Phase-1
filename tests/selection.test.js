import test from 'node:test';
import assert from 'node:assert/strict';
import { EntityCollection, JulianDate } from 'cesium';
import { getCadastralDataset } from '../src/services/propertyService.js';
import { objectSelection, inspectorObjects, resolvePickedObject } from '../src/utils/selectionUtils.js';
import { createModelLayer } from '../src/components/ModelLayer/ModelLayer.js';
import { createUnitLayer } from '../src/components/FloorLayer/UnitLayer.js';
import { cameraTarget } from '../src/utils/cameraUtils.js';
const data = await getCadastralDataset();
const empty = {hiddenObjects: {}, layerVisibility: {details: true, units: true, rooftop: true}, cameraMode: '3d'};

test('object panel follows all twelve buildings and every row resolves to visible, focusable domain context', () => {
  for (const building of data.buildings) {
    const state = objectSelection(data, {...empty, crossSection: true, autoRotate: true}, {objectType: 'building', buildingId: building.buildingId}, true);
    assert.equal(state.selectedBuilding, building);
    assert.equal(state.crossSection, false);
    assert.equal(state.autoRotate, false);
    assert.deepEqual(cameraTarget(state.cameraMode, data, state).center, building.center);
    const rows = inspectorObjects(data, state);
    assert.equal(rows[0].key, building.parcelId);
    assert.equal(rows[1].key, building.buildingId);
    assert.equal(rows.filter(row => row.meta.objectType === 'floor').length, building.numberOfFloors);
    for (const row of rows) {
      const selected = objectSelection(data, state, row.meta, true);
      assert.ok(selected, row.key);
      assert.equal(selected.hiddenObjects[row.key], false);
      const target = cameraTarget(selected.cameraMode, data, selected);
      assert.ok([...target.center, target.elevation, target.range, target.pitch].every(Number.isFinite));
      if (row.meta.objectType === 'floor') {
        assert.equal(selected.selectedBuilding, building);
        assert.deepEqual(target.center, building.center);
        const units = inspectorObjects(data, selected).filter(row => row.meta.objectType === 'unit');
        assert.equal(units.length, data.index.getUnitsForFloor(row.key).length);
        for (const unit of units) assert.equal(objectSelection(data, selected, unit.meta, true).selectedUnit.unitId, unit.key);
      }
    }
  }
});

test('unit selection restores hidden parent floor/building and floor visibility hides all child units', () => {
  const viewer = {entities: new EntityCollection()}, model = {ground: {}, explode: 0};
  const layers = [createModelLayer(viewer, data, model), createUnitLayer(viewer, data, model)];
  for (const building of data.buildings) {
    const floor = data.index.getFloorsForBuilding(building.buildingId)[0];
    const unit = data.index.getUnitsForFloor(floor.unitId)[0];
    const selected = objectSelection(data, {...empty, hiddenObjects: {[building.buildingId]: true, [floor.unitId]: true, [unit.unitId]: true}, layerVisibility: {buildings: false, floors: false, units: false}}, {objectType: 'unit', unitId: unit.unitId}, true);
    model.state = selected;
    layers.forEach(layer => layer.sync(selected));
    assert.equal(viewer.entities.getById(`unit:${unit.unitId}`).show, true);
    assert.equal(viewer.entities.getById(`model:${building.buildingId}:${floor.unitId}`).show, false);
    selected.hiddenObjects[floor.unitId] = true;
    layers.forEach(layer => layer.sync(selected));
    assert.equal(viewer.entities.getById(`unit:${unit.unitId}`).show, false);
  }
});

test('GLB and unit pick metadata use the same selection path and never steal a different floor hit', () => {
  const viewer = {entities: new EntityCollection()}, model = {ground: {}, explode: 0};
  createModelLayer(viewer, data, model); createUnitLayer(viewer, data, model);
  const time = JulianDate.now();
  for (const building of data.buildings) {
    const hit = {id: viewer.entities.getById(`model:${building.buildingId}:building`)};
    assert.equal(objectSelection(data, empty, resolvePickedObject([hit], time)).selectedBuilding, building);
    const floor = data.index.getFloorsForBuilding(building.buildingId)[0];
    const unit = data.index.getUnitsForFloor(floor.unitId)[0];
    const floorHit = {id: viewer.entities.getById(`model:${building.buildingId}:${floor.unitId}`)};
    const unitHit = {id: viewer.entities.getById(`unit:${unit.unitId}`)};
    assert.equal(resolvePickedObject([floorHit, unitHit], time).unitId, unit.unitId);
    assert.equal(resolvePickedObject([hit, unitHit], time).objectType, 'building');
    assert.equal(objectSelection(data, empty, resolvePickedObject([unitHit], time)).selectedFloor, floor);
  }
  assert.equal(resolvePickedObject([], time), null);
  assert.equal(resolvePickedObject([{id: 'non-interactive-ground'}], time), null);
  assert.equal(objectSelection(data, empty, {objectType: 'floor', unitId: 'missing'}), null);
});
