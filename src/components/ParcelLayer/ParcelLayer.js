import { Cartesian2, Cartesian3, DistanceDisplayCondition, LabelStyle, HeightReference } from "cesium";
import { color, hierarchy, ring, SELECTED_COLOR } from "../../utils/visualizationUtils.js";
export function createParcelLayer(viewer, parcels) {
  const entries = parcels.map(parcel => {
    const properties = {
      objectType: "parcel",
      parcelId: parcel.parcelId
    };
    const fill = viewer.entities.add({
      id: `parcel:${parcel.parcelId}`,
      properties,
      polygon: {
        hierarchy: hierarchy(parcel.coordinates),
        material: color("#56ab9c", 0.11),
        heightReference: HeightReference.CLAMP_TO_GROUND
      }
    });
    const boundary = viewer.entities.add({
      id: `boundary:${parcel.parcelId}`,
      properties,
      polyline: {
        positions: ring(parcel.coordinates),
        width: 1.6,
        clampToGround: true,
        material: color("#71a69d", 0.85)
      }
    });
    const [lng, lat] = parcel.coordinates[0];
    const label = viewer.entities.add({
      id: `parcel-label:${parcel.parcelId}`,
      properties,
      position: Cartesian3.fromDegrees(lng + 0.000012, lat + 0.000012),
      label: {
        text: parcel.parcelId,
        font: "11px sans-serif",
        fillColor: color("#d1e1dd"),
        outlineColor: color("#17222a"),
        outlineWidth: 3,
        style: LabelStyle.FILL_AND_OUTLINE,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        pixelOffset: new Cartesian2(22, -9),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 750),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
    return {
      parcel,
      fill,
      boundary,
      label
    };
  });
  return {
    sync(state) {
      entries.forEach(({
        parcel,
        fill,
        boundary,
        label
      }) => {
        const selected = parcel.parcelId === state.selectedParcel?.parcelId;
        fill.show = state.layerVisibility.parcels && !state.hiddenObjects?.[parcel.parcelId] && (!state.isolateSelection || selected);
        fill.polygon.material = color(selected ? '#ffe45e' : "#56ab9c", (selected ? 0.23 : 0.1) * (state.parcelOpacity ?? .7));
        boundary.show = state.layerVisibility.boundaries && !state.hiddenObjects?.[parcel.parcelId] && (!state.isolateSelection || selected);
        boundary.polyline.width = selected ? 3 : 1.5;
        boundary.polyline.material = color(selected ? '#ffe45e' : "#7fac9f", selected ? 1 : 0.8);
        label.show = boundary.show && state.layerVisibility.labels;
        label.label.fillColor = color(selected ? "#aaffeb" : "#c4d6d2");
      });
    }
  };
}
