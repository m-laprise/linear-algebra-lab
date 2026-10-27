# Implementation notes

The browser is the entire application; there is no backend or data collection in the dashboard. The Hugo site retains its existing site-wide behavior.

## Mathematics

All editable coordinates and matrix entries belong to `{−3, −2.5, …, 2.5, 3}`. Pointer movement rounds ties away from zero and clamps to these bounds. Typed values outside this set are rejected. An invalid draft is marked and the last valid mathematical value remains in force.

Reduced BigInt fractions represent all mathematical values. Gaussian elimination computes rank and inverses exactly. The determinant is defined only for square matrices. All nine matrix shapes are available. Derived matrices, coefficients, and results are never snapped to the input grid. Conversion to floating point happens only at the drawing boundary.

The Matrices tab displays one operator at a time: A, A⁻¹, or Aᵀ. Its matrix readout, rank, determinant, columns, output vector, span, and transformed unit shape all use that same operator. The source A stays separately labeled and editable. Derived columns are read-only. Each operation retains its own editable input: x, y, or u. The inverse check shows A(A⁻¹y) = y; singular and rectangular matrices show an explanation without an inverse plot. Selecting transpose immediately shows the row-to-column correspondence, with selectable matching entries. Changing shape resets the matrix to a rectangular diagonal of ones, the inputs, and the operation.

“Calculating the output vector” displays a single numerical sum: each input coordinate times its corresponding column, followed by the output vector. Column colors match the output plot. Negative coefficients are parenthesized, and calculated fractions stay exact. The equation uses the currently displayed operator, including inverse and transpose. Long equations scroll within the panel on narrow screens.

The Coordinates and bases tab uses `v = Bc`, with v held fixed as B changes. A read-only table compares the usual coordinates with the chosen basis coordinates; a numerical sum reconstructs v. A dependent B is explicitly not a basis; unique coordinates are not shown. The optional coordinate plot uses axes c₁, c₂, c₃ and retains exact fractions outside the editable half-unit grid. Edit B or v to change these coefficients. The basis grid is optional and unavailable for dependent reference arrows.

OLS uses fixed X with rows `(1,−1), (1,0), (1,1)`. Fitted values, coefficients, and residuals use exact fractions. The residual arrow represents the displacement from the fitted vector to the response; its displayed coordinates are the residual itself. Plot axes are labeled Observation 1, 2, and 3. Outcomes are edited in a three-row data table; intercept and slope are named. Design-matrix, normal-equation, and orthogonality formulas appear under Matrix calculation.

## Initial view and optional representations

The initial matrix doubles the first coordinate: A = diag(2, 1), x = (1, 1), Ax = (2, 1). The initial basis is oblique: B = [[1, 1], [0, 1]], v = (2, 1), c = (1, 1). Input vectors reset to ones after dimension changes.

The initial matrix view shows one editable matrix and the input/output plots, with input controls and read-only output coordinates next to the plots. Columns and their numerical calculation share one toggle. Unit shapes start hidden. Rank and determinant are in an expandable section; full-span shading is separately enabled there and disappears when the section closes. The span describes unrestricted real-number combinations, not just values reachable with the bounded controls.

Matrix-size settings and the exclusive A / inverse / transpose selector are expandable. Inverse identity checks are also expandable. Display options reset when switching tabs; the matrices, vectors, and selected operation persist. Reset all hides optional representations and restores default values/cameras while staying on the current tab. The original matrix is not duplicated in the ordinary view; derived operators remain clearly identified.

On small screens, plots and their input fields precede the matrix/reference-arrow controls. A visible jump link reaches those controls. The input and output plots use the same fixed scale. Three-dimensional grids are sparser, and camera rotation never changes mathematical values.

## Rendering and interaction

All mathematical axes are bounded by ±6. SVG draws the 1D and 2D views. Three.js supplies the orthographic camera and projections for the 3D SVG view. Rendering into SVG avoids requiring WebGL and keeps endpoints and labels in the accessible DOM. This is an orthographic schematic: transparent surfaces and edges remain visible, rather than using opaque surface occlusion.

Clipping occurs in mathematical coordinates before projection. A vector leaving the box has a continuation marker and its actual coordinates in the legend. Span lines and planes intersect the bounded box; a rank-three span fills the box lightly. The gold edges/faces show the image of the unit interval, square, or cube, including singular collapse.

3D handle dragging projects pointer displacement onto the selected axis; the camera is fixed during a drag. Handle targets are separated in screen space. A nearly edge-on axis is omitted until the camera rotates; numeric inputs remain available. Vector selection buttons resolve overlapping endpoints, including zero columns. Numeric fields offer an equivalent keyboard path; focused endpoints use arrow keys and Page Up/Down for the third coordinate.

## Structure

- `src/math/`: exact algebra and bounded geometry.
- `src/state.ts`, `src/presets.ts`: state transitions, limits, and named examples.
- `src/components/`: editors, equations, and shared coordinate views.
- `src/App.tsx`: navigation, introductions, optional OLS toggle, and the caption.
- `src/components/DashboardViews.tsx`: matrix, basis, and regression views and their contextual explanations.
- `tests/`: independent SymPy fixtures, algebra/state/geometry tests, browser tests.
- `integration/hugo/`: Hugo content and layout using the site's existing base template.
- `scripts/stage-hugo.mjs`: copy a production build into a Hugo checkout or isolated copy.

The application CSS is scoped beneath `.lab` / `#linear-algebra-root`. It uses local bundled fonts for equations. No CDN is required at runtime. Reset restores initial values, hidden optional views, and default cameras while preserving the active Matrices or Bases tab. Named-example menus reflect the current matrix, switching to Custom when it no longer matches an example. The OLS toggle sits below the main dashboard, immediately above the example. State is intentionally ephemeral and is not stored or sent anywhere.
