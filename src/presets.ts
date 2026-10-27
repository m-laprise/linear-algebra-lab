import { initialMatrix } from "./state";
export interface Preset {
  id: string;
  label: string;
  values: number[][];
  description?: string;
}
export const selectedPreset = (choices: Preset[], values: number[][]) =>
  choices.find(
    (p) =>
      p.values.length === values.length &&
      p.values.every(
        (row, i) =>
          row.length === values[i].length &&
          row.every((value, j) => value === values[i][j]),
      ),
  )?.id ?? "custom";
export function basisPresets(d: number): Preset[] {
  const standard = initialMatrix(d, d);
  const choices: Preset[] = [
    {
      id: "standard",
      label: "Usual axes (standard)",
      values: standard,
    },
    {
      id: "scaled",
      label: "Longer arrows (scaled)",
      values: standard.map((row) => row.map((x) => 2 * x)),
    },
  ];
  if (d > 1) {
    const oblique = initialMatrix(d, d);
    oblique[0][1] = 1;
    choices.push(
      { id: "oblique", label: "Slanted (oblique)", values: oblique },
      {
        id: "dependent",
        label: "One line (not a basis)",
        values: standard.map((row) => row.map(() => 1)),
      },
    );
  }
  return choices;
}
export function presets(m: number, n: number): Preset[] {
  const eye = initialMatrix(m, n);
  const p: Preset[] = [
    {
      id: "identity",
      label:
        m === n
          ? "Unchanged (identity)"
          : m > n
            ? "Add zero coordinates"
            : "Keep the first coordinates",
      values: eye,
    },
    {
      id: "zero",
      label: "All outputs zero",
      values: eye.map((row) => row.map(() => 0)),
    },
  ];
  if (m === n) {
    p.push(
      {
        id: "stretch-x",
        label: "Stretch ×2",
        values: eye.map((row, i) => row.map((x) => (i === 0 ? 2 * x : x))),
        description: "This matrix doubles the first coordinate.",
      },
      {
        id: "reflect",
        label: "Reflection",
        values: eye.map((row, i) => row.map((x) => (i === 0 ? -x : x))),
        description:
          "This reflection changes the sign of the first coordinate.",
      },
    );
    if (n >= 2) {
      const turn = initialMatrix(n, n);
      turn[0][0] = 0;
      turn[1][1] = 0;
      turn[0][1] = -1;
      turn[1][0] = 1;
      const shear = initialMatrix(n, n);
      shear[0][1] = 1;
      const axis = eye.map((row, i) => row.map((x) => (i === 0 ? x : 0)));
      p.push(
        {
          id: "quarter",
          label: n === 3 ? "Rotate 90° about z" : "Rotate 90°",
          values: turn,
        },
        { id: "shear", label: "Horizontal slant (shear)", values: shear },
        {
          id: "axis",
          label: "Flatten onto x-axis",
          values: axis,
          description:
            "This projection keeps the first coordinate and sets the others to zero.",
        },
      );
    }
    if (n === 3)
      p.push({
        id: "plane",
        description:
          "This projection keeps the first two coordinates and sets the third to zero.",
        label: "Flatten onto xy-plane",
        values: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 0],
        ],
      });
  }
  if (n > 1)
    p.push({
      id: "dependent",
      label: "Dependent columns",
      values: Array.from({ length: m }, () =>
        Array.from({ length: n }, (_, j) => j + 1),
      ),
    });
  if (m === 1 && n > 1)
    p.push({ id: "sum", label: "Coordinate sum", values: [Array(n).fill(1)] });
  return p;
}
