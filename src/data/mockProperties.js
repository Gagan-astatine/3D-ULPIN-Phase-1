import { mockParcels } from "./mockParcels.js";
import { mockBuildings } from "./mockBuildings.js";
export const mockProperties = mockParcels.map((parcel, i) => {
  const building = mockBuildings.find(b => b.buildingId === parcel.buildingId);
  return {
    ulpin: `ULPIN-DEMO-${String(i + 1).padStart(4, "0")}`,
    parcelId: parcel.parcelId,
    buildingId: parcel.buildingId,
    name: building?.name ?? (i === 8 ? "Community Green" : "Civic Reserve"),
    address: `${21 + i}, Demo ${i < 4 ? "Sampige" : "Civic"} Road, Bengaluru, Karnataka`,
    propertyType: building?.propertyType ?? "Institutional",
    category: building?.category,
    architecturalStyle: building?.architecturalStyle,
    tenure: i >= 6 ? 'Public / community · fictional' : 'Private · fictional',
    recordVersion: '2026.09-demo.2',
    landArea: parcel.area,
    builtUpArea: building ? building.footprintArea * building.numberOfFloors : 0,
    buildingHeight: building?.height ?? 0,
    numberOfFloors: building?.numberOfFloors ?? 0,
    crs: "EPSG:4326",
    status: "Validated",
    isDemo: true
  };
});
