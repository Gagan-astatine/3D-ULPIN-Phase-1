import { mockFloors } from './mockFloors.js';
import { mockBuildings } from './mockBuildings.js';
import { geographicPoint, plots } from './demoGeometry.js';
const area = p => Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;
function clip(points,axis,sign){
  const out=[];
  points.forEach((a,i)=>{const b=points[(i+1)%points.length],ai=a[axis]*sign>=0,bi=b[axis]*sign>=0;if(ai)out.push(a);if(ai!==bi){const t=-a[axis]/(b[axis]-a[axis]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}});
  return out.filter((p,i)=>i===0||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>1e-6);
}
export const mockUnits=mockFloors.flatMap(floor=>{
  const i=mockBuildings.findIndex(b=>b.buildingId===floor.buildingId),b=mockBuildings[i],[x,y]=plots[i];
  const single=['mansion','temple','park'].includes(b.architecturalStyle);
  return (single?[[1,1,'A']]:[[-1,-1,'A'],[1,-1,'B'],[-1,1,'C'],[1,1,'D']]).flatMap(([sx,sy,letter])=>{
    const p=single?b.localFootprint:clip(clip(b.localFootprint,0,sx),1,sy),size=p.length>=3?area(p):0;
    if(size<.01)return [];
    return [{...floor,unitId:`SPACE-${b.buildingId.slice(-3)}-F${String(floor.floorNumber).padStart(2,'0')}-${letter}`,parentFloorId:floor.unitId,
      name:`${floor.unitType==='Residential'?'Apartment':floor.unitType==='Commercial'?'Commercial Unit':'Property Unit'} ${String(floor.floorNumber).padStart(2,'0')}${letter}`,
      area:size,footprint:p.map(([e,n])=>geographicPoint(x+e,y+n))}];
  });
});
