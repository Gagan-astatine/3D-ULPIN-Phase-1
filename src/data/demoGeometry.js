// Fictional survey geometry. These metre offsets define the mock dataset only;
// the service exposes ready-to-render EPSG:4326 coordinates, not a CRS pipeline.
export const DEMO_CENTER = [77.5946, 12.9718];
export const geographicPoint = (east, north) => [DEMO_CENTER[0] + east / 108480, DEMO_CENTER[1] + north / 110610];
export const rectangle = (x, y, w, d) => [[x - w / 2, y - d / 2], [x + w / 2, y - d / 2], [x + w / 2, y + d / 2], [x - w / 2, y + d / 2]].map(([e, n]) => geographicPoint(e, n));
export const plots = [[0, 0], [-82, 38], [-115, -16], [88, 52], [-80, 112], [85, 120], [-18, 126], [100, -85], [-105, -112], [0, -110], [-155, 45], [160, 40]];
export const numberId = n => String(n).padStart(3, "0");
