# Implementation notes

The browser is the entire application; there is no backend or data collection in the dashboard. The Hugo site retains its existing site-wide behavior.

## Mathematics

All editable coordinates and matrix entries belong to `{−3, −2.5, …, 2.5, 3}`. Pointer movement rounds ties away from zero and clamps to these bounds. Typed values outside this set are rejected. An invalid draft is marked and the last valid mathematical value remains in force.

Reduced BigInt fractions represent all mathematical values. Gaussian elimination computes rank and inverses exactly. The determinant is defined only for square matrices. All nine matrix shapes are available. Derived matrices, coefficients, and results are never snapped to the input grid. Conversion to floating point happens only at the drawing boundary.

The inverse panel shows the inverse matrix and the round trip, overlaying the recovered vector on the input. The transpose panel shows the swapped entries, spaces, and an independent probe. The editable original matrix is retained. Changing shape resets the matrix to a rectangular diagonal of ones, the probes, and the operation.

The Bases tab uses `v = Bc`, with v held fixed as B changes. A dependent B is explicitly not a basis; unique coordinates are not shown. Coordinate-space arrows represent coefficients, not standard geometric coordinates.

OLS uses fixed X with rows `(1,−1), (1,0), (1,1)`. Fitted values, coefficients, and residuals use exact fractions. The residual arrow represents the displacement from the fitted vector to the response; its displayed coordinates are the residual itself.

## Rendering and interaction

All mathematical axes are bounded by ±6. SVG draws the 1D and 2D views. Three.js supplies the orthographic camera and projections for the 3D SVG view. Rendering into SVG avoids requiring WebGL and keeps endpoints and labels in the accessible DOM. This is an orthographic schematic: transparent surfaces and edges remain visible, rather than using opaque surface occlusion.

Clipping occurs in mathematical coordinates before projection. A vector leaving the box has a continuation marker and its actual coordinates in the legend. Span lines and planes intersect the bounded box; a rank-three span fills the box lightly. The gold edges/faces show the image of the unit interval, square, or cube, including singular collapse.

3D handle dragging projects pointer displacement onto the selected axis; the camera is fixed during a drag. Handle targets are separated in screen space. A nearly edge-on axis is omitted until the camera rotates; numeric inputs remain available. Vector selection buttons resolve overlapping endpoints, including zero columns. Numeric fields offer an equivalent keyboard path; focused endpoints use arrow keys and Page Up/Down for the third coordinate.

## Structure

- `src/math/`: exact algebra and bounded geometry.
- `src/state.ts`, `src/presets.ts`: state transitions, limits, and named examples.
- `src/components/`: editors, equations, and shared coordinate views.
- `src/App.tsx`: Matrices, Bases, optional OLS, and the caption.
- `tests/`: independent SymPy fixtures, algebra/state/geometry tests, browser tests.
- `integration/hugo/`: Hugo content and layout using the site's existing base template.
- `scripts/stage-hugo.mjs`: copy a production build into a Hugo checkout or isolated copy.

The application CSS is scoped beneath `.lab` / `#linear-algebra-root`. It uses local bundled fonts for equations. No CDN is required at runtime. Reset does not reload the page. State is intentionally ephemeral and is not stored or sent anywhere.
