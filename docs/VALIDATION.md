# Validation record

Initial validation: 2026-10-16. Beginner-interface revision validated: 2026-10-27. Development, builds, independent mathematical checks, and browser automation ran inside Docker on an Apple silicon Mac.

## Completed automated checks

- **354 unit tests passed.** These include 342 deterministic fixtures generated independently with SymPy, covering every matrix shape. Checks include exact multiplication, rank, determinant, inverse, transpose identities, column combinations, and basis reconstruction.
- The OLS test checks all **2,197** allowed response vectors on the half-unit grid: exact orthogonality, reconstruction, and projection idempotence.
- Geometry/state checks cover bounded segment and polygon clipping, oblique span-plane intersections, snapping at negative and positive ties, shape transitions, resets, and axis dragging after arbitrary camera rotations.
- **58 Playwright tests passed** across Chromium, Firefox, and WebKit. Two additional screenshot-only executions are intentionally skipped outside Chromium. Browser checks cover all nine shapes, explicit inverse/transpose views, exact fractions, undefined inverses, invalid inputs, 1D/2D/3D dragging, clipping indicators, overlapping zero vectors, read-only basis coordinates, named-example persistence, reset preserving the active tab, OLS placement and state preservation, keyboard tab navigation, and mobile overflow. A non-symmetric shear regression checks columns, products, and rendered unit-shape edges in all three operator views. Numerical-sum checks verify signed input weights, the displayed columns and result for A, A⁻¹, and Aᵀ, exact inverse fractions, and horizontal scrolling on narrow screens. Further checks cover the stretch/oblique-basis defaults, initially hidden graphics and statistics, exclusive operation selection, span visibility, the read-only coordinate table, optional basis plots, observation labels and data table, and mobile access to the matrix controls.
- Axe WCAG A/AA checks pass for the primary, inverse, transpose, basis, and OLS views in all three browser engines. Automated accessibility checks do not substitute for screen-reader or physical-device review.
- Production TypeScript/Vite build passed. JavaScript dependencies reported **zero known vulnerabilities** with npm audit during the initial 2026-10-16 validation.
- The documented container startup script was exercised, including dependency-volume ownership and installation as the host UID/GID.
- Hugo **0.123.3 extended**, matching the academic site's configured version, builds successfully using an isolated copy of the website. The application is served at `/linear-algebra/` with the existing navigation/header. All three browser engines verified the single active Teaching material item, preserved Teaching item, asset requests, reload, rectangular transpose, and mobile navigation.

The preceding calculation-panel revision passed all checks in a clean GitHub Actions container: [successful CI run](https://github.com/m-laprise/linear-algebra-lab/actions/runs/40513497119), code commit `3eadb04`.

## Visual review and remaining review

For this revision, agent screenshot inspection covered the simpler starting views, the coordinate comparison, observation labels, and the mobile plot-first layout. Earlier inspection covered 2D and 3D layouts, explicit inverse and transpose views, calculated basis coordinates, the OLS panel, a narrow mobile layout, and the actual Hugo header. It prompted fixes to overlapping 3D drag handles, vector-label association, text contrast, and navigation activation.

The [human release checklist](HUMAN_RELEASE_CHECKLIST.md) remains **pending**, including real touch devices, screen readers, zoom, and the instructor's assessment of 3D legibility. The academic website has not been pushed or deployed. Production smoke checks must follow an approved deployment.

## Reproduce

```sh
sh scripts/dev.sh
docker compose exec lab python3 scripts/generate-fixtures.py
docker compose exec lab npm test
docker compose exec lab npm run test:e2e
docker compose exec lab npm run build
```

For an already staged and served Hugo copy, run `docker compose exec lab node scripts/check-hugo.mjs`. The default preview URL is `http://host.docker.internal:5180/linear-algebra/`; override it using `LAB_HUGO_URL` inside the container.
