# Human release checklist

Status: **awaiting human review**. Automated tests and agent screenshot inspection do not complete this checklist. Use the actual Hugo preview at `/linear-algebra/`.

- [ ] Try all nine shapes (1, 2, and 3 rows × 1, 2, and 3 columns). Check the space labels, arrow coordinates, matrix columns, and equations agree.
- [ ] Compare identity, reflection, quarter-turn, shear, coordinate projection, zero, and dependent-column examples. Check orientation and the gold unit shape, including collapse to a line or point.
- [ ] Verify rank visually. Check determinant is unavailable for rectangular matrices, rather than displayed as zero.
- [ ] Edit using both dragging and numeric fields. Check negative halves, rounding ties, limits ±3, invalid entries, Enter, Escape, and arrow keys. Invalid drafts must never change the mathematics.
- [ ] Select and move each overlapping column of a zero matrix. Confirm a zero vector remains reachable by keyboard and numeric controls.
- [ ] Rotate each 3D view, then move each x/y/z handle. Check only the intended coordinate changes and the camera stays fixed during the drag. Rotate again if an axis is nearly edge-on.
- [ ] Inspect 3D depth, grid, span plane, unit cube, vector labels, and overlapping objects from several angles. Confirm that no label or hidden endpoint suggests a false coordinate.
- [ ] Set a 3×3 matrix and vector entirely to 3. Confirm the output remains (27, 27, 27), with a continuation marker at the bounded view; no snapping or truncation of calculated values.
- [ ] Select Shear, A = [[1, 1], [0, 1]]. With input (1, 1), compare A, A⁻¹, and Aᵀ: the outputs must be (2, 1), (0, 1), and (1, 2). Check each readout, column vector, and gold unit shape agrees with the selected operator. Source A stays unchanged; derived columns are read-only.
- [ ] In “Calculating the output vector,” verify that the numerical weights match the input and each colored column matches the output plot. For Shear and x = (2, 1), check 2(1, 0) + 1(1, 1) = (3, 1). Try negative and half-unit inputs, inverse fractions, and rectangular matrices. On a narrow screen, check that a long equation can be scrolled from its beginning to its result.
- [ ] Show transpose for a 2×3 matrix. Expand Entry correspondence and trace original entries to the swapped positions. Check reversed space dimensions, three output rows, two columns, and undefined determinant. Hiding it restores the original input; showing it again restores u.
- [ ] Show inverse for diag(3, 3). Check inverse columns (1/3, 0) and (0, 1/3), determinant 1/9, and output (1/3, 1/6) for y = (1, 1/2). Edit y and confirm A(A⁻¹y) recovers it. Try singular and rectangular matrices; check distinct explanations and absence of inverse plots.
- [ ] In Bases, choose the oblique basis and edit it while holding v fixed. Check reconstruction, fractional coefficients, and the dependent-set message. The right panel must be clearly read-only, with coefficient axes c₁, c₂, c₃. B = diag(3, 3), v = (2, 1) must yield (2/3, 1/3), without snapping.
- [ ] Named-example menus retain the selected name when editing an input vector, and show Custom after an unmatched matrix edit. Check both tabs.
- [ ] OLS begins hidden; its toggle sits immediately below the main dashboard and above the example. Check ŷ lies in the column plane and the residual runs from ŷ to y, perpendicular to the plane. Opening/closing it must preserve the main dashboard.
- [ ] Reset all preserves the active Matrices or Bases tab while restoring initial 2D values, hidden inverse/transpose/OLS, and default cameras. Try resetting from both tabs.
- [ ] Read each tab's introductory paragraph and the operation labels. Confirm that source A, the displayed operator, and calculated basis coordinates are unambiguous.
- [ ] Test keyboard navigation (including tab arrow keys), focus visibility, a screen reader, and touch dragging on an actual mobile device. Values and labels must remain understandable without color.
- [ ] Test desktop and mobile layouts in Chrome, Firefox, and Safari. Inspect equations and controls for clipping at narrow widths and browser zoom 200%.
- [ ] On the Hugo preview, verify the existing navigation, active Teaching material tab, mobile menu, source link, and exact explanatory caption.
- [ ] After approved deployment, load and reload the public `/linear-algebra/` URL; confirm no missing assets or console errors.

Reviewer: __________________  Date: __________________

Website publication requires the owner's approval after review.
