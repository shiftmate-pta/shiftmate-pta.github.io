# LIVE PDF release — 17 October 2026

Luke accepted Leave and Swap appearance on iPhone, including SENIOR TRANSIT OFFICER from Current level, and approved LIVE release. Source: TEST cca1af1a130c82b0f04f3c31bd8cc8b1cfd3b748. LIVE base: e072375dcf00e28d4c3cc8ae00884d3fa205aa47.

Release 3.1.13 PDF FORMS transfers only Leave/Swap generation, shared renderer/field maps, blank Leave PDF, bundled pdf-lib and offline assets. LIVE identity, manifest, storage keys, saved cycles, calculations, roster projections, UI and unrelated features are preserved. Position maps TO1–TO5/FCO to TRANSIT OFFICER, STO1–STO3 to SENIOR TRANSIT OFFICER; trainee remains TRAINEE, unset stays blank.

Verified: JS syntax, PDF regression (13 leave rows, A4/official dimensions, long names/overflow and offline asset coverage), pay calculator, annual-leave MOU and 1033 cross-line/137 same-line mileage checks. Automated comparison confirms app.js outside the two PDF generators/obsolete JPEG writer/version is unchanged, and manifest/storage/calculation/data modules are byte-identical to LIVE base. Shared renderer/template/map are identical to the user-accepted TEST assets.

Physical iPhone form appearance was accepted on TEST. Save/share/print and offline behaviour on physical iPhone have not been independently verified by this agent. Existing homescreen installation uses the same URL, manifest and service worker scope; an online reload is needed to load the release, not reinstalling or clearing saved data.
