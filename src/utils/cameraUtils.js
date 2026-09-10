import { BoundingSphere, Cartesian3, HeadingPitchRange, Matrix4, EasingFunction, Math as CesiumMath } from 'cesium';
import { baseFor, floorBaseHeight, reducedMotion } from './visualizationUtils.js';
import { centroid } from './propertyUtils.js';
import { offsetPoint } from './architectureUtils.js';
export function cameraTarget(mode, data, state, ground = {}) {
  const height = baseFor(ground, state.selectedParcel?.parcelId ?? 'PARCEL-001');
  let center = offsetPoint(data.context.center, 5, -10),
    elevation = height + 10,
    range = 155,
    pitch = -26,
    heading = 18;
  if (mode === 'overview') {
    center = offsetPoint(data.context.center, 0, 65);
    range = 550;
    pitch = -50;
  }
  if (mode === 'top' || mode === 'parcel') {
    center = state.selectedBuilding?.center ?? data.context.center;
    range = mode === 'parcel' ? 150 : 460;
    pitch = -90;
    heading = 0;
    elevation = height;
  }
  if (mode === 'property' && state.selectedProperty) {
    center = state.selectedBuilding?.center ?? centroid(state.selectedParcel.coordinates);
    elevation = height + (state.selectedBuilding?.height ?? 0) / 2;
    range = Math.max(130, (state.selectedBuilding?.height ?? 30) * 3.6);
  }
  if (mode === '3d' && state.selectedBuilding) {
    center = state.selectedBuilding.center;
    elevation = height + (state.selectedBuilding.height + (state.selectedBuilding.roofHeight ?? 0)) / 2;
    range = Math.max(110, state.selectedBuilding.height * 3.8);
    pitch = -28;
  }
  if (mode === 'floor' && state.selectedFloor) {
    center = state.selectedBuilding.center;
    elevation = height + floorBaseHeight(state.selectedFloor, state.selectedBuilding, state.explodeView ? 1 : 0) + 1.5;
    range = 90;
    pitch = -15;
  }
  if (mode === 'section') {
    center = offsetPoint(state.selectedBuilding?.center ?? data.context.center, 0, -12);
    elevation = height + 7;
    range = 200;
    pitch = -10;
    heading = 0;
  }
  if (mode === 'underground') {
    center = offsetPoint(data.context.center, 0, -48);
    elevation = height - 7;
    range = 155;
    pitch = -17;
    heading = 12;
  }
  if (state.explodeView && ['3d', 'property', 'section'].includes(mode)) {
    elevation += 10;
    range += 35;
  }
  if (mode === 'asset' && state.selectedAsset) {
    const asset = state.selectedAsset;
    center = asset.center;
    elevation = height + asset.baseHeight + (asset.height ?? 0) / 2;
    range = asset.kind === 'bridge' ? 250 : 100;
    pitch = -22;
  }
  return {
    center,
    elevation,
    range,
    pitch,
    heading
  };
}
export function flyCamera(viewer, mode, data, state, ground = {}, duration = .85) {
  if (!viewer || viewer.isDestroyed()) return;
  const t = cameraTarget(mode, data, state, ground);
  viewer.camera.cancelFlight();
  viewer.camera.lookAtTransform(Matrix4.IDENTITY);
  viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(...t.center, t.elevation), 1), {
    duration: reducedMotion() ? 0 : duration,
    easingFunction: EasingFunction.CUBIC_IN_OUT,
    offset: new HeadingPitchRange(CesiumMath.toRadians(t.heading), CesiumMath.toRadians(t.pitch), t.range)
  });
  viewer.scene.requestRender();
}
export function orbitCamera(viewer, data, state, ground, direction) {
  if (!viewer || viewer.isDestroyed()) return;
  const t = cameraTarget(state.cameraMode, data, state, ground),
    heading = viewer.camera.heading + direction * CesiumMath.toRadians(22.5);
  const target = Cartesian3.fromDegrees(...t.center, t.elevation);
  const distance = Cartesian3.distance(viewer.camera.positionWC, target);
  viewer.camera.cancelFlight();
  viewer.camera.flyToBoundingSphere(new BoundingSphere(target, 1), {
    duration: reducedMotion() ? 0 : .5,
    easingFunction: EasingFunction.CUBIC_IN_OUT,
    offset: new HeadingPitchRange(heading, viewer.camera.pitch, distance)
  });
  viewer.scene.requestRender();
}
export function initializeCamera(viewer, data) {
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(data.context.center[0], data.context.center[1] - .003, 650),
    orientation: {
      heading: 0,
      pitch: CesiumMath.toRadians(-50),
      roll: 0
    }
  });
}
