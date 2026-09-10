import { Cartesian2, Cartesian3, PolygonHierarchy } from 'cesium';
export function clipNorthHalf(points, latitude) {
  const output = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      aInside = a[1] >= latitude,
      bInside = b[1] >= latitude;
    if (aInside) output.push(a);
    if (aInside !== bInside) {
      const t = (latitude - a[1]) / (b[1] - a[1]);
      output.push([a[0] + t * (b[0] - a[0]), latitude]);
    }
  }
  return output;
}
export const polygonFor = (building, section = false) => new PolygonHierarchy(Cartesian3.fromDegreesArray((section ? clipNorthHalf(building.footprint, building.center[1]) : building.footprint).flat()));
export const circleShape = radius => Array.from({
  length: 20
}, (_, i) => new Cartesian2(Math.cos(i * Math.PI / 10) * radius, Math.sin(i * Math.PI / 10) * radius));
export const offsetPoint = (center, east, north) => [center[0] + east / 108480, center[1] + north / 110610];
export const panelRectangle = (center, w, d) => [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, y]) => offsetPoint(center, x, y));
export const floorTint = floor => floor.displayColor ?? {
  Residential: '#8fbeda',
  Commercial: '#52c79f',
  Office: '#89acdb',
  'Mixed-use': '#b994da',
  Institutional: '#a7c7ac'
}[floor.unitType] ?? '#80c1da';
export const isAssetVisible = (state, asset) => state.layerVisibility[asset.category] !== false && state.hiddenObjects?.[asset.assetId] !== true && (!state.isolateSelection || state.selectedAsset?.assetId === asset.assetId);
export const isBuildingVisible = (state, id) => !state.hiddenObjects?.[id] && (!state.isolateSelection || !state.selectedAsset && state.selectedBuilding?.buildingId === id);
