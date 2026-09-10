import { OpenStreetMapImageryProvider, EllipsoidTerrainProvider, createWorldTerrainAsync, createWorldImageryAsync, Ion, sampleTerrainMostDetailed, Cartographic } from "cesium";
export const flatTerrain = () => new EllipsoidTerrainProvider();
function deadline(promise, ms = 12000) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Map service timed out")), ms);
  })]).finally(() => clearTimeout(timer));
}

// All network services are optional. Local geometry remains available on errors.
export async function configureImagery(viewer, {
  token,
  offline,
  onStatus,
  isAlive
}) {
  if (offline) {
    onStatus("Schematic ground · offline");
    return () => {};
  }
  let provider,
    status = "Street map · OpenStreetMap";
  if (token) {
    Ion.defaultAccessToken = token;
    try {
      provider = await deadline(createWorldImageryAsync());
      status = "Satellite imagery · Cesium ion";
    } catch {
      /* Try the public, token-free basemap. */
    }
  }
  if (!provider) provider = new OpenStreetMapImageryProvider({
    url: "https://tile.openstreetmap.org/"
  });
  if (!isAlive()) return () => {};
  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.brightness = 0.95;
  layer.saturation = 0.85;
  layer.contrast = 1.05;
  onStatus(status);
  let failures = 0;
  const remove = provider.errorEvent.addEventListener(() => {
    if (++failures >= 3 && isAlive()) {
      if (viewer.imageryLayers.contains(layer)) viewer.imageryLayers.remove(layer, true);
      onStatus("Schematic ground · imagery unavailable");
      viewer.scene.requestRender();
    }
  });
  return remove;
}
export async function loadTerrain(data) {
  const provider = await deadline(createWorldTerrainAsync({
    requestVertexNormals: true
  }));
  const groups = data.parcels.map(parcel => {
    const property = data.index.getPropertyByParcelId(parcel.parcelId);
    const building = data.index.getBuildingForProperty(property);
    return {
      id: parcel.parcelId,
      points: (building?.footprint ?? parcel.coordinates).map(c => Cartographic.fromDegrees(...c))
    };
  });
  const positions = groups.flatMap(g => g.points);
  await deadline(sampleTerrainMostDetailed(provider, positions, true));
  const ground = {};
  groups.forEach(g => {
    const heights = g.points.map(p => p.height);
    if (!heights.every(Number.isFinite)) throw new Error("Terrain height unavailable");
    // A shallow foundation reaches from the lowest sampled corner to the level slab.
    ground[g.id] = {
      base: Math.max(...heights) + 0.12,
      min: Math.min(...heights) - 0.08
    };
  });
  return {
    provider,
    ground
  };
}
