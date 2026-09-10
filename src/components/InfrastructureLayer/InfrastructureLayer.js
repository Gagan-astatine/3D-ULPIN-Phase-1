import { Cartesian3, CallbackProperty, HeadingPitchRoll, Transforms, JulianDate } from 'cesium';
import { color, hierarchy, ring, baseFor } from '../../utils/visualizationUtils.js';
import { circleShape, panelRectangle, offsetPoint, isAssetVisible } from '../../utils/architectureUtils.js';
export function createInfrastructureLayer(viewer, data, model) {
  const entries = [...data.infrastructure, ...data.context.blocks].map(asset => {
    const props = {
      objectType: 'asset',
      assetId: asset.assetId,
      parcelId: asset.parcelId,
      buildingId: asset.buildingId,
      ulpin: asset.ulpin
    };
    const parts = [];
    const base = () => baseFor(model.ground, asset.parcelId ?? 'PARCEL-001');
    const roofOffset = () => asset.category === 'rooftop' && model.state?.selectedBuilding?.buildingId === asset.buildingId ? 11 * 2.2 * model.explode : 0;
    const altitude = relative => new CallbackProperty(() => base() + relative + roofOffset(), false);
    const add = (name, geometry) => {
      const entity = viewer.entities.add({
        id: `asset:${asset.assetId}:${name}`,
        properties: props,
        ...geometry
      });
      parts.push(entity);
      return entity;
    };
    if (asset.footprint) {
      add('volume', {
        polygon: {
          hierarchy: hierarchy(asset.footprint),
          height: altitude(asset.baseHeight),
          extrudedHeight: altitude(asset.baseHeight + (asset.kind === 'rooftop' ? .25 : asset.height)),
          material: color(asset.color, asset.category === 'parking' ? .45 : asset.kind === 'rooftop' ? .32 : 1)
        }
      });
      add('outline', {
        polyline: {
          positions: new CallbackProperty(() => ring(asset.footprint, base() + asset.baseHeight + (asset.kind === 'rooftop' ? .3 : asset.height) + roofOffset()), false),
          width: 1.3,
          material: color(asset.color)
        }
      });
    }
    if (asset.kind === 'pipe' || asset.kind === 'tunnel') {
      add('conduit', {
        polylineVolume: {
          positions: new CallbackProperty(() => Cartesian3.fromDegreesArrayHeights(asset.coordinates.flatMap(p => [...p, base() + asset.baseHeight - asset.radius])), false),
          shape: circleShape(asset.radius),
          material: color(asset.color, asset.kind === 'tunnel' ? .25 : 1)
        }
      });
      if (asset.kind === 'tunnel') for (let i = 0; i < 7; i++) {
        const center = offsetPoint(data.context.center, -55 + i * 17, -80);
        const position = () => Cartesian3.fromDegrees(...center, base() + asset.baseHeight);
        add(`car:${i}`, {
          position: new CallbackProperty(position, false),
          orientation: new CallbackProperty(() => Transforms.headingPitchRollQuaternion(position(), new HeadingPitchRoll()), false),
          box: {
            dimensions: new Cartesian3(15, 3, 3),
            material: color('#be4151')
          }
        });
        add(`car-window:${i}`, {
          polygon: {
            hierarchy: hierarchy(panelRectangle(center, 12, 2.5)),
            height: altitude(asset.baseHeight + 1.52),
            material: color('#b9d8e5')
          }
        });
      }
    }
    if (asset.kind === 'rooftop') {
      add('parapet', {
        wall: {
          positions: new CallbackProperty(() => ring(asset.footprint, base()), false),
          minimumHeights: new CallbackProperty(() => Array(5).fill(base() + 36 + roofOffset()), false),
          maximumHeights: new CallbackProperty(() => Array(5).fill(base() + 37 + roofOffset()), false),
          material: color('#b4c2d4', .65)
        }
      });
      const house = offsetPoint(asset.center, -5, 5);
      add('plant-room', {
        polygon: {
          hierarchy: hierarchy(panelRectangle(house, 9, 9)),
          height: altitude(36.25),
          extrudedHeight: altitude(39.5),
          material: color('#d3d7d8')
        }
      });
      for (let i = 0; i < 6; i++) {
        const point = offsetPoint(asset.center, -8 + i % 3 * 7, -9 + Math.floor(i / 3) * 5);
        add(`solar:${i}`, {
          polygon: {
            hierarchy: hierarchy(panelRectangle(point, 5.6, 3.8)),
            height: altitude(37.1),
            extrudedHeight: altitude(37.25),
            material: color('#263e68')
          }
        });
        add(`solar-grid:${i}`, {
          polyline: {
            positions: new CallbackProperty(() => ring(panelRectangle(point, 5.6, 3.8), base() + 37.28 + roofOffset()), false),
            width: 1,
            material: color('#75bcdb')
          }
        });
      }
      add('antenna', {
        position: new CallbackProperty(() => Cartesian3.fromDegrees(...house, base() + 41 + roofOffset()), false),
        cylinder: {
          length: 4,
          topRadius: .08,
          bottomRadius: .15,
          material: color('#cfdae1')
        }
      });
    }
    if (asset.kind === 'bridge') {
      const [sw, se, ne, nw] = asset.footprint;
      [[sw, nw], [se, ne]].forEach((points, i) => add(`barrier:${i}`, {
        wall: {
          positions: Cartesian3.fromDegreesArray(points.flat()),
          minimumHeights: new CallbackProperty(() => [base() + 16, base() + 16], false),
          maximumHeights: new CallbackProperty(() => [base() + 17, base() + 17], false),
          material: color('#afb7c0')
        }
      }));
      for (let i = 0; i < 7; i++) {
        const point = offsetPoint(asset.center, 0, -88 + i * 29);
        add(`pier:${i}`, {
          position: new CallbackProperty(() => Cartesian3.fromDegrees(...point, base() + 7), false),
          cylinder: {
            length: 14,
            topRadius: 1.35,
            bottomRadius: 1.55,
            material: color('#8f9fa8')
          }
        });
      }
      for (let i = 0; i < 8; i++) {
        const point = offsetPoint(asset.center, i % 2 ? 2.8 : -2.8, -76 + i * 21),
          position = () => Cartesian3.fromDegrees(...point, base() + 17);
        add(`vehicle:${i}`, {
          position: new CallbackProperty(position, false),
          orientation: new CallbackProperty(() => Transforms.headingPitchRollQuaternion(position(), new HeadingPitchRoll()), false),
          box: {
            dimensions: new Cartesian3(1.8, 4.4, 1.5),
            material: color(['#ebeeee', '#456880', '#c4af91'][i % 3])
          }
        });
      }
      add('lane', {
        polyline: {
          positions: new CallbackProperty(() => Cartesian3.fromDegreesArrayHeights([offsetPoint(asset.center, 0, -100), offsetPoint(asset.center, 0, 100)].flatMap(p => [...p, base() + 16.05])), false),
          width: 1,
          material: color('#e4e3c5')
        }
      });
    }
    if (asset.category === 'contextBuildings') {
      add('window-bands', {
        polyline: {
          positions: new CallbackProperty(() => {
            const points = [];
            for (let f = 1; f < asset.height / 3; f++) points.push(...ring(asset.footprint, base() + f * 3));
            return points;
          }, false),
          width: 1.3,
          material: color('#415765', .8)
        }
      });
    }
    // Cache immutable infrastructure in constant Cesium properties. Only rooftop
    // geometry follows the per-frame exploded floor offset.
    const bindings = [];
    if (asset.category !== 'rooftop') for (const part of parts) {
      for (const key of ['position', 'orientation']) if (part[key] instanceof CallbackProperty) bindings.push({
        target: part,
        key,
        source: part[key]
      });
      for (const kind of ['polygon', 'polyline', 'polylineVolume', 'wall']) if (part[kind]) for (const key of ['height', 'extrudedHeight', 'positions', 'minimumHeights', 'maximumHeights']) if (part[kind][key] instanceof CallbackProperty) bindings.push({
        target: part[kind],
        key,
        source: part[kind][key]
      });
    }
    const refresh = () => bindings.forEach(binding => {
      binding.target[binding.key] = binding.source.getValue(JulianDate.now());
    });
    refresh();
    return {
      asset,
      parts,
      refresh
    };
  });
  return {
    setGround() {
      entries.forEach(entry => entry.refresh());
    },
    sync(state) {
      entries.forEach(({
        asset,
        parts
      }) => {
        const visible = isAssetVisible(state, asset);
        parts.forEach(part => part.show = visible);
        const selected = state.selectedAsset?.assetId === asset.assetId;
        const edge = parts.find(p => p.id.endsWith(':outline'));
        if (edge) {
          edge.polyline.width = selected ? 3 : 1.3;
          edge.polyline.material = color(selected ? '#fff29c' : asset.color);
        }
        const conduit = parts.find(p => p.id.endsWith(':conduit'));
        if (conduit) conduit.polylineVolume.material = color(selected ? '#fff29c' : asset.color, asset.kind === 'tunnel' ? .3 : 1);
      });
    }
  };
}
