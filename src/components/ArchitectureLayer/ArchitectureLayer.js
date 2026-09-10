import { Cartesian3, PolygonHierarchy, CallbackProperty, Rectangle } from 'cesium';
import { color, hierarchy, baseFor } from '../../utils/visualizationUtils.js';
import { panelRectangle, offsetPoint } from '../../utils/architectureUtils.js';
export function createArchitectureLayer(viewer, data, model) {
  let schematic = true;
  const ground = () => baseFor(model.ground, 'PARCEL-001');
  const context = data.context;
  const surface = viewer.entities.add({
    id: 'architecture:ground',
    polygon: {
      hierarchy: hierarchy(context.extent),
      height: 0,
      material: color('#637966')
    }
  });
  const plaza = viewer.entities.add({
    id: 'architecture:plaza',
    polygon: {
      hierarchy: hierarchy(context.plaza),
      height: .02,
      material: color('#9daaa2')
    }
  });
  const roads = context.roads.map((road, i) => viewer.entities.add({
    id: `architecture:road:${i}`,
    corridor: {
      positions: Cartesian3.fromDegreesArray(road.coordinates.flat()),
      width: road.width,
      height: .10,
      material: color('#495358')
    }
  }));
  const roadLines = context.roads.map((road, i) => viewer.entities.add({
    id: `architecture:road-line:${i}`,
    polyline: {
      positions: Cartesian3.fromDegreesArrayHeights(road.coordinates.flatMap(p => [...p, .14])),
      width: 1,
      material: color('#eee6c1', .7)
    }
  }));
  const trees = context.trees.flatMap((tree, i) => [viewer.entities.add({
    id: `architecture:tree:${i}`,
    position: Cartesian3.fromDegrees(...tree.center, tree.height),
    ellipsoid: {
      radii: new Cartesian3(2.3, 2.3, 2.4),
      material: color(i % 2 ? '#54794c' : '#719154')
    }
  }), viewer.entities.add({
    id: `architecture:trunk:${i}`,
    position: Cartesian3.fromDegrees(...tree.center, 1.5),
    cylinder: {
      length: 3,
      topRadius: .18,
      bottomRadius: .24,
      material: color('#736346')
    }
  })]);
  const [sw, se, ne, nw] = context.cutaway;
  const pit = [];
  [['#685044', 0, -2], ['#4d413b', -2, -6], ['#3a3735', -6, -10], ['#2b3035', -10, -16]].forEach(([shade, top, bottom], i) => {
    pit.push(viewer.entities.add({
      id: `architecture:soil:${i}`,
      wall: {
        positions: Cartesian3.fromDegreesArray([sw, nw, ne, se].flat()),
        minimumHeights: [bottom, bottom, bottom, bottom],
        maximumHeights: [top, top, top, top],
        material: color(shade)
      }
    }));
  });
  const bed = viewer.entities.add({
    id: 'architecture:excavation-bed',
    polygon: {
      hierarchy: hierarchy(context.cutaway),
      height: -16,
      material: color('#232d35')
    }
  });
  const furniture = [];
  // Solid neighborhood buildings get actual roof housings and façade ribbons.
  data.buildings.slice(1).forEach(building => {
    const props = {
      objectType: 'building',
      buildingId: building.buildingId,
      parcelId: building.parcelId,
      ulpin: building.ulpin
    };
    const roof = viewer.entities.add({
      id: `architecture:roofhouse:${building.buildingId}`,
      properties: props,
      polygon: {
        hierarchy: hierarchy(panelRectangle(building.center, 7, 7)),
        height: building.height,
        extrudedHeight: building.height + 2,
        material: color('#c4c9c6')
      }
    });
    const parts = [roof];
    building.footprint.forEach((a, i) => {
      const b = building.footprint[(i + 1) % building.footprint.length];
      for (let f = 0; f < building.numberOfFloors; f++) parts.push(viewer.entities.add({
        id: `architecture:windows:${building.buildingId}:${i}:${f}`,
        properties: props,
        wall: {
          positions: Cartesian3.fromDegreesArray([[a[0] + (b[0] - a[0]) * .08, a[1] + (b[1] - a[1]) * .08], [a[0] + (b[0] - a[0]) * .92, a[1] + (b[1] - a[1]) * .92]].flat()),
          minimumHeights: [f * 3 + 1, f * 3 + 1],
          maximumHeights: [f * 3 + 2.15, f * 3 + 2.15],
          material: color('#4a788c', .85)
        }
      }));
    });
    furniture.push({
      building,
      parts
    });
  });
  function sync(state) {
    const underground = state.cameraMode === 'underground',
      cut = state.cutaway || underground;
    const bounds = underground ? context.undergroundBounds : context.cutawayBounds;
    const hole = underground ? [[bounds[0], bounds[1]], [bounds[2], bounds[1]], [bounds[2], bounds[3]], [bounds[0], bounds[3]]] : context.cutaway;
    surface.polygon.hierarchy = new PolygonHierarchy(Cartesian3.fromDegreesArray(context.extent.flat()), cut ? [hierarchy(hole)] : []);
    surface.show = schematic && state.layerVisibility.contextBuildings !== false && !state.isolateSelection;
    plaza.show = !underground && !state.isolateSelection;
    roads.forEach(e => e.show = !state.isolateSelection && !underground);
    roadLines.forEach(e => e.show = !state.isolateSelection && !underground);
    trees.forEach(e => e.show = state.layerVisibility.vegetation !== false && !state.isolateSelection && !underground);
    pit.forEach(e => e.show = cut && !state.isolateSelection);
    bed.show = cut && !state.isolateSelection;
    furniture.forEach(({
      building,
      parts
    }) => parts.forEach(e => e.show = state.layerVisibility.details === false && state.layerVisibility.buildings && !state.hiddenObjects?.[building.buildingId] && (!state.isolateSelection || state.selectedBuilding?.buildingId === building.buildingId) && !(state.showFloors && state.selectedBuilding?.buildingId === building.buildingId)));
    if (viewer.scene.globe) {
      viewer.scene.globe.translucency.enabled = cut;
      viewer.scene.globe.translucency.rectangle = Rectangle.fromDegrees(...bounds);
      viewer.scene.globe.translucency.frontFaceAlpha = 0;
      viewer.scene.globe.translucency.backFaceAlpha = 0;
    }
  }
  return {
    sync,
    setSchematic(show) {
      schematic = show;
    },
    setGround(next) {
      const base = baseFor(next, 'PARCEL-001');
      surface.polygon.height = base;
      plaza.polygon.height = base + .02;
      roads.forEach(e => e.corridor.height = base + .10);
      roadLines.forEach((e, i) => e.polyline.positions = Cartesian3.fromDegreesArrayHeights(context.roads[i].coordinates.flatMap(p => [...p, base + .14])));
      trees.forEach((e, i) => {
        const t = context.trees[Math.floor(i / 2)];
        e.position = Cartesian3.fromDegrees(...t.center, base + (i % 2 === 0 ? t.height : 1.5));
      });
      pit.forEach((e, i) => {
        const tops = [0, -2, -6, -10],
          bottoms = [-2, -6, -10, -16];
        e.wall.minimumHeights = Array(4).fill(base + bottoms[i]);
        e.wall.maximumHeights = Array(4).fill(base + tops[i]);
      });
      bed.polygon.height = base - 16;
      furniture.forEach(({
        building,
        parts
      }) => {
        const b = baseFor(next, building.parcelId);
        parts[0].polygon.height = b + building.height;
        parts[0].polygon.extrudedHeight = b + building.height + 2;
        parts.slice(1).forEach((p, i) => {
          const f = i % building.numberOfFloors;
          p.wall.minimumHeights = [b + f * 3 + 1, b + f * 3 + 1];
          p.wall.maximumHeights = [b + f * 3 + 2.15, b + f * 3 + 2.15];
        });
      });
    }
  };
}
