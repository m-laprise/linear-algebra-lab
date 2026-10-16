import { initialMatrix } from "./state";
export interface Preset {
  id: string;
  label: string;
  values: number[][];
}
export function presets(m: number, n: number): Preset[] {
  const eye = initialMatrix(m, n);
  const p: Preset[] = [
    {
      id: "identity",
      label:
        m === n
          ? "Identity"
          : m > n
            ? "Coordinate inclusion"
            : "Coordinate drop",
      values: eye,
    },
    {
      id: "zero",
      label: "Zero transformation",
      values: eye.map((row) => row.map(() => 0)),
    },
  ];
  if (m === n) {
    p.push(
      {
        id: "stretch",
        label: "Uniform stretch ×2",
        values: eye.map((row) => row.map((x) => 2 * x)),
      },
      {
        id: "compress",
        label: "Uniform compression ×½",
        values: eye.map((row) => row.map((x) => x / 2)),
      },
      {
        id: "reflect",
        label: "Reflect first coordinate",
        values: eye.map((row, i) => row.map((x) => (i === 0 ? -x : x))),
      },
    );
    if (n >= 2) {
      const stretch = initialMatrix(n, n);
      stretch[0][0] = 2;
      const compress = initialMatrix(n, n);
      compress[0][0] = 0.5;
      p.push(
        {
          id: "stretch-x",
          label: "Stretch first coordinate ×2",
          values: stretch,
        },
        {
          id: "compress-x",
          label: "Compress first coordinate ×½",
          values: compress,
        },
      );
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
          label: n === 3 ? "Quarter-turn about z" : "Quarter-turn rotation",
          values: turn,
        },
        { id: "shear", label: "Shear", values: shear },
        {
          id: "axis",
          label: "Orthogonal projection onto x-axis",
          values: axis,
        },
      );
    }
    if (n === 3)
      p.push({
        id: "plane",
        label: "Orthogonal projection onto xy-plane",
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
