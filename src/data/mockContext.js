import { DEMO_CENTER, geographicPoint, rectangle } from './demoGeometry.js';
const blocks = [];
for (let row = 0; row < 5; row++) for (let column = 0; column < 10; column++) {
  const x = -230 + column * 48,
    y = 185 + row * 48;
  const w = 18 + column % 3 * 5,
    d = 20 + row % 3 * 4,
    h = 9 + (row * 7 + column * 3) % 8 * 3;
  blocks.push({
    assetId: `DEMO-CONTEXT-${row}-${column}`,
    name: `Context Building ${row * 10 + column + 1}`,
    category: 'contextBuildings',
    kind: 'volume',
    center: geographicPoint(x, y),
    footprint: rectangle(x, y, w, d),
    baseHeight: 0,
    height: h,
    color: ['#b1bac0', '#94a3ad', '#a9b6b0'][column % 3],
    isDemo: true,
    status: 'Context only',
    area: w * d
  });
}
export const mockContext = {
  center: DEMO_CENTER,
  name: 'Bengaluru · Architectural demo zone',
  extent: rectangle(0, 170, 640, 630),
  cutaway: rectangle(0, -68, 144, 34),
  cutawayBounds: [...geographicPoint(-72, -85), ...geographicPoint(72, -51)],
  undergroundBounds: [...geographicPoint(-72, -85), ...geographicPoint(72, 34)],
  plaza: rectangle(0, 0, 74, 68),
  roads: [{
    name: 'Main Road · demo',
    width: 12,
    coordinates: [geographicPoint(-260, -43), geographicPoint(250, -43)]
  }, {
    name: 'Civic Avenue · demo',
    width: 12,
    coordinates: [geographicPoint(-260, 80), geographicPoint(250, 80)]
  }, {
    name: 'East Avenue · demo',
    width: 12,
    coordinates: [geographicPoint(53, -130), geographicPoint(53, 420)]
  }, {
    name: 'West Avenue · demo',
    width: 10,
    coordinates: [geographicPoint(-53, -130), geographicPoint(-53, 420)]
  }, {
    name: 'Outer Ring · demo',
    width: 14,
    coordinates: [geographicPoint(-260, 160), geographicPoint(250, 160)]
  }],
  trees: Array.from({
    length: 24
  }, (_, i) => ({
    center: geographicPoint(i < 12 ? -36 + i * 6 : i % 2 === 0 ? -38 : 38, i < 12 ? -34 : -26 + Math.floor((i - 12) / 2) * 11),
    height: 4.4 + i % 3 * .5
  })),
  blocks
};
