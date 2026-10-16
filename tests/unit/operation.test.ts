import { expect, it } from "vitest";
import {
  fromNumbers,
  multiplyVector,
  vector,
  determinant,
} from "../../src/math/algebra";
import { operationView } from "../../src/math/operation";

it("distinguishes A, its inverse, and its transpose on a non-symmetric map", () => {
  const a = fromNumbers([
      [2, 1],
      [0, 1],
    ]),
    x = vector([1, 1]);
  const expected = [
    {
      mode: "original",
      matrix: [
        ["2", "1"],
        ["0", "1"],
      ],
      output: ["3", "1"],
      det: "2",
    },
    {
      mode: "inverse",
      matrix: [
        ["1/2", "-1/2"],
        ["0", "1"],
      ],
      output: ["0", "1"],
      det: "1/2",
    },
    {
      mode: "transpose",
      matrix: [
        ["2", "0"],
        ["1", "1"],
      ],
      output: ["2", "2"],
      det: "2",
    },
  ] as const;
  for (const fixture of expected) {
    const shown = operationView(a, fixture.mode).matrix!;
    expect(shown.map((row) => row.map(String))).toEqual(fixture.matrix);
    expect(multiplyVector(shown, x).map(String)).toEqual(fixture.output);
    expect(determinant(shown)?.toString()).toBe(fixture.det);
  }
  expect(a.map((row) => row.map(String))).toEqual([
    ["2", "1"],
    ["0", "1"],
  ]);
});
it("never substitutes A for an undefined inverse", () => {
  for (const values of [
    [
      [1, 2],
      [2, 4],
    ],
    [
      [1, 0, 0],
      [0, 1, 0],
    ],
    [[0]],
  ]) {
    const view = operationView(fromNumbers(values), "inverse");
    expect(view.matrix).toBeNull();
    expect(view.unavailable).toBeTruthy();
  }
});
it("transposes every rectangular shape with correct row-column correspondence", () => {
  for (let m = 1; m <= 3; m++)
    for (let n = 1; n <= 3; n++) {
      const a = fromNumbers(
        Array.from({ length: m }, (_, i) =>
          Array.from({ length: n }, (_, j) => (i - j) / 2),
        ),
      );
      const shown = operationView(a, "transpose").matrix!;
      expect(shown.length).toBe(n);
      expect(shown[0].length).toBe(m);
      a.forEach((row, i) =>
        row.forEach((entry, j) => expect(shown[j][i]).toEqual(entry)),
      );
    }
});
