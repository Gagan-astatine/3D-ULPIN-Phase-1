export const normalizeIdentifier = value => String(value ?? "").replace(/\s+/g, "").toUpperCase();
export function createPropertyIndex({
  properties,
  parcels,
  buildings,
  floors,
  infrastructure = [],
  units = [],
  context = {}
}) {
  const byULPIN = new Map(properties.map(p => [normalizeIdentifier(p.ulpin), p]));
  const byParcel = new Map(properties.map(p => [normalizeIdentifier(p.parcelId), p]));
  const byBuilding = new Map(properties.filter(p => p.buildingId).map(p => [normalizeIdentifier(p.buildingId), p]));
  const parcelMap = new Map(parcels.map(p => [p.parcelId, p]));
  const buildingMap = new Map(buildings.map(b => [b.buildingId, b]));
  const floorMap = new Map(floors.map(f => [f.unitId, f]));
  const unitMap = new Map(units.map(u => [u.unitId, u]));
  const assets = new Map([...infrastructure, ...(context.blocks ?? [])].map(a => [a.assetId, a]));
  const floorsByBuilding = new Map(buildings.map(b => [b.buildingId, floors.filter(f => f.buildingId === b.buildingId)]));
  return {
    getPropertyByULPIN: id => byULPIN.get(normalizeIdentifier(id)),
    getPropertyByParcelId: id => byParcel.get(normalizeIdentifier(id)),
    getPropertyByBuildingId: id => byBuilding.get(normalizeIdentifier(id)),
    getBuildingForProperty: p => buildingMap.get(p?.buildingId),
    getParcelForProperty: p => parcelMap.get(p?.parcelId),
    getParcelForBuilding: b => parcelMap.get(b?.parcelId),
    getFloorsForBuilding: id => floorsByBuilding.get(id) ?? [],
    getFloor: id => floorMap.get(id),
    getUnit: id => unitMap.get(id),
    getUnitsForFloor: id => units.filter(unit => unit.parentFloorId === id),
    getAsset: id => assets.get(id),
    searchProperty: query => {
      const q = normalizeIdentifier(query);
      return byULPIN.get(q) ?? byParcel.get(q) ?? byBuilding.get(q) ?? null;
    }
  };
}
export const centroid = coordinates => coordinates.reduce((a, c) => [a[0] + c[0] / coordinates.length, a[1] + c[1] / coordinates.length], [0, 0]);
export const formatArea = value => `${new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0
}).format(value)} m²`;
