import { CallbackPositionProperty, Cartesian2, Cartesian3, HeadingPitchRoll, Transforms, ShadowMode, ColorBlendMode } from 'cesium';
import { baseFor, floorBaseHeight, color } from '../../utils/visualizationUtils.js';
import { isBuildingVisible } from '../../utils/architectureUtils.js';

// Models are visual assets only; every pick resolves through domain metadata.
// The roof and each floor follow exactly the same vertical offsets as entities.
export function createModelLayer(viewer, data, model) {
  const root = import.meta.env?.BASE_URL ?? '/';
  const entries = data.buildings.map(building => {
    const meta = { objectType:'building', buildingId:building.buildingId, parcelId:building.parcelId, ulpin:building.ulpin };
    const point = height => Cartesian3.fromDegrees(...building.center,baseFor(model.ground,building.parcelId)+height);
    // Cesium also converts glTF's Z-forward convention to X-forward. A 90°
    // heading cancels that horizontal turn for our east / up / -north assets.
    const orientation = Transforms.headingPitchRollQuaternion(point(0),new HeadingPitchRoll(Math.PI / 2,0,0));
    const add = (key,uri,position,properties=meta) => viewer.entities.add({
      id:`model:${building.buildingId}:${key}`, properties, position, orientation,
      model:{uri:root+uri,scale:1,minimumPixelSize:0,runAnimations:false,
        // Cesium validates both diffuse and specular factors in [0, 1] during rendering.
        imageBasedLightingFactor:new Cartesian2(1,1),shadows:ShadowMode.ENABLED,
        silhouetteColor:color('#a1e8f1'),silhouetteSize:0,
        colorBlendMode:ColorBlendMode.MIX,colorBlendAmount:.13}
    });
    const mass=add('building',building.models.building,point(0));
    const site=add('site',building.models.site,point(0));
    const roof=add('roof',building.models.roof,new CallbackPositionProperty(()=>point(building.height+(building.numberOfFloors-1)*2.2*model.explode),false));
    const floors=data.index.getFloorsForBuilding(building.buildingId).map(floor=>({floor,entity:add(floor.unitId,building.models.floor,new CallbackPositionProperty(()=>point(floorBaseHeight(floor,building,model.explode)),false),{objectType:'floor',...floor})}));
    return {building,mass,site,roof,floors,point};
  });
  return {
    setGround(){entries.forEach(e=>{e.mass.position=e.point(0);e.site.position=e.point(0);});},
    sync(state){
      entries.forEach(({building,mass,site,roof,floors})=>{
        const active=building.buildingId===(state.selectedBuilding?.buildingId??'BUILDING-001');
        const selected=building.buildingId===state.selectedBuilding?.buildingId;
        const allowed=state.layerVisibility.details!==false&&isBuildingVisible(state,building.buildingId);
        const floorMode=active&&state.showFloors&&state.layerVisibility.floors;
        mass.show=allowed&&state.layerVisibility.buildings&&!floorMode;
        mass.model.silhouetteSize=selected?1.5:0;
        mass.model.color=color(selected?'#c4f2f0':'#ffffff');
        site.show=allowed&&state.layerVisibility.buildings&&state.layerVisibility.vegetation!==false&&!state.isolateSelection;
        roof.show=allowed&&floorMode&&!state.crossSection&&state.layerVisibility.rooftop!==false&&!(state.isolateSelection&&state.selectedFloor);
        floors.forEach(({floor,entity})=>{
          // Opening the active floor exposes its selectable cadastral units.
          entity.show=allowed&&floorMode&&!state.crossSection&&!state.hiddenObjects?.[floor.unitId]&&state.selectedFloor?.unitId!==floor.unitId&&(!state.isolateSelection||!state.selectedFloor||state.selectedFloor.unitId===floor.unitId);
        });
      });
    }
  };
}
