import { Cartesian3 } from "cesium";
import { isBuildingVisible } from '../../utils/architectureUtils.js';
import { color, hierarchy, ring, TYPE_COLORS, SELECTED_COLOR, baseFor } from "../../utils/visualizationUtils.js";
export function createBuildingLayer(viewer, buildings) {
  const entries = buildings.map(building => {
    const properties = {
      objectType: "building",
      buildingId: building.buildingId,
      parcelId: building.parcelId,
      ulpin: building.ulpin
    };
    const mass = viewer.entities.add({
      id: `building:${building.buildingId}`,
      properties,
      polygon: {
        hierarchy: hierarchy(building.footprint),
        height: 0,
        extrudedHeight: building.height,
        material: color(TYPE_COLORS[building.propertyType]),
        closeTop: true,
        closeBottom: true
      }
    });
    const foundation = viewer.entities.add({
      id: `foundation:${building.buildingId}`,
      properties,
      polygon: {
        hierarchy: hierarchy(building.footprint),
        height: 0,
        extrudedHeight: 0.05,
        material: color("#667678")
      }
    });
    const roof = viewer.entities.add({
      id: `roof:${building.buildingId}`,
      properties,
      polyline: {
        positions: ring(building.footprint, building.height + 0.025),
        width: 1.5,
        material: color("#e3e8e6", 0.8)
      }
    });
    const seams = Array.from({
      length: building.numberOfFloors - 1
    }, (_, i) => viewer.entities.add({
      id: `seam:${building.buildingId}:${i + 1}`,
      properties,
      polyline: {
        positions: ring(building.footprint, (i + 1) * building.floorHeight),
        width: 1,
        material: color("#47565d", 0.72)
      }
    }));
    const edges = building.footprint.map(([lng, lat], i) => viewer.entities.add({
      id: `edge:${building.buildingId}:${i}`,
      properties,
      polyline: {
        positions: [Cartesian3.fromDegrees(lng, lat, 0), Cartesian3.fromDegrees(lng, lat, building.height)],
        width: 1,
        material: color("#ccd7d6", 0.7)
      }
    }));
    return {
      building,
      mass,
      foundation,
      roof,
      seams,
      edges
    };
  });
  return {
    // Solid masses stay constant between terrain changes. Only active floor
    // volumes need dynamic geometry during the vertical exploration sequence.
    setGround(ground) {
      entries.forEach(({
        building,
        mass,
        foundation,
        roof,
        seams,
        edges
      }) => {
        const base = baseFor(ground, building.parcelId);
        mass.polygon.height = base;
        mass.polygon.extrudedHeight = base + building.height;
        foundation.polygon.height = ground[building.parcelId]?.min ?? 0;
        foundation.polygon.extrudedHeight = base + 0.05;
        roof.polyline.positions = ring(building.footprint, base + building.height + 0.025);
        seams.forEach((seam, i) => {
          seam.polyline.positions = ring(building.footprint, base + (i + 1) * building.floorHeight);
        });
        edges.forEach((edge, i) => {
          const [lng, lat] = building.footprint[i];
          edge.polyline.positions = [Cartesian3.fromDegrees(lng, lat, base), Cartesian3.fromDegrees(lng, lat, base + building.height)];
        });
      });
    },
    sync(state) {
      entries.forEach(({
        building,
        mass,
        foundation,
        roof,
        seams,
        edges
      }) => {
        const selected = building.buildingId === state.selectedBuilding?.buildingId;
        const floorMode = (selected || !state.selectedBuilding && building.buildingId === 'BUILDING-001') && state.showFloors && state.layerVisibility.floors;
        const show = state.layerVisibility.buildings && !floorMode && isBuildingVisible(state, building.buildingId);
        const schematic = state.layerVisibility.details === false;
        mass.show = show && schematic;
        roof.show = show && (schematic || selected);
        seams.forEach(e => e.show = show && schematic);
        edges.forEach(e => e.show = show && (schematic || selected));
        foundation.show = (show || floorMode) && isBuildingVisible(state, building.buildingId);
        mass.polygon.material = color(selected ? "#96c9c4" : TYPE_COLORS[building.propertyType]);
        roof.polyline.material = color(selected ? SELECTED_COLOR : "#e3e8e6", selected ? 1 : 0.7);
        roof.polyline.width = selected ? 2.5 : 1.3;
        edges.forEach(e => {
          e.polyline.material = color(selected ? SELECTED_COLOR : "#cad5d4", selected ? 1 : 0.7);
          e.polyline.width = selected ? 1.8 : 1;
        });
      });
    }
  };
}
