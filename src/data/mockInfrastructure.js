import { geographicPoint, rectangle } from './demoGeometry.js';
const shared = {
  parcelId: 'PARCEL-001',
  buildingId: 'BUILDING-001',
  ulpin: 'ULPIN-DEMO-0001',
  status: 'Illustrative',
  isDemo: true
};
export const mockInfrastructure = [{
  ...shared,
  assetId: 'DEMO-PARKING-B01',
  name: 'Basement Parking',
  category: 'parking',
  kind: 'volume',
  color: '#38bbff',
  center: geographicPoint(0, 0),
  footprint: rectangle(0, 0, 32, 34),
  baseHeight: -6,
  height: 5.8,
  area: 1088
}, {
  ...shared,
  assetId: 'DEMO-ROOFTOP-001',
  name: 'Rooftop / Solar Rights',
  category: 'rooftop',
  kind: 'rooftop',
  color: '#d17aff',
  center: geographicPoint(0, 0),
  footprint: rectangle(0, 0, 30, 32),
  baseHeight: 36,
  height: 7,
  area: 960
}, {
  ...shared,
  assetId: 'DEMO-FLYOVER-001',
  name: 'Flyover / Air Rights',
  category: 'flyover',
  kind: 'bridge',
  color: '#639dff',
  center: geographicPoint(54, 30),
  footprint: rectangle(54, 30, 12, 205),
  baseHeight: 14,
  height: 2,
  area: 2460
}, {
  ...shared,
  assetId: 'DEMO-ELECTRIC-001',
  name: 'Electric Cable',
  category: 'electric',
  kind: 'pipe',
  color: '#ff982e',
  center: geographicPoint(-25, -58),
  coordinates: [geographicPoint(-69, -58), geographicPoint(69, -58)],
  baseHeight: -2,
  radius: .45
}, {
  ...shared,
  assetId: 'DEMO-FIBER-001',
  name: 'Fiber Optic',
  category: 'fiber',
  kind: 'pipe',
  color: '#cb58ff',
  center: geographicPoint(-2, -64),
  coordinates: [geographicPoint(-69, -64), geographicPoint(69, -64)],
  baseHeight: -4,
  radius: .35
}, {
  ...shared,
  assetId: 'DEMO-WATER-001',
  name: 'Water Pipeline',
  category: 'water',
  kind: 'pipe',
  color: '#29c8ff',
  center: geographicPoint(23, -70),
  coordinates: [geographicPoint(-69, -70), geographicPoint(69, -70)],
  baseHeight: -6,
  radius: .7
}, {
  ...shared,
  assetId: 'DEMO-SEWER-001',
  name: 'Sewer Line',
  category: 'sewer',
  kind: 'pipe',
  color: '#34e2a3',
  center: geographicPoint(45, -76),
  coordinates: [geographicPoint(-69, -76), geographicPoint(69, -76)],
  baseHeight: -8,
  radius: .85
}, {
  ...shared,
  assetId: 'DEMO-METRO-001',
  name: 'Metro Tunnel',
  category: 'metro',
  kind: 'tunnel',
  color: '#f06177',
  center: geographicPoint(0, -80),
  coordinates: [geographicPoint(-68, -80), geographicPoint(68, -80)],
  baseHeight: -12,
  radius: 2.2
}];
