import { GeoJsonDataSource, Color, ColorMaterialProperty } from "cesium";
import { DEMO_CENTER } from "../../data/demoGeometry.js";
import { createPropertyIndex } from "../../utils/propertyUtils.js";

export function createAIBuildingLayer(viewer, data) {
  let dataSource = null;
  let isLoaded = false;
  let loadingPromise = null;

  async function loadData() {
    if (isLoaded || loadingPromise) return loadingPromise;
    
    loadingPromise = (async () => {
      try {
        const response = await fetch('/src/data/demo_footprints_wgs84.geojson');
        const geojson = await response.json();
        
        const firstCoord = geojson.features[0].geometry.coordinates[0][0];
        
        const deltaLng = DEMO_CENTER[0] - firstCoord[0];
        const deltaLat = DEMO_CENTER[1] - firstCoord[1];
        
        // Translate all coordinates
        geojson.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates.forEach(ring => {
              for (let i = 0; i < ring.length; i++) {
                ring[i][0] += deltaLng;
                ring[i][1] += deltaLat;
              }
            });
          }
        });
        
        dataSource = await GeoJsonDataSource.load(geojson, {
          clampToGround: false
        });
        
        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          entity.polygon.extrudedHeight = 15;
          entity.polygon.height = 0;
          entity.polygon.material = new ColorMaterialProperty(Color.fromCssColorString('#d941c4').withAlpha(0.85));
          entity.polygon.outline = true;
          entity.polygon.outlineColor = Color.fromCssColorString('#ffffff');
          
          const ulpin = `ULPIN-AI-000${i + 1}`;
          const buildingId = `AI-BUILDING-00${i + 1}`;
          const parcelId = 'PARCEL-001';
          
          if (!entity.properties) entity.properties = {};
          
          entity.properties.addProperty('objectType', 'building');
          entity.properties.addProperty('buildingId', buildingId);
          entity.properties.addProperty('parcelId', parcelId);
          entity.properties.addProperty('ulpin', ulpin);
        }
        
        viewer.dataSources.add(dataSource);
        isLoaded = true;
      } catch (err) {
        console.error("Failed to load AI Building Layer:", err);
      }
    })();
    return loadingPromise;
  }

  return {
    setGround(ground) {
    },
    sync(state) {
      const show = state.layerVisibility.aiBuildings === true;
      if (show && !isLoaded) {
        loadData();
      } else if (dataSource) {
        dataSource.show = show;
      }
    },
    destroy() {
      if (dataSource) {
        viewer.dataSources.remove(dataSource, true);
      }
    }
  };
}
