import { OrthographicCamera, Vector3 } from "three";
import { columns, rref, type Matrix } from "./algebra";
import { VIEW_LIMIT } from "../state";
export type Point = number[];
export const pad = (p: Point): [number, number, number] => [
  p[0] || 0,
  p[1] || 0,
  p[2] || 0,
];
export const W = 440,
  H = 360;
export interface View {
  dimension: number;
  yaw: number;
  pitch: number;
}
export function projector({ dimension, yaw, pitch }: View) {
  const camera = new OrthographicCamera(
    -12.5,
    12.5,
    (12.5 * H) / W,
    (-12.5 * H) / W,
    0.1,
    100,
  );
  camera.up.set(0, 0, 1);
  camera.position.set(
    20 * Math.cos(pitch) * Math.cos(yaw),
    20 * Math.cos(pitch) * Math.sin(yaw),
    20 * Math.sin(pitch),
  );
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return (p: Point): [number, number, number] => {
    if (dimension < 3)
      return [W / 2 + (p[0] || 0) * 25, H / 2 - (p[1] || 0) * 25, 0];
    const v = new Vector3(...pad(p)).project(camera);
    return [((v.x + 1) * W) / 2, ((1 - v.y) * H) / 2, v.z];
  };
}
/** Clip a finite segment against the mathematical box, before projection. */
export function clipSegment(
  a: Point,
  b: Point,
  limit = VIEW_LIMIT,
): [Point, Point] | null {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < a.length; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-12) {
      if (Math.abs(a[i]) > limit) return null;
      continue;
    }
    const t1 = (-limit - a[i]) / d,
      t2 = (limit - a[i]) / d;
    lo = Math.max(lo, Math.min(t1, t2));
    hi = Math.min(hi, Math.max(t1, t2));
    if (lo > hi) return null;
  }
  return [
    a.map((v, i) => v + lo * (b[i] - v)),
    a.map((v, i) => v + hi * (b[i] - v)),
  ];
}
export const outside = (p: Point) =>
  p.some((x) => Math.abs(x) > VIEW_LIMIT + 1e-9);
export function cube(
  d: number,
  size = 1,
): { vertices: Point[]; edges: [number, number][]; faces: number[][] } {
  const vertices = Array.from({ length: 2 ** d }, (_, mask) =>
    Array.from({ length: d }, (_, i) => ((mask >> i) & 1) * size),
  );
  const edges: [number, number][] = [];
  vertices.forEach((_, i) => {
    for (let j = 0; j < d; j++)
      if (!((i >> j) & 1)) edges.push([i, i | (1 << j)]);
  });
  const faces =
    d === 2
      ? [[0, 1, 3, 2]]
      : d === 3
        ? [
            [0, 1, 3, 2],
            [4, 5, 7, 6],
            [0, 1, 5, 4],
            [2, 3, 7, 6],
            [0, 2, 6, 4],
            [1, 3, 7, 5],
          ]
        : [];
  return { vertices, edges, faces };
}
export function clipPolygon(input: Point[], limit = VIEW_LIMIT): Point[] {
  let polygon = input;
  if (!polygon.length) return polygon;
  const d = polygon[0].length;
  for (let axis = 0; axis < d; axis++)
    for (const sign of [-1, 1]) {
      const prev = polygon;
      polygon = [];
      for (let i = 0; i < prev.length; i++) {
        const a = prev[i],
          b = prev[(i + 1) % prev.length],
          ain = sign * a[axis] <= limit,
          bin = sign * b[axis] <= limit;
        if (ain) polygon.push(a);
        if (ain !== bin) {
          const t = (sign * limit - a[axis]) / (b[axis] - a[axis]);
          polygon.push(a.map((v, j) => v + t * (b[j] - v)));
        }
      }
    }
  return polygon;
}
/** Exact pivot selection, floating geometry only after the span dimension is known. */
export function spanGeometry(a: Matrix): {
  rank: number;
  line?: Point[];
  polygon?: Point[];
} {
  const pivots = rref(a).pivots,
    d = a.length,
    r = pivots.length,
    cols = columns(a).map((v) => v.map((q) => q.toNumber()));
  if (r === 0) return { rank: 0 };
  if (r === 1) {
    const v = cols[pivots[0]],
      scale = VIEW_LIMIT / Math.max(...v.map(Math.abs));
    return {
      rank: 1,
      line: [v.map((x) => -x * scale), v.map((x) => x * scale)],
    };
  }
  if (d === 2)
    return {
      rank: r,
      polygon: [
        [-6, -6],
        [6, -6],
        [6, 6],
        [-6, 6],
      ],
    };
  if (r === 3) return { rank: r };
  const u = new Vector3(...pad(cols[pivots[0]])).normalize();
  const normal = new Vector3(...pad(cols[pivots[0]]))
    .cross(new Vector3(...pad(cols[pivots[1]])))
    .normalize();
  const v = new Vector3().crossVectors(normal, u);
  const box = cube(3, 12);
  const corners = box.vertices.map((p) => p.map((x) => x - 6));
  const intersections: Vector3[] = [];
  for (const [i, j] of box.edges) {
    const a3 = new Vector3(...pad(corners[i])),
      b3 = new Vector3(...pad(corners[j]));
    const da = normal.dot(a3),
      db = normal.dot(b3);
    if (Math.abs(da) < 1e-9) intersections.push(a3);
    if (da * db < 0) intersections.push(a3.clone().lerp(b3, da / (da - db)));
    if (Math.abs(db) < 1e-9) intersections.push(b3);
  }
  const unique = intersections.filter(
    (p, i) => intersections.findIndex((q) => p.distanceTo(q) < 1e-8) === i,
  );
  unique.sort(
    (a, b) => Math.atan2(a.dot(v), a.dot(u)) - Math.atan2(b.dot(v), b.dot(u)),
  );
  return { rank: r, polygon: unique.map((p) => p.toArray()) };
}
export function axisDragDelta(
  dx: number,
  dy: number,
  axis: number,
  project: ReturnType<typeof projector>,
): number | null {
  const origin = project([0, 0, 0]),
    unit = [0, 0, 0];
  unit[axis] = 1;
  const end = project(unit),
    sx = end[0] - origin[0],
    sy = end[1] - origin[1],
    length = sx * sx + sy * sy;
  return length < 9 ? null : (dx * sx + dy * sy) / length;
}
