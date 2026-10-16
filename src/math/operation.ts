import { inverse, transpose, type Matrix } from "./algebra";
import type { Operation } from "../state";

/** The same operator supplies the readout, statistics, columns, unit shape and product. */
export function operationView(a: Matrix, operation: Operation) {
  if (operation === "inverse") {
    const matrix = inverse(a);
    return {
      matrix,
      symbol: "A^{-1}",
      label: "A⁻¹",
      input: "y",
      column: "b",
      unavailable:
        a.length !== a[0].length
          ? "A is rectangular; a two-sided inverse is not defined."
          : !matrix
            ? "A is singular (determinant 0); no inverse exists."
            : null,
    };
  }
  return operation === "transpose"
    ? {
        matrix: transpose(a),
        symbol: "A^{\\mathsf T}",
        label: "Aᵀ",
        input: "u",
        column: "t",
        unavailable: null,
      }
    : {
        matrix: a,
        symbol: "A",
        label: "A",
        input: "x",
        column: "a",
        unavailable: null,
      };
}
