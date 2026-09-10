import { CallbackProperty, Cartesian2, Cartesian3, ColorMaterialProperty } from 'cesium';
import { color, ring, SELECTED_COLOR, floorBaseHeight, baseFor } from '../../utils/visualizationUtils.js';
import { polygonFor, floorTint, isBuildingVisible } from '../../utils/architectureUtils.js';
export function createFloorLayer(viewer, data, model) {
  const entries = data.floors.map(floor => {
    const building = data.index.getBuildingForProperty(data.index.getPropertyByBuildingId(floor.buildingId));
    const properties = {
      objectType: 'floor',
      ...floor
    };
    const base = () => baseFor(model.ground, floor.parcelId) + floorBaseHeight(floor, building, model.explode);
    const material = new ColorMaterialProperty(new CallbackProperty(() => color(model.state?.layerVisibility.units === false ? '#90bacd' : floorTint(floor), (model.state?.selectedFloor?.unitId === floor.unitId ? .76 : model.state?.cameraMode === 'underground' ? .14 : .4) * model.reveal), false));
    const volume = viewer.entities.add({
      id: `floor:${floor.unitId}`,
      properties,
      polygon: {
        hierarchy: polygonFor(building),
        height: new CallbackProperty(() => base() + .17, false),
        extrudedHeight: new CallbackProperty(() => base() + building.floorHeight - .10, false),
        material,
        closeBottom: true,
        closeTop: true
      }
    });
    const slab = viewer.entities.add({
      id: `floor-slab:${floor.unitId}`,
      properties,
      polygon: {
        hierarchy: polygonFor(building),
        height: new CallbackProperty(() => base() + .02, false),
        extrudedHeight: new CallbackProperty(() => base() + .18, false),
        material: color('#d3e1e7', .9)
      }
    });
    const outline = viewer.entities.add({
      id: `floor-edge:${floor.unitId}`,
      properties,
      polyline: {
        positions: new CallbackProperty(() => ring(building.footprint, base() + building.floorHeight - .04), false),
        width: 1.5,
        material: color(floorTint(floor), .95)
      }
    });
    const mullions = building.footprint.map((point, side) => {
      const end = building.footprint[(side + 1) % building.footprint.length];
      return viewer.entities.add({
        id: `floor-frame:${floor.unitId}:${side}`,
        properties,
        polyline: {
          positions: new CallbackProperty(() => {
            const points = [];
            for (let step = 0; step <= 6; step++) {
              const lng = point[0] + (end[0] - point[0]) * step / 6,
                lat = point[1] + (end[1] - point[1]) * step / 6;
              const bottom = base() + .15,
                top = base() + building.floorHeight - .10;
              points.push(Cartesian3.fromDegrees(lng, lat, step % 2 ? top : bottom), Cartesian3.fromDegrees(lng, lat, step % 2 ? bottom : top));
            }
            return points;
          }, false),
          width: 1,
          material: color('#d8eff7', .7)
        }
      });
    });
    const [lng, lat] = building.footprint[1];
    const label = viewer.entities.add({
      id: `floor-label:${floor.unitId}`,
      properties,
      position: new CallbackProperty(() => Cartesian3.fromDegrees(lng, lat, base() + building.floorHeight / 2), false),
      label: {
        text: `F${String(floor.floorNumber).padStart(2, '0')}`,
        font: '12px sans-serif',
        fillColor: color('#e6f3ff'),
        showBackground: true,
        backgroundColor: color('#052238', .85),
        pixelOffset: new Cartesian2(22, 0),
        disableDepthTestDistance: Infinity
      }
    });
    return {
      floor,
      building,
      volume,
      slab,
      outline,
      mullions,
      label,
      section: false
    };
  });
  return {
    sync(state) {
      entries.forEach(entry => {
        const {
          floor,
          building,
          volume,
          slab,
          outline,
          mullions,
          label
        } = entry;
        const show = state.showFloors && state.layerVisibility.floors && floor.buildingId === (state.selectedBuilding?.buildingId ?? 'BUILDING-001') && isBuildingVisible(state, floor.buildingId) && !state.hiddenObjects?.[floor.unitId] && (!state.isolateSelection || !state.selectedFloor || floor.unitId === state.selectedFloor.unitId);
        const selected = floor.unitId === state.selectedFloor?.unitId;
        const detailed = state.layerVisibility.details !== false && !state.crossSection && !selected;
        volume.show = show && !detailed && !(state.isolateSelection && state.selectedUnit);
        slab.show = show && !(state.isolateSelection && state.selectedUnit);
        outline.show = show && !(state.isolateSelection && state.selectedUnit);
        mullions.forEach(part => part.show = show && !detailed && !state.crossSection && !(state.isolateSelection && state.selectedUnit));
        label.show = show && state.explodeView && state.layerVisibility.labels;
        if (entry.section !== state.crossSection) {
          volume.polygon.hierarchy = polygonFor(building, state.crossSection);
          slab.polygon.hierarchy = polygonFor(building, state.crossSection);
          entry.section = state.crossSection;
        }
        outline.polyline.material = color(selected ? '#fff29c' : floorTint(floor));
        outline.polyline.width = selected ? 3 : 1.4;
        label.label.fillColor = color(selected ? '#fff29c' : '#e2f1ed');
      });
    }
  };
}
