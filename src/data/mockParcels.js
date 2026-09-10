import { plots, rectangle, numberId } from "./demoGeometry.js";
export const mockParcels = plots.map(([x, y], i) => ({
  parcelId: `PARCEL-${numberId(i + 1)}`,
  coordinates: rectangle(x, y, i === 0 ? 68 : 40, i === 0 ? 62 : 45),
  area: i === 0 ? 4216 : 1800,
  buildingId: `BUILDING-${numberId(i + 1)}`,
  crs: "EPSG:4326"
}));
