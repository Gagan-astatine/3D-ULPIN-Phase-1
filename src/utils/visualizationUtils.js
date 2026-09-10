import { Cartesian3, Color, PolygonHierarchy, Math as CesiumMath } from "cesium";
export const TYPE_COLORS = {
  Residential: "#aabfbe",
  Commercial: "#bfb39c",
  Office: "#90a8ba",
  "Mixed-use": "#a9acba",
  Institutional: "#a8b4a2"
};
export const SELECTED_COLOR = "#5bd9c5";
export const color = (value, alpha = 1) => Color.fromCssColorString(value).withAlpha(alpha);
export const hierarchy = coordinates => new PolygonHierarchy(Cartesian3.fromDegreesArray(coordinates.flat()));
export const ring = (coordinates, height = 0) => Cartesian3.fromDegreesArrayHeights([...coordinates, coordinates[0]].flatMap(([lng, lat]) => [lng, lat, height]));
export const floorBaseHeight = (floor, building, explodeProgress = 0, gap = 2.2) => (floor.floorNumber - 1) * (building.floorHeight + gap * explodeProgress);
export const ease = value => value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const baseFor = (ground, id) => ground[id]?.base ?? 0;
export const headingRadians = CesiumMath.toRadians(25);
