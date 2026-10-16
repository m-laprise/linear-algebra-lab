import { identity } from "./math/algebra";
export const EDIT_LIMIT = 3;
export const VIEW_LIMIT = 6;
/** Ties are rounded away from zero, symmetrically on both sides of the origin. */
export function snap(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Expected finite coordinate");
  const result = (Math.sign(value) * Math.floor(Math.abs(value) * 2 + 0.5)) / 2;
  return Math.max(-EDIT_LIMIT, Math.min(EDIT_LIMIT, result)) || 0;
}
export function parseInput(text: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim())) return null;
  const value = Number(text);
  return Number.isFinite(value) &&
    Math.abs(value) <= EDIT_LIMIT &&
    Number.isInteger(2 * value)
    ? value || 0
    : null;
}
export const initialMatrix = (m: number, n: number) =>
  identity(m, n).map((row) => row.map((q) => q.toNumber()));
export const initialVector = (n: number) =>
  Array.from({ length: n }, (_, i) => (i === 0 ? 1 : 0.5));
export type Operation = "original" | "inverse" | "transpose";
export interface State {
  tab: "matrices" | "bases";
  a: number[][];
  x: number[];
  transposeX: number[];
  b: number[][];
  v: number[];
  operation: Operation;
  showOLS: boolean;
  y: number[];
  resetKey: number;
}
export const initialState = (): State => ({
  tab: "matrices",
  a: initialMatrix(2, 2),
  x: initialVector(2),
  transposeX: initialVector(2),
  b: initialMatrix(2, 2),
  v: [2, 1],
  operation: "original",
  showOLS: false,
  y: [1, 2, 1],
  resetKey: 0,
});
export type Action =
  | { type: "reset" }
  | { type: "shape"; m: number; n: number }
  | { type: "basisDimension"; d: number }
  | { type: "patch"; value: Partial<State> };
export function reducer(s: State, action: Action): State {
  if (action.type === "reset")
    return { ...initialState(), resetKey: s.resetKey + 1 };
  if (action.type === "shape")
    return {
      ...s,
      a: initialMatrix(action.m, action.n),
      x: initialVector(action.n),
      transposeX: initialVector(action.m),
      operation: "original",
    };
  if (action.type === "basisDimension")
    return {
      ...s,
      b: initialMatrix(action.d, action.d),
      v: initialVector(action.d),
    };
  return { ...s, ...action.value };
}
