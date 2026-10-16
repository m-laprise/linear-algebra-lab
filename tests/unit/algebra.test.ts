import { describe, expect, it } from "vitest";
import cases from "../fixtures/sympy.json";
import { Q } from "../../src/math/rational";
import {
  basisCoordinates,
  columnCombination,
  columns,
  determinant,
  fromNumbers,
  identity,
  inverse,
  multiply,
  multiplyVector,
  OLS_X,
  ols,
  rank,
  transpose,
  vector,
  type Matrix,
} from "../../src/math/algebra";
const strings = (a: Matrix) => a.map((row) => row.map((q) => q.toString()));
describe("exact fractions", () => {
  it("normalizes signs, reduces and never rounds", () => {
    expect(new Q(2, -6).toString()).toBe("-1/3");
    expect(new Q(1, 3).add(new Q(1, 6)).toString()).toBe("1/2");
    expect(new Q(0, -3).toString()).toBe("0");
    expect(() => new Q(1, 0)).toThrow();
    expect(() => new Q(2).div(new Q(0))).toThrow();
    expect(() => Q.half(0.3)).toThrow();
  });
});
describe("independent SymPy oracle and algebraic identities, all 9 shapes", () => {
  cases.forEach((fixture, i) =>
    it(`case ${i}: ${fixture.a.length} × ${fixture.a[0].length}`, () => {
      const a = fromNumbers(fixture.a),
        x = vector(fixture.x),
        y = multiplyVector(a, x),
        inv = inverse(a);
      expect(y.map(String)).toEqual(fixture.y);
      expect(rank(a)).toBe(fixture.rank);
      expect(determinant(a)?.toString() ?? null).toBe(fixture.det);
      expect(inv ? strings(inv) : null).toEqual(fixture.inverse);
      expect(columnCombination(a, x).map(String)).toEqual(fixture.y);
      expect(strings(transpose(transpose(a)))).toEqual(strings(a));
      expect(rank(transpose(a))).toBe(rank(a));
      columns(identity(a[0].length)).forEach((e, j) =>
        expect(multiplyVector(a, e).map(String)).toEqual(
          columns(a)[j].map(String),
        ),
      );
      if (inv) {
        expect(strings(multiply(inv, a))).toEqual(strings(identity(a.length)));
        expect(strings(multiply(a, inv))).toEqual(strings(identity(a.length)));
        expect(multiplyVector(inv, y).map(String)).toEqual(x.map(String));
        expect(basisCoordinates(a, y)?.map(String)).toEqual(x.map(String));
      }
    }),
  );
});
it("distinguishes singular bases and fractions not on the editing grid", () => {
  expect(
    basisCoordinates(
      fromNumbers([
        [1, 2],
        [1, 2],
      ]),
      vector([1, 1]),
    ),
  ).toBeNull();
  expect(
    strings(
      inverse(
        fromNumbers([
          [3, 0],
          [0, 3],
        ]),
      )!,
    ),
  ).toEqual([
    ["1/3", "0"],
    ["0", "1/3"],
  ]);
  expect(
    determinant(
      fromNumbers([
        [0, -1],
        [1, 0],
      ]),
    )!.toString(),
  ).toBe("1");
  expect(
    determinant(
      fromNumbers([
        [-1, 0],
        [0, 1],
      ]),
    )!.toString(),
  ).toBe("-1");
});
it("OLS projects every half-grid response onto col(X) with an orthogonal residual", () => {
  for (let a = -3; a <= 3; a += 0.5)
    for (let b = -3; b <= 3; b += 0.5)
      for (let c = -3; c <= 3; c += 0.5) {
        const y = vector([a, b, c]),
          fit = ols(y);
        expect(
          multiplyVector(transpose(OLS_X), fit.residual).map(String),
        ).toEqual(["0", "0"]);
        expect(
          fit.fitted.map((v, i) => v.add(fit.residual[i]).toString()),
        ).toEqual(y.map(String));
        expect(ols(fit.fitted).fitted.map(String)).toEqual(
          fit.fitted.map(String),
        );
      }
});
