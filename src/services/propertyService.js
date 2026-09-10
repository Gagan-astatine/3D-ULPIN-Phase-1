import { mockProperties } from "../data/mockProperties.js";
import { mockParcels } from "../data/mockParcels.js";
import { mockBuildings } from "../data/mockBuildings.js";
import { mockFloors } from "../data/mockFloors.js";
import { mockContext } from "../data/mockContext.js";
import { mockInfrastructure } from "../data/mockInfrastructure.js";
import { mockUnits } from '../data/mockUnits.js';
import { createPropertyIndex } from "../utils/propertyUtils.js";

// This is the only frontend boundary that knows the source is mock data.
// Replace these methods with fetch calls; renderers continue to receive domain objects.
export const getProperties = async () => structuredClone(mockProperties);
export const getParcels = async () => structuredClone(mockParcels);
export const getBuildings = async () => structuredClone(mockBuildings);
export const getFloors = async () => structuredClone(mockFloors);
export const getInfrastructure = async () => structuredClone(mockInfrastructure);
export const getUnits = async () => structuredClone(mockUnits);
export async function getCadastralDataset() {
  const [properties, parcels, buildings, floors] = await Promise.all([getProperties(), getParcels(), getBuildings(), getFloors()]);
  const data = {
    properties,
    parcels,
    buildings,
    floors,
    context: structuredClone(mockContext),
    infrastructure: await getInfrastructure(),
    units: await getUnits()
  };
  
  // Inject AI Detected Buildings so they are always searchable
  const DEMO_CENTER = [77.5946, 12.9718];
  for (let i = 0; i < 3; i++) {
    const ulpin = `ULPIN-AI-000${i + 1}`;
    const buildingId = `AI-BUILDING-00${i + 1}`;
    const parcelId = 'PARCEL-001';
    
    data.properties.push({
      ulpin,
      parcelId,
      buildingId,
      name: `AI Detected Building ${i + 1}`,
      address: 'Demo AI Detection Zone, Bengaluru',
      propertyType: 'Commercial',
      category: 'aiBuildings',
      architecturalStyle: 'AI Generated',
      tenure: 'AI Fictional',
      recordVersion: '2026.AI',
      landArea: 0,
      builtUpArea: 1500,
      buildingHeight: 15,
      numberOfFloors: 5,
      crs: 'EPSG:4326',
      status: 'AI Detected',
      isDemo: true
    });
    
    data.buildings.push({
      name: `AI Detected Building ${i + 1}`,
      buildingId,
      parcelId,
      ulpin,
      footprintArea: 300,
      center: DEMO_CENTER,
      height: 15,
      numberOfFloors: 5,
      floorHeight: 3,
      propertyType: 'Commercial',
      category: 'aiBuildings',
      architecturalStyle: 'AI Generated',
      footprint: [DEMO_CENTER, DEMO_CENTER, DEMO_CENTER] // Dummy footprint to prevent crashes
    });
  }

  return {
    ...data,
    index: createPropertyIndex(data)
  };
}
