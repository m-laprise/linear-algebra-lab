import { expect, it } from "vitest";
import {
  axisDragDelta,
  clipPolygon,
  clipSegment,
  cube,
  projector,
  spanGeometry,
} from "../../src/math/geometry";
import { fromNumbers } from "../../src/math/algebra";
import { initialState, parseInput, reducer, snap } from "../../src/state";
it("snaps symmetrically, clamps endpoints, rejects invalid typed coordinates", () => {
  expect([-0.75, -0.25, 0.25, 0.75].map(snap)).toEqual([-1, -0.5, 0.5, 1]);
  expect([-99, 99].map(snap)).toEqual([-3, 3]);
  expect(Object.is(snap(-0.01), -0)).toBe(false);
  for (const text of [
    "",
    " ",
    "NaN",
    "Infinity",
    "0.3",
    "1/2",
    "4",
    "-3.5",
    "1e1",
  ])
    expect(parseInput(text)).toBeNull();
  for (const text of ["-3", "3", "-.5", "+2.5", " 0 "])
    expect(parseInput(text)).toBe(Number(text));
});
it("shape transitions preserve unrelated state and reset all dependent dimensions", () => {
  const s = {
    ...initialState(),
    showOLS: true,
    operation: "inverse" as const,
    a: [
      [2, 1],
      [1, 3],
    ],
  };
  for (let m = 1; m <= 3; m++)
    for (let n = 1; n <= 3; n++) {
      const next = reducer(s, { type: "shape", m, n });
      expect(next.a.length).toBe(m);
      expect(next.a[0].length).toBe(n);
      expect(next.x.length).toBe(n);
      expect(next.transposeX.length).toBe(m);
      expect(next.operation).toBe("original");
      expect(next.showOLS).toBe(true);
    }
  expect(reducer(s, { type: "reset" })).toEqual({
    ...initialState(),
    resetKey: 1,
  });
});
it("clips segments and faces to actual coordinate bounds without changing direction", () => {
  expect(clipSegment([0, 0], [9, 3])).toEqual([
    [0, 0],
    [6, 2],
  ]);
  expect(clipSegment([8, 8], [9, 9])).toBeNull();
  expect(clipSegment([-9, 0], [9, 0])).toEqual([
    [-6, 0],
    [6, 0],
  ]);
  const poly = clipPolygon([
    [-8, -8],
    [8, -8],
    [8, 8],
    [-8, 8],
  ]);
  expect(poly.length).toBe(4);
  expect(poly.every((p) => p.every((x) => Math.abs(x) === 6))).toBe(true);
});
it("constructs all span dimensions and a correctly clipped oblique plane", () => {
  expect(spanGeometry(fromNumbers([[0], [0], [0]])).rank).toBe(0);
  expect(spanGeometry(fromNumbers([[1], [2], [3]])).line).toEqual([
    [-2, -4, -6],
    [2, 4, 6],
  ]);
  const poly = spanGeometry(
    fromNumbers([
      [1, 0],
      [0, 1],
      [1, 1],
    ]),
  ).polygon!;
  expect(poly.length).toBe(6);
  for (const [x, y, z] of poly) {
    expect(z).toBeCloseTo(x + y);
    expect(Math.max(Math.abs(x), Math.abs(y), Math.abs(z))).toBeCloseTo(6);
  }
  expect(
    spanGeometry(
      fromNumbers([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]),
    ).rank,
  ).toBe(3);
});
it("preserves axis-drag scale after arbitrary camera orbits", () => {
  for (const yaw of [-2, -0.95, 0, 0.8, 2])
    for (const pitch of [-0.8, 0.48, 0.9]) {
      const project = projector({ dimension: 3, yaw, pitch }),
        o = project([0, 0, 0]);
      for (let axis = 0; axis < 3; axis++) {
        const v = [0, 0, 0];
        v[axis] = 1.5;
        const p = project(v);
        const d = axisDragDelta(p[0] - o[0], p[1] - o[1], axis, project);
        if (d !== null) expect(d).toBeCloseTo(1.5);
      }
    }
});
it("has correct unit topology for interval, square, cube", () => {
  expect([1, 2, 3].map((d) => cube(d).vertices.length)).toEqual([2, 4, 8]);
  expect([1, 2, 3].map((d) => cube(d).edges.length)).toEqual([1, 4, 12]);
});
