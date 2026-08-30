This directory contains vendored browser assets that must be served in static deployments.

Current files:
- `ppmpredictor.esm.js` copied from `node_modules/@willwade/ppmpredictor/dist/ppmpredictor.esm.js`
- `ppmpredictor.esm.js.map` copied from `node_modules/@willwade/ppmpredictor/dist/ppmpredictor.esm.js.map`

Current pinned package:
- `@willwade/ppmpredictor@0.0.13`

Update flow:
1. Run `npm ci` in repo root.
2. Copy the latest dist file into this directory.
3. Commit both the vendored file and this README update (if version/source changes).
