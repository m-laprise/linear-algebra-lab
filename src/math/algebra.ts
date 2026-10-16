import { Q, ZERO, ONE } from "./rational";
export type Matrix = Q[][];
export type Vector = Q[];
export const fromNumbers = (a: number[][]): Matrix =>
  a.map((row) => row.map(Q.half));
export const vector = (a: number[]): Vector => a.map(Q.half);
export const numbers = (v: Vector) => v.map((q) => q.toNumber());
export const identity = (m: number, n = m): Matrix =>
  Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? ONE : ZERO)),
  );
export const transpose = (a: Matrix): Matrix =>
  a[0].map((_, j) => a.map((row) => row[j]));
export const columns = transpose;
export const dot = (a: Vector, b: Vector): Q => {
  if (a.length !== b.length) throw new Error("Incompatible vector dimensions");
  return a.reduce((sum, x, i) => sum.add(x.mul(b[i])), ZERO);
};
export const multiplyVector = (a: Matrix, x: Vector): Vector =>
  a.map((row) => dot(row, x));
export const multiply = (a: Matrix, b: Matrix): Matrix =>
  a.map((row) => transpose(b).map((col) => dot(row, col)));
export const subtract = (a: Vector, b: Vector): Vector =>
  a.map((x, i) => x.sub(b[i]));
export function rref(a: Matrix): { matrix: Matrix; pivots: number[] } {
  const b = a.map((row) => [...row]),
    pivots: number[] = [];
  let r = 0;
  for (let c = 0; c < b[0].length && r < b.length; c++) {
    const p = b.findIndex((row, i) => i >= r && !row[c].zero);
    if (p < 0) continue;
    [b[r], b[p]] = [b[p], b[r]];
    const pivot = b[r][c];
    b[r] = b[r].map((x) => x.div(pivot));
    for (let i = 0; i < b.length; i++)
      if (i !== r) {
        const f = b[i][c];
        b[i] = b[i].map((x, j) => x.sub(f.mul(b[r][j])));
      }
    pivots.push(c);
    r++;
  }
  return { matrix: b, pivots };
}
export const rank = (a: Matrix): number => rref(a).pivots.length;
export function determinant(a: Matrix): Q | null {
  if (a.length !== a[0].length) return null;
  if (a.length === 1) return a[0][0];
  return a[0].reduce((sum, x, j) => {
    const minor = a.slice(1).map((row) => row.filter((_, k) => k !== j));
    const term = x.mul(determinant(minor)!);
    return sum.add(j % 2 ? term.neg() : term);
  }, ZERO);
}
export function inverse(a: Matrix): Matrix | null {
  const det = determinant(a);
  if (!det || det.zero) return null;
  const n = a.length,
    eye = identity(n);
  return rref(a.map((row, i) => [...row, ...eye[i]])).matrix.map((row) =>
    row.slice(n),
  );
}
export function columnCombination(a: Matrix, x: Vector): Vector {
  return columns(a).reduce(
    (sum, col, j) => sum.map((v, i) => v.add(col[i].mul(x[j]))),
    a.map(() => ZERO),
  );
}
export const basisCoordinates = (b: Matrix, v: Vector): Vector | null => {
  const inv = inverse(b);
  return inv ? multiplyVector(inv, v) : null;
};
export const OLS_X = fromNumbers([
  [1, -1],
  [1, 0],
  [1, 1],
]);
export function ols(y: Vector) {
  const xt = transpose(OLS_X);
  const beta = multiplyVector(multiply(inverse(multiply(xt, OLS_X))!, xt), y);
  const fitted = multiplyVector(OLS_X, beta);
  return { beta, fitted, residual: subtract(y, fitted) };
}
export const texMatrix = (a: Matrix) =>
  `\\begin{bmatrix}${a.map((row) => row.map((q) => q.tex()).join("&")).join("\\\\")}\\end{bmatrix}`;
export const texVector = (v: Vector) => texMatrix(v.map((q) => [q]));
export const coordinates = (v: Vector) =>
  `(${v.map((q) => q.toString()).join(", ")})`;
