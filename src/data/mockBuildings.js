import { plots, geographicPoint, numberId } from './demoGeometry.js';

// Fictional architecture: the detailed models and cadastral volumes use the
// same floor plates, preserving the property hierarchy in either display mode.
const specs = [
  ['Tower A · Aaranya', 'Mixed-use', 'Apartments & retail', 'curtain-wall', 12, 30, 32, 'rect', 7],
  ['Meridian House', 'Office', 'Office tower', 'office', 8, 24, 28, 'chamfer', 2],
  ['Courtyard Arcade', 'Commercial', 'Shopping mall', 'mall', 3, 30, 28, 'L', 3],
  ['Sampige Heights', 'Residential', 'Apartments', 'apartments', 6, 22, 30, 'rect', 2],
  ['Nandi Mansion', 'Residential', 'Mansion', 'mansion', 2, 26, 27, 'rect', 5],
  ['Civic Grand Hotel', 'Commercial', 'Hotel', 'hotel', 9, 22, 26, 'chamfer', 3],
  ['Learning Centre', 'Institutional', 'Public school', 'school', 2, 30, 32, 'L', 2],
  ['Ashoka Medical Centre', 'Institutional', 'Hospital', 'hospital', 5, 24, 28, 'rect', 2],
  ['Sampige Temple', 'Institutional', 'Temple', 'temple', 1, 24, 24, 'rect', 12],
  ['Civic Arts Museum', 'Institutional', 'Public museum', 'museum', 2, 28, 26, 'rect', 6],
  ['Bengaluru Demo Hall', 'Institutional', 'Civic hall', 'civic', 3, 28, 28, 'rect', 4],
  ['Community Green Pavilion', 'Institutional', 'Public park & pavilion', 'park', 1, 16, 14, 'rect', 4]
];
export const mockBuildings = specs.map(([name, propertyType, category, architecturalStyle, numberOfFloors, w, d, shape, roofHeight], i) => {
  const [x,y] = plots[i];
  const localFootprint = shape === 'L'
    ? [[-w/2,-d/2],[w/2,-d/2],[w/2,0],[0,0],[0,d/2],[-w/2,d/2]]
    : shape === 'chamfer'
      ? [[-w/2+4,-d/2],[w/2-4,-d/2],[w/2,-d/2+4],[w/2,d/2-4],[w/2-4,d/2],[-w/2+4,d/2],[-w/2,d/2-4],[-w/2,-d/2+4]]
      : [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
  const buildingId = `BUILDING-${numberId(i+1)}`;
  return {
    name, buildingId, parcelId: `PARCEL-${numberId(i+1)}`,
    ulpin: `ULPIN-DEMO-${String(i+1).padStart(4,'0')}`,
    footprint: localFootprint.map(([e,n]) => geographicPoint(x+e,y+n)), localFootprint,
    footprintArea: shape === 'L' ? w*d*.75 : shape === 'chamfer' ? w*d-32 : w*d,
    center: geographicPoint(x,y), height: numberOfFloors*3, numberOfFloors,
    floorHeight: 3, propertyType, category, architecturalStyle, width:w, depth:d, roofHeight,
    models: { building:`models/${buildingId}/building.glb`, floor:`models/${buildingId}/floor.glb`, roof:`models/${buildingId}/roof.glb`, site:`models/${buildingId}/site.glb` }
  };
});
