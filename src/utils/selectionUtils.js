// UI and Cesium picking share one domain transition. No mock imports or viewer calls.
export function resolvePickedObject(picked, time) {
  const first = picked[0]?.id;
  if (first?.id?.startsWith('callout')) return first.properties?.getValue(time) ?? null;
  const metadata = picked.map(hit => hit.id?.properties?.getValue(time)).filter(Boolean);
  const front = metadata[0];
  return (front?.objectType === 'floor'
    ? metadata.find(item => item.objectType === 'unit' && item.parentFloorId === front.unitId)
    : null) ?? front ?? null;
}

export function propertySelection(data, property, state) {
  return {
    ...state,
    selectedProperty: property,
    selectedParcel: data.index.getParcelForProperty(property),
    selectedBuilding: data.index.getBuildingForProperty(property) ?? null,
    selectedFloor: null, selectedUnit: null, selectedAsset: null,
    selectedObjectType: 'building',
    autoRotate: false, showFloors: true, explodeView: false,
    crossSection: false, isolateSelection: false,
    hiddenObjects: {...state.hiddenObjects, [property.parcelId]: false, [property.buildingId]: false},
    layerVisibility: {...state.layerVisibility, parcels: true, boundaries: true, buildings: true, floors: true}
  };
}

export function objectSelection(data, state, metadata, fly = false) {
  const {objectType} = metadata ?? {};
  let next;
  if (objectType === 'floor' || objectType === 'unit') {
    const unit = objectType === 'unit' ? data.index.getUnit(metadata.unitId) : null;
    const floor = data.index.getFloor(unit?.parentFloorId ?? metadata.unitId);
    if (!floor || objectType === 'unit' && !unit) return null;
    const property = data.index.getPropertyByBuildingId(floor.buildingId);
    if (!property) return null;
    next = state.selectedBuilding?.buildingId === floor.buildingId
      ? {...state} : propertySelection(data, property, state);
    next = {
      ...next, selectedFloor: floor, selectedUnit: unit, selectedAsset: null,
      selectedObjectType: objectType, showFloors: true, autoRotate: false,
      // A list action must reveal its target, even after hide/isolate/section.
      crossSection: fly ? false : next.crossSection,
      layerVisibility: {...next.layerVisibility, buildings: true, floors: true, ...(unit ? {units: true} : {})},
      hiddenObjects: {...next.hiddenObjects, [floor.parcelId]: false, [floor.buildingId]: false, [floor.unitId]: false, ...(unit ? {[unit.unitId]: false} : {})}
    };
    if (fly) next.cameraMode = 'floor';
  } else if (objectType === 'asset') {
    const asset = data.index.getAsset(metadata.assetId);
    if (!asset) return null;
    const property = data.index.getPropertyByParcelId(asset.parcelId);
    next = property ? propertySelection(data, property, state) : {
      ...state, selectedProperty: null, selectedBuilding: null, selectedParcel: null,
      selectedFloor: null, selectedUnit: null, explodeView: false, crossSection: false
    };
    next = {
      ...next, selectedAsset: asset, selectedFloor: null, selectedUnit: null,
      selectedObjectType: 'asset', autoRotate: false, isolateSelection: false,
      hiddenObjects: {...next.hiddenObjects, [asset.assetId]: false},
      layerVisibility: {...next.layerVisibility, [asset.category]: true},
      cutaway: asset.baseHeight < 0 ? true : next.cutaway
    };
    if (fly) next.cameraMode = asset.baseHeight < 0 ? 'underground' : 'asset';
  } else if (objectType === 'building' || objectType === 'parcel') {
    const property = data.index.getPropertyByULPIN(metadata.ulpin)
      ?? data.index.getPropertyByBuildingId(metadata.buildingId)
      ?? data.index.getPropertyByParcelId(metadata.parcelId);
    if (!property) return null;
    next = {...propertySelection(data, property, state), selectedObjectType: objectType};
    if (fly) next.cameraMode = objectType === 'parcel' ? 'parcel' : 'property';
  } else return null;
  return next;
}

export function inspectorObjects(data, state) {
  const building = state.selectedBuilding ?? data.index.getBuildingForProperty(state.selectedProperty) ?? data.buildings[0];
  const objects = [
    {key: building.parcelId, label: 'Land Parcel', detail: building.parcelId, meta: {objectType: 'parcel', parcelId: building.parcelId}},
    {key: building.buildingId, label: building.name, detail: building.buildingId, meta: {objectType: 'building', buildingId: building.buildingId}}
  ];
  for (const floor of data.index.getFloorsForBuilding(building.buildingId)) {
    objects.push({key: floor.unitId, label: `Floor ${floor.floorNumber} · ${floor.unitType}`, detail: floor.unitId, floor, meta: {objectType: 'floor', unitId: floor.unitId}});
    if (floor.unitId === state.selectedFloor?.unitId) {
      for (const unit of data.index.getUnitsForFloor(floor.unitId)) objects.push({key: unit.unitId, label: unit.name, detail: unit.unitId, floor: unit, meta: {objectType: 'unit', unitId: unit.unitId}});
    }
  }
  // Retain the original shared tower and underground demonstration assets.
  for (const asset of data.infrastructure) objects.push({key: asset.assetId, label: asset.name, detail: asset.assetId, asset, meta: {objectType: 'asset', assetId: asset.assetId}});
  return objects;
}
