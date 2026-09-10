import { mockBuildings } from "./mockBuildings.js";
export const mockFloors = mockBuildings.flatMap(b => Array.from({
  length: b.numberOfFloors
}, (_, i) => ({
  unitId: `UNIT-${b.buildingId.slice(-3)}-F${String(i + 1).padStart(2, "0")}`,
  buildingId: b.buildingId,
  parcelId: b.parcelId,
  ulpin: b.ulpin,
  floorNumber: i + 1,
  unitType: b.propertyType === "Mixed-use" ? i < 4 ? "Commercial" : "Residential" : b.propertyType,
  area: b.footprintArea,
  displayColor: b.buildingId === "BUILDING-001" ? i < 2 ? "#27cbe5" : i < 4 ? "#35df85" : i < 8 ? "#ffab40" : i < 11 ? "#b55bef" : "#41d9ff" : null
})));
