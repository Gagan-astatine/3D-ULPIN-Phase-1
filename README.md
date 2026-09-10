# 3D ULPIN Generation & Vertical Property Mapping System

## Phase 1 — CesiumJS Visualization · Architecture & Certificates

A standalone **React + Vite + CesiumJS** cadastral digital twin around fictional Bengaluru coordinates. This edition adds twelve distinct architectural properties, locally bundled GLB models and materials, smooth orbit controls, and downloadable property certificates with QR verification. The existing parcel/building/floor/unit hierarchy and interactive controls remain in place.

**DEMO DATA — Not official government land or ULPIN records.** Every cadastral boundary, building, name, ULPIN, unit, certificate and underground asset is fictional. Record consistency checks do not establish legal ownership, registration or survey accuracy. No backend is required.

## Setup

Use Node **22.12+** and a browser with WebGL and hardware acceleration.

```bash
npm install
npm run dev
```

Open Vite's URL, normally `http://localhost:5173`. Use HTTP(S), not a file:// URL. `npm ci` also works with the included lockfile.

```bash
npm test
npm run build
npm run preview
```

`build` produces a static application in `dist/`, including Cesium's workers and all model textures. No Python, database, API server, authentication, official records or government token is needed.

## Rendering and object-selection correction — 10 September 2026

The reported render-loop crash came from `imageBasedLightingFactor` values of `(1.15, 1.2)`. Cesium requires both components to be between 0 and 1. The detailed models now use `(1, 1)`, and a regression test passes every model entity through Cesium's actual lighting setter.

The **Scene objects** tab now follows the selected property, lists every floor and the selected floor's units, and retains the original infrastructure objects. Selecting a row reveals its target, restores hidden parents, and flies to it. Property selection exits a previous cross-section; hiding a floor also hides its units. The active ULPIN label is available for every property, including Tower A.

A stopped renderer now presents **Restart in basic 3D** and **Reload scene** instead of leaving the canvas silently frozen. Basic mode uses selectable Cesium volumes with the same records and controls. This recovery UI has not been exercised in a live browser here.

To use this corrected ZIP, stop the previous development server, extract into a fresh folder, and run the setup commands above. Open the new server URL and reload the page; do not leave the previous copy running on another Vite port.

## What's new

| Property | Category | Floors | Architectural details |
| --- | --- | ---: | --- |
| Tower A · Aaranya | Apartments & retail | 12 | Curtain-wall panels, mullions, selectable rooftop solar |
| Meridian House | Office tower | 8 | Chamfered glazed façade and rooftop equipment |
| Courtyard Arcade | Shopping mall | 3 | L-shaped footprint, canopy and glazed skylight |
| Sampige Heights | Apartments | 6 | Repeated balconies, balustrades and window bands |
| Nandi Mansion | Mansion | 2 | Stone frontage, columns, entrance steps and pitched tiled roof |
| Civic Grand Hotel | Hotel | 9 | Chamfered footprint and repeated balcony bays |
| Learning Centre | Public school | 2 | Brick courtyard wings and tiled roof |
| Ashoka Medical Centre | Hospital | 5 | Window bays, pale cladding and medical façade marks |
| Sampige Temple | Temple | 1 | Stone columns, stepped roof tower and finial |
| Civic Arts Museum | Public museum | 2 | Stone exterior and glazed dome |
| Bengaluru Demo Hall | Civic hall | 3 | Columned façade and hipped roof |
| Community Green Pavilion | Public park & pavilion | 1 | Open timber pavilion, trees, benches, paths and fountain |

There are **12 parcels, 12 property buildings, 54 floors and 199 vertical property units**. The tower retains its original four 240 m² interests per floor and stable `UNIT-001-F08` / `SPACE-001-F08-A` identifiers. All twelve parcels have a structure in this edition; the former vacant parcel records now contain the temple and museum. Built-up area counts full floor plates once. Floor-stack heights exclude decorative roof structures; roof height is separate model metadata.

The architectural assets are authored geometric models with repeatable PBR base-color textures and metallic/roughness material settings. They improve façade and roof detail but do not reproduce the supplied image's photographic city or unseen building details. The park record describes its entire land parcel and its single-floor pavilion.

## Explore and inspect

1. The opening camera settles on Tower A, with Apartment 08A selected. Click **Properties** or use the **12 Properties** tab to visit any structure.
2. Pan, zoom, rotate and tilt using Cesium mouse controls. Rotate Left/Right animate smoothly. **Auto orbit** rotates around the current target and stops on a map pointer-down or wheel event. Reduced-motion preferences suppress camera and explode animations.
3. Use **Floors** to switch between the complete model and individual floor models. Selecting a floor opens its façade to expose the selectable cadastral unit volumes.
4. Select a unit directly or through the unit buttons. **Isolate**, **Show Parent**, **Copy ID** and per-object visibility are preserved.
5. **Explode** animates floors, unit volumes and the roof in geographic alignment, with a 2.2 m additional gap per level. Click again to collapse. Animation speed is adjustable in Layers.
6. **Cross Section** uses the existing clipped cadastral volumes; detailed façades are hidden for this mode. **Underground View** retains the water, sewer, electric, fiber, metro and parking demonstration.
7. Use **Scene objects** for the selected property’s parcel, building, every floor and its active floor’s units, plus the original solar, flyover and infrastructure entries. Background context buildings remain selectable.
8. Search by ULPIN, Parcel ID or Building ID, ignoring case and whitespace. Missing searches show `No property found.`; a match selects and flies to the property.
9. Overview, Parcel, Building, Top, Oblique, Floor focus, Underground, Section and Home remain available. **Fly To** focuses the selected floor when one is active. Map clicks preserve manual camera exploration; property catalog and list actions intentionally fly to the chosen structure.
10. **Models & Textures** switches to/from the simpler original massing. Parcel fill, boundaries, units, roofs, imagery, terrain and labels have independent controls. **Sun Shadows** is optional and starts off for performance.

## Property certificates and QR verification

Every property has **View property certificate & QR** in its details panel, plus a certificate action in the catalog. The dialog provides:

- A readable certificate preview and a vector PDF download with embedded fonts.
- A QR and clickable verification link.
- A downloadable JSON containing the complete record and its SHA-256 fingerprint.
- Six computed consistency checks: relationships, coordinate metadata, floor sequence/heights, areas, unit partitions, and explicit demo designation.

The QR opens `#/verify?ulpin=…&revision=…&digest=…`. That page loads the frontend dataset and recomputes the canonical record fingerprint. It reports **matched**, **mismatch**, **stale revision**, **not found**, or **invalid link**. A downloaded JSON can also be checked locally; it is not uploaded to a server.

**This is demo record consistency verification, not a digital signature or trusted government attestation.** A party who controls the application and dataset can replace both. A future authoritative implementation needs an issuer service, signed records, controlled revisions and revocation; none is simulated as a backend here.

The `certificates/` folder contains all **12 PDFs and their matching JSON records**, initially linked to `http://localhost:5173/`. The issue date is the fixed fictional dataset edition date, 2026-09-09. To regenerate with another application URL:

```bash
npm run certificates -- https://your-application.example/ulpin/
```

A phone cannot reach your computer using `localhost`. For phone scanning, run the application on the same network and enter its reachable LAN URL in the certificate dialog, or set a hosted application URL below. Include any hosting subdirectory. The app must be running and reachable when the QR is scanned. No server rewrite is needed for the hash-based verification route.

## Optional environment settings

Copy `.env.example` to `.env`:

```env
VITE_CESIUM_ION_TOKEN=your_token_here
VITE_OFFLINE_MODE=false
VITE_PUBLIC_APP_URL=
```

Leave the token blank to use public OpenStreetMap street tiles with flat WGS84 ground. A valid Cesium ion token enables configured world imagery/terrain. These services depend on account access and network availability. The active provider is shown in Layers. `VITE_OFFLINE_MODE=true` provides a completely local schematic scene after dependency installation. All GLBs, textures, certificates and verification logic work without a map service.

Terrain sampling grounds primary property footprints; foundations span sampled elevation differences. The broader street and underground context uses the central parcel datum. Cutaway uses a bounded globe-translucency window and does not represent a real terrain excavation. The deterministic offline configuration is useful for presentations.

## Code and asset boundaries

| Location | Purpose |
| --- | --- |
| `src/data/` | Fictional property, parcel, building, floor, unit, context and infrastructure records |
| `src/services/propertyService.js` | Async data boundary; the only renderer-facing source of mock data |
| `src/utils/propertyUtils.js` | Indexed relationships and identifier search |
| `src/utils/sceneController.js` | Picking, synchronized state, labels and animation |
| `src/utils/selectionUtils.js` | Shared object selection, visibility restoration and contextual inspector rows |
| `src/utils/cameraUtils.js` | Central camera targets and eased flights |
| `src/components/ModelLayer/` | GLB entities bound to the same domain IDs and vertical offsets |
| `src/components/FloorLayer/` | Independently selectable floor/unit volumes and cross-sections |
| `src/components/PropertyBrowser/` | Twelve-property architecture catalog |
| `src/components/PropertyCertificate/` | Certificate preview, PDF/JSON downloads and QR generation |
| `src/services/certificateService.js` | Canonical records, fingerprints and consistency verification |
| `src/services/certificatePdf.js` | Locally generated one-page vector PDF with embedded fonts |
| `src/pages/VerificationPage.jsx` | QR and JSON verification results |
| `public/models/` | 48 GLBs: complete building, repeated floor, roof and site per property; 8 textures |
| `scripts/generate-models.mjs` | Reproducible model and texture authoring using Node |
| `scripts/generate-certificates.mjs` | Batch generation of all demo certificates |

Run `npm run models` after changing building dimensions. Each floor asset is reused at its floor's geographic altitude. GLBs use a Y-up metre coordinate system; external texture paths point to `../textures/`, so keep that folder when moving assets. The certificates' complete JSON includes record geometry; regenerate certificates after changes to data. See `THIRD_PARTY_NOTICES.md` for font licensing.

The Viewer is created once per dataset mount, with stable entity IDs and domain metadata for picking. React holds shared state; animation frames mutate lightweight model state outside React. Event listeners, camera-orbit frames and Viewer resources are cleaned up on unmount. Closed dialogs use native focus management. Model detail and shadows can be disabled independently for slower hardware.

## Future integration

Replace `propertyService` methods with FastAPI fetches using the same response shape; rendering components do not need direct data-source imports. GeoJSON can supply parcel polygons, 3D Tiles can supply scalable city context, and surveyed/authored GLBs can replace the included architectural assets through each building's `models` paths. Maintain stable selection metadata and separate floor assets when retaining Explode View.

CRS transformation, real ULPIN calculation, official validation, AI/ML, LiDAR/drone processing, authentication and database services remain outside Phase 1. All mock geographic coordinates are already EPSG:4326.

## Verification

Production build and automated data/geometry/model/certificate checks are documented in `QA.md`. The GLBs are validated with the Khronos glTF validator, and QR images are decoded with an independent reader. Browser/WebGL presentation and live ion assets have not been visually tested in this environment; no exact photographic match is claimed.
