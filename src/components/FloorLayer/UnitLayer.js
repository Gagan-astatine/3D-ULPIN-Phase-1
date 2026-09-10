import { CallbackProperty, ColorMaterialProperty } from 'cesium';
import { hierarchy, ring, color, baseFor, floorBaseHeight } from '../../utils/visualizationUtils.js';
import { floorTint, isBuildingVisible } from '../../utils/architectureUtils.js';
export function createUnitLayer(viewer, data, model) {
  const entries = data.units.map(unit => {
    const building = data.index.getBuildingForProperty(data.index.getPropertyByBuildingId(unit.buildingId));
    const base = () => baseFor(model.ground, unit.parcelId) + floorBaseHeight(unit, building, model.explode);
    const properties = {
      objectType: 'unit',
      unitId: unit.unitId,
      parentFloorId: unit.parentFloorId,
      buildingId: unit.buildingId,
      parcelId: unit.parcelId,
      ulpin: unit.ulpin
    };
    const volume = viewer.entities.add({
      id: `unit:${unit.unitId}`,
      properties,
      polygon: {
        hierarchy: hierarchy(unit.footprint),
        height: new CallbackProperty(() => base() + .2, false),
        extrudedHeight: new CallbackProperty(() => base() + 2.88, false),
        material: new ColorMaterialProperty(new CallbackProperty(() => color(floorTint(unit), model.state?.selectedUnit?.unitId === unit.unitId ? .78 : .14), false))
      }
    });
    const border = viewer.entities.add({
      id: `unit-edge:${unit.unitId}`,
      properties,
      polyline: {
        positions: new CallbackProperty(() => ring(unit.footprint, base() + 2.9), false),
        width: 2,
        material: color('#ffe578')
      }
    });
    return {
      unit,
      volume,
      border
    };
  });
  return {
    sync(state) {
      entries.forEach(({
        unit,
        volume,
        border
      }) => {
        const show = state.showFloors && state.layerVisibility.floors && state.layerVisibility.units !== false && state.selectedFloor?.unitId === unit.parentFloorId && isBuildingVisible(state, unit.buildingId) && !state.hiddenObjects?.[unit.parentFloorId] && !state.hiddenObjects?.[unit.unitId] && (!state.isolateSelection || !state.selectedUnit || state.selectedUnit.unitId === unit.unitId);
        const building = data.index.getBuildingForProperty(data.index.getPropertyByBuildingId(unit.buildingId));
        volume.show = show && (!state.crossSection || unit.footprint.every(p => p[1] >= building.center[1] - 1e-10));
        border.show = volume.show;
        border.polyline.material = color(state.selectedUnit?.unitId === unit.unitId ? '#fff2a1' : '#d9e7ec', state.selectedUnit?.unitId === unit.unitId ? 1 : .65);
      });
    }
  };
}
