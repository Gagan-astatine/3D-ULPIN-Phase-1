# Architecture & certificates edition — QA

The production application builds successfully. The automated suite contains **24 passing checks**, using real Cesium geometry, entity and property implementations without a browser/WebGL context.

## Reported crash and object controls

The screenshot's exact failure is corrected: all architectural model entities use image-based lighting `(1, 1)` within Cesium's enforced range. The regression invokes the real `ImageBasedLighting` setter, the validation that the previous entity-only tests missed.

Additional checks cover the object panel for every property, all floor and unit row transitions, matching camera targets, hidden-parent restoration, hiding child units with a floor, and resolution of actual GLB/unit Entity metadata. Invalid and empty picks return no selection. Existing architectural assets, floor intervals, explode offsets, searches and certificate checks still pass.

A supervised preview started successfully on 10 September 2026, but the connected browser rejected access with `net::ERR_BLOCKED_BY_CLIENT`. Consequently no live WebGL screenshot or click test was completed. This is a browser-access limitation, not evidence of a successful or failed render of this build. The runtime-error recovery controls are implemented but remain browser-unverified.

## Coverage retained and extended

- Twelve parcels/buildings, 54 complete floor records, 199 unit records and five main use types.
- All ULPIN, parcel and building IDs resolve with case/whitespace tolerance.
- Rectangular, L-shaped and chamfered footprints triangulate and fit their parcels.
- Original parcel highlight, floor reveal, unit selection, explosion reversal, layer toggles and stable entity identity.
- The tower retains its 48 original apartment/commercial subunits and parent relationships.
- All 48 GLBs pass the Khronos glTF validator, with local texture paths resolved.
- Cesium's actual axis-conversion matrices align the authored model coordinates with floor-plate coordinates.
- For every new property: complete model/floor switching, selected-floor opening, ground datum, exploded offsets, cross-sections and unit isolation remain consistent.
- Property and section camera targets follow all twelve selected buildings.
- Existing pipe/metro mesh bounds, utility visibility, roof offsets and bounded ground cutaway behavior.
- All twelve certificate records pass six computed consistency checks.
- All twelve generated QR PNGs independently decode to their exact verification URLs.
- Verification rejects changed certificate contents, incorrect digests, stale revisions, missing records, malformed links and duplicate query parameters.
- The PDF writer generates an A4 document with vector QR modules, embedded fonts and a clickable verification link.

## PDF artifact checks

All twelve bundled PDF certificates were rendered with Poppler. The longest property title and focal-tower certificate were visually inspected for layout and typography. All twelve QR codes were independently decoded from the **rendered PDFs**, and their URLs resolved to matching demo records. Each PDF has one A4 page. The bundled URLs point to localhost; phone scanning needs a reachable LAN or hosted application URL.

## Browser presentation checks still outstanding

Browser/WebGL interaction, frame rate, visual screenshot comparison, live ion imagery and live terrain have not been tested in this environment. Model-file validation and numeric geometry tests do not establish final WebGL appearance.

- [ ] Launch the app with and without a Cesium token; try offline mode.
- [ ] Visit all twelve properties in the catalog and by clicking their model.
- [ ] Inspect façade materials, rooflines, terrain grounding and parcel alignment.
- [ ] Switch complete models → floors → unit selection → isolate → cross-section.
- [ ] Explode/collapse the selected property at each animation speed.
- [ ] Exercise automatic orbit and verify pointer/wheel input stops it immediately.
- [ ] Verify parcel, building, floor and unit click metadata and empty-space clearing.
- [ ] Exercise all search identifiers, missing-result message, camera modes and Home.
- [ ] Toggle every layer, including Models & Textures and optional Sun Shadows.
- [ ] Exercise original rooftop, parking, flyover, utilities, metro and context selections.
- [ ] Open each certificate, download PDF/JSON and verify in a new tab.
- [ ] Enter the presentation computer's reachable URL and scan a QR from a phone.
- [ ] Confirm dialog focus/escape behavior, reduced motion and narrow-screen layout.

The architecture is fictional and parametrically authored. It is not a photogrammetric reconstruction of the supplied reference. Cross-section mode intentionally uses cadastral volumes rather than clipping architectural GLBs. City insets are schematic; the broad context and utilities use a shared terrain datum. QR verification demonstrates record consistency only and is not a trusted digital signature or government attestation.
