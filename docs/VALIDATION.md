# Validation and closure record

Initial validation: 2026-10-16. Beginner-interface revision validated: 2026-10-27. Development, builds, independent mathematical checks, and browser automation ran inside Docker on an Apple silicon Mac.

## Completed automated checks

- **354 unit tests passed.** These include 342 deterministic fixtures generated independently with SymPy, covering every matrix shape. Checks include exact multiplication, rank, determinant, inverse, transpose identities, column combinations, and basis reconstruction.
- The OLS test checks all **2,197** allowed response vectors on the half-unit grid: exact orthogonality, reconstruction, and projection idempotence.
- Geometry/state checks cover bounded segment and polygon clipping, oblique span-plane intersections, snapping at negative and positive ties, shape transitions, resets, and axis dragging after arbitrary camera rotations.
- **58 Playwright tests passed** across Chromium, Firefox, and WebKit. Two additional screenshot-only executions are intentionally skipped outside Chromium. Browser checks cover all nine shapes, explicit inverse/transpose views, exact fractions, undefined inverses, invalid inputs, 1D/2D/3D dragging, clipping indicators, overlapping zero vectors, read-only basis coordinates, named-example persistence, reset preserving the active tab, OLS placement and state preservation, keyboard tab navigation, and mobile overflow. A non-symmetric shear regression checks columns, products, and rendered unit-shape edges in all three operator views. Numerical-sum checks verify signed input weights, the displayed columns and result for A, A⁻¹, and Aᵀ, exact inverse fractions, and horizontal scrolling on narrow screens. Further checks cover the stretch/oblique-basis defaults, initially hidden graphics and statistics, exclusive operation selection, span visibility, the read-only coordinate table, optional basis plots, observation labels and data table, and mobile access to the matrix controls.
- Axe WCAG A/AA checks pass for the primary, inverse, transpose, basis, and OLS views in all three browser engines. Automated accessibility checks do not substitute for screen-reader or physical-device review.
- Production TypeScript/Vite build passed. JavaScript dependencies reported **zero known vulnerabilities** with npm audit during the initial 2026-10-16 validation.
- The documented container startup script was exercised, including dependency-volume ownership and installation as the host UID/GID.
- Historical Hugo integration checks used **0.123.3 extended** and an isolated copy of the website. All three browser engines verified the header, navigation, assets, reload, rectangular transpose, and mobile navigation. This integration was never published and was removed when the experiment was closed.

The beginner-interface revision passed all checks in a clean GitHub Actions container: [successful CI run](https://github.com/m-laprise/linear-algebra-lab/actions/runs/40528908021), code commit `58db9b4`.

## Visual review and remaining review

For this revision, agent screenshot inspection covered the simpler starting views, the coordinate comparison, observation labels, and the mobile plot-first layout. Earlier inspection covered 2D and 3D layouts, explicit inverse and transpose views, calculated basis coordinates, the OLS panel, a narrow mobile layout, and the actual Hugo header. It prompted fixes to overlapping 3D drag handles, vector-label association, text contrast, and navigation activation.

The [historical human review checklist](REVIEW_CHECKLIST.md) was **not completed**, including real touch devices, screen readers, zoom, and the instructor's assessment of 3D legibility. The project is closed; no release or website deployment is planned.

## Project closure — 2026-11-02

The owner ended the experiment. The repository now serves only as a record and demonstration of AI-agent-assisted development; it is not a released teaching resource.

- Checked both the local and remote academic-site source (`hugo-academic`, commit `babce1955a8ebe3994574984ca09c117305b6ee7`) and published-site repository (`m-laprise.github.io`, commit `89dbfa2556750d42ac728a7cad599c70f8469ef3`). Neither contained the dashboard or its navigation entry. The public `/linear-algebra/` URL returned HTTP 404. No website changes or deployment were needed.
- Removed the isolated Hugo preview, Hugo templates, and staging/verification scripts. Retained the human review checklist as an explicitly incomplete historical record.
- Removed the existing application container and dependency volume, then ran `sh scripts/dev.sh` from the repository. It recreated the environment and served the standalone dashboard at `http://localhost:5173/linear-algebra/` (HTTP 200).
- Re-ran **354 unit tests**, **58 browser tests** across Chromium/Firefox/WebKit (two screenshot-only skips), and the TypeScript/Vite build; all passed. The closure commit `9215995` also passed [GitHub CI](https://github.com/m-laprise/linear-algebra-lab/actions/runs/41466296077) in a fresh container.
- Removed generated builds, browser output, temporary website copies, screenshots, logs, and TypeScript build metadata. Stopped and removed both preview containers, the application network and dependency volume, and the application/Hugo images. Project build-cache records were identified from their Dockerfile steps and creation times and removed by explicit cache IDs.
- Kept application source, the lockfile, Docker configuration, tests, license, documentation, and session history. The startup script recreates the local preview when needed; no preview service is left running.

## Reproduce

```sh
sh scripts/dev.sh
docker compose exec lab python3 scripts/generate-fixtures.py
docker compose exec lab npm test
docker compose exec lab npm run test:e2e
docker compose exec lab npm run build
```

The preview is standalone at `http://localhost:5173/linear-algebra/`. Stop it with `docker compose down --volumes --remove-orphans`. Historical Hugo staging and verification scripts are no longer included.
