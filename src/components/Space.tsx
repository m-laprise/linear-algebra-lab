import { useId, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  columns,
  coordinates,
  numbers,
  type Matrix,
  type Vector,
} from "../math/algebra";
import {
  axisDragDelta,
  clipPolygon,
  clipSegment,
  cube,
  H,
  outside,
  projector,
  spanGeometry,
  W,
  type Point,
} from "../math/geometry";
import { snap } from "../state";
export const COLORS = ["#2678ad", "#b84b31", "#8060a6"];
export interface Arrow {
  id: string;
  label: string;
  value: Vector;
  color: string;
  start?: Vector;
  onChange?: (v: number[]) => void;
  dashed?: boolean;
}
interface Props {
  title: string;
  dimension: number;
  arrows: Arrow[];
  span?: Matrix;
  unit?: Matrix;
  unitLabel?: string;
  gridBasis?: Matrix;
  description?: string;
  axisLabels?: string[];
}
type Drag =
  | { kind: "orbit"; x: number; y: number; yaw: number; pitch: number }
  | {
      kind: "vector";
      id: string;
      x: number;
      y: number;
      start: number[];
      axis?: number;
    };
export function Space({
  title,
  dimension,
  arrows,
  span,
  unit,
  unitLabel,
  gridBasis,
  description,
  axisLabels = ["x", "y", "z"],
}: Props) {
  const [angle, setAngle] = useState({ yaw: -0.95, pitch: 0.48 });
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null),
    svg = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const project = useMemo(
    () => projector({ dimension, ...angle }),
    [dimension, angle],
  );
  const point = (e: PointerEvent): [number, number] => {
    const p = svg.current!.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    const local = p.matrixTransform(svg.current!.getScreenCTM()!.inverse());
    return [local.x, local.y];
  };
  const begin = (e: PointerEvent, id: string, axis?: number) => {
    e.stopPropagation();
    setSelected(id);
    const arrow = arrows.find((a) => a.id === id);
    if (!arrow?.onChange) return;
    if (dimension === 3 && axis === undefined) return;
    svg.current!.setPointerCapture(e.pointerId);
    const [x, y] = point(e);
    drag.current = {
      kind: "vector",
      id,
      x,
      y,
      start: numbers(arrow.value),
      axis,
    };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const [x, y] = point(e);
    if (d.kind === "orbit") {
      setAngle({
        yaw: d.yaw - (x - d.x) / 130,
        pitch: Math.max(-1.25, Math.min(1.25, d.pitch + (y - d.y) / 150)),
      });
      return;
    }
    const arrow = arrows.find((a) => a.id === d.id);
    if (!arrow?.onChange) return;
    if (dimension === 3) {
      const delta = axisDragDelta(x - d.x, y - d.y, d.axis!, project);
      if (delta !== null)
        arrow.onChange(
          d.start.map((v, i) => (i === d.axis ? snap(v + delta) : v)),
        );
    } else
      arrow.onChange(
        d.start.map((v, i) =>
          snap(v + (i === 0 ? (x - d.x) / 25 : -(y - d.y) / 25)),
        ),
      );
  };
  const stop = () => {
    drag.current = null;
  };
  const line = (
    a: Point,
    b: Point,
    key: string,
    color: string,
    width = 1,
    dashed = false,
  ) => {
    const segment = clipSegment(a, b);
    if (!segment) return null;
    const p = project(segment[0]),
      q = project(segment[1]);
    return (
      <line
        key={key}
        x1={p[0]}
        y1={p[1]}
        x2={q[0]}
        y2={q[1]}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
    );
  };
  const polygon = (
    points: Point[],
    key: string,
    color: string,
    opacity: number,
  ) => {
    const clipped = clipPolygon(points);
    return (
      <polygon
        key={key}
        points={clipped.map((p) => project(p).slice(0, 2).join(",")).join(" ")}
        fill={color}
        fillOpacity={opacity}
        stroke={color}
        strokeOpacity={opacity * 2}
        strokeWidth="1"
      />
    );
  };
  const grid = [];
  if (dimension >= 2)
    for (let i = -6; i <= 6; i++) {
      grid.push(
        line(
          [-6, i, 0].slice(0, dimension),
          [6, i, 0].slice(0, dimension),
          `gx${i}`,
          "#dce5e7",
        ),
      );
      grid.push(
        line(
          [i, -6, 0].slice(0, dimension),
          [i, 6, 0].slice(0, dimension),
          `gy${i}`,
          "#dce5e7",
        ),
      );
    }
  const sg = span ? spanGeometry(span) : null;
  const unitShape = unit ? cube(unit[0].length) : null;
  // Unit-cube vertices have only 0/1 entries; sum columns without approximating the matrix algebra.
  const colNums = unit ? columns(unit).map(numbers) : [];
  const vertices = unitShape
    ? unitShape.vertices.map((p) =>
        Array.from({ length: dimension }, (_, i) =>
          p.reduce((sum, x, j) => sum + x * colNums[j][i], 0),
        ),
      )
    : [];
  const box = cube(dimension, 12),
    boxVertices = box.vertices.map((p) => p.map((x) => x - 6));
  const active = arrows.find((a) => a.id === selected && a.onChange);
  const labelPositions = new Map<string, Point>(),
    labelBoxes: number[][] = [];
  const endOf = (arrow: Arrow) =>
    numbers(arrow.value).map((v, i) => v + (arrow.start?.[i].toNumber() || 0));
  for (const arrow of [...arrows].sort(
    (a, b) => project(endOf(a))[1] - project(endOf(b))[1],
  )) {
    const start = arrow.start ? numbers(arrow.start) : Array(dimension).fill(0),
      end = numbers(arrow.value).map((v, i) => v + start[i]);
    const segment = clipSegment(start, end);
    if (!segment) continue;
    const p = project(segment[1]),
      width = arrow.label.length * 7 + 4;
    const offsets = [
      [10, -12],
      [10, 20],
      [-width - 10, -12],
      [-width - 10, 20],
      [12, -32],
      [12, 40],
      [-width - 12, -32],
      [-width - 12, 40],
    ];
    let chosen = [p[0] + 10, p[1] + 20];
    for (const [dx, dy] of offsets) {
      const x = p[0] + dx,
        y = p[1] + dy,
        box = [x - 3, y - 12, x + width + 3, y + 5];
      if (box[0] < 3 || box[1] < 3 || box[2] > W - 3 || box[3] > H - 3)
        continue;
      if (
        labelBoxes.some(
          (b) =>
            box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1],
        )
      )
        continue;
      chosen = [x, y];
      break;
    }
    labelPositions.set(arrow.id, chosen);
    labelBoxes.push([
      chosen[0] - 3,
      chosen[1] - 12,
      chosen[0] + width + 3,
      chosen[1] + 5,
    ]);
  }
  // Separate handles in screen space even when two projected axes nearly align.
  const handles: { axis: number; p: Point; q: Point; units: number }[] = [];
  if (dimension === 3 && active) {
    const v = numbers(active.value),
      p = project(v);
    for (let axis = 0; axis < 3; axis++) {
      const unit = [...v];
      unit[axis] += 1;
      const end = project(unit),
        dx = end[0] - p[0],
        dy = end[1] - p[1],
        length = Math.hypot(dx, dy);
      if (length < 3) continue;
      let distance = 40,
        q: Point = [];
      do {
        q = [p[0] + (dx / length) * distance, p[1] + (dy / length) * distance];
        distance += 30;
      } while (
        handles.some((h) => Math.hypot(h.q[0] - q[0], h.q[1] - q[1]) < 28)
      );
      handles.push({ axis, p, q, units: (distance - 30) / length });
    }
  }
  return (
    <section
      className="space-card"
      aria-label={title}
      data-dimension={dimension}
    >
      <header>
        <h3>{title}</h3>
        <span className="space-badge">
          ℝ<sup>{dimension}</sup>
        </span>
      </header>
      <div className="space-toolbar">
        <span>
          {dimension === 3
            ? "Drag background to rotate"
            : arrows.some((a) => a.onChange)
              ? "Drag a filled endpoint"
              : "Calculated vectors"}{" "}
          · axes −6 to 6
        </span>
        {dimension === 3 && (
          <button
            type="button"
            onClick={() => setAngle({ yaw: -0.95, pitch: 0.48 })}
          >
            Reset view
          </button>
        )}
      </div>
      <svg
        ref={svg}
        className="space-svg"
        viewBox={`0 0 ${W} ${H}`}
        aria-label={`${title}: ${dimension} dimensional coordinate view`}
        role="group"
        onPointerDown={(e) => {
          if (dimension === 3) {
            const [x, y] = point(e);
            drag.current = { kind: "orbit", x, y, ...angle };
            svg.current!.setPointerCapture(e.pointerId);
          }
        }}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
      >
        <title>
          {title}.{" "}
          {arrows.map((a) => `${a.label} = ${coordinates(a.value)}`).join("; ")}
        </title>
        <defs>
          {arrows.map((a) => (
            <marker
              key={a.id}
              id={`${uid}-${a.id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={a.color} />
            </marker>
          ))}
        </defs>
        {sg?.rank === 3 &&
          box.faces.map((face, i) =>
            polygon(
              face.map((j) => boxVertices[j]),
              `spanbox${i}`,
              "#2c8b7d",
              0.025,
            ),
          )}
        {sg?.polygon && polygon(sg.polygon, "span", "#2c8b7d", 0.1)}
        {grid}
        {gridBasis &&
          dimension >= 2 &&
          (() => {
            const c = columns(gridBasis).map(numbers),
              lines = [];
            for (let k = -6; k <= 6; k++)
              for (let axis = 0; axis < dimension; axis++) {
                const other = (axis + 1) % dimension;
                lines.push(
                  line(
                    c[other].map((v, i) => k * v - 12 * c[axis][i]),
                    c[other].map((v, i) => k * v + 12 * c[axis][i]),
                    `basis${axis}-${k}`,
                    "#9a8cae",
                    0.8,
                    true,
                  ),
                );
              }
            return lines;
          })()}
        {dimension === 3 &&
          box.edges.map(([i, j], k) =>
            line(
              boxVertices[i],
              boxVertices[j],
              `box${k}`,
              "#d2dcdf",
              0.8,
              true,
            ),
          )}
        {Array.from({ length: dimension }, (_, i) => {
          const a = Array(dimension).fill(0),
            b = [...a];
          a[i] = -6;
          b[i] = 6;
          const end = project(b),
            start = project(a);
          return (
            <g key={i}>
              {line(a, b, `axis${i}`, "#8b9da5", 1.2)}
              <text x={end[0] + 7} y={end[1] - 7} className="axis-label">
                {axisLabels[i]} · 6
              </text>
              <text x={start[0] - 10} y={start[1] + 15} className="tick-label">
                −6
              </text>
              {Array.from({ length: 11 }, (_, k) => k - 5)
                .filter((k) => k !== 0)
                .map((k) => {
                  const p = Array(dimension).fill(0);
                  p[i] = k;
                  const s = project(p);
                  return (
                    <g key={k}>
                      <circle cx={s[0]} cy={s[1]} r="1.6" fill="#8b9da5" />
                      {dimension < 3 && k % 2 === 0 && (
                        <text
                          x={s[0] + (i ? 7 : -4)}
                          y={s[1] + (i ? 4 : 16)}
                          className="tick-label"
                        >
                          {k}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          );
        })}
        {sg?.line && line(sg.line[0], sg.line[1], "spanline", "#2c8b7d", 5)}
        {sg?.rank === 0 && (
          <circle
            cx={project([])[0]}
            cy={project([])[1]}
            r="7"
            fill="#2c8b7d"
            fillOpacity="0.3"
          />
        )}
        {unitShape?.faces.map((face, i) =>
          polygon(
            face.map((j) => vertices[j]),
            `unit${i}`,
            "#bc9345",
            0.14,
          ),
        )}
        {unitShape && (
          <g data-testid="unit-image">
            {unitShape.edges.map(([i, j], k) =>
              line(vertices[i], vertices[j], `unitEdge${k}`, "#ac843a", 1.8),
            )}
          </g>
        )}
        {[...arrows]
          .sort((a, b) => Number(a.id === selected) - Number(b.id === selected))
          .map((arrow) => {
            const start = arrow.start
                ? numbers(arrow.start)
                : Array(dimension).fill(0),
              end = numbers(arrow.value).map((v, i) => v + start[i]),
              clipped = clipSegment(start, end);
            if (!clipped) return null;
            const a = project(clipped[0]),
              b = project(clipped[1]),
              isOutside = outside(end),
              isZero = end.every((v, i) => v === start[i]);
            return (
              <g
                key={arrow.id}
                data-arrow={arrow.id}
                data-coordinates={coordinates(arrow.value)}
                data-outside={isOutside}
                style={{ pointerEvents: arrow.onChange ? "auto" : "none" }}
              >
                <line
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke={arrow.color}
                  strokeWidth={arrow.dashed ? 2 : 2.6}
                  strokeDasharray={arrow.dashed ? "5 4" : undefined}
                  markerEnd={
                    isOutside || isZero ? undefined : `url(#${uid}-${arrow.id})`
                  }
                />
                {isOutside ? (
                  <g>
                    <circle
                      cx={b[0]}
                      cy={b[1]}
                      r="7"
                      fill="white"
                      stroke={arrow.color}
                      strokeDasharray="2 2"
                    />
                    <text
                      x={b[0] + 9}
                      y={b[1] - 8}
                      fill={arrow.color}
                      fontSize="11"
                    >
                      continues
                    </text>
                  </g>
                ) : (
                  <circle
                    className={arrow.onChange ? "drag-endpoint" : ""}
                    data-testid={`${arrow.id}-endpoint`}
                    cx={b[0]}
                    cy={b[1]}
                    r={selected === arrow.id ? 7 : 5}
                    fill={arrow.onChange ? arrow.color : "white"}
                    stroke={arrow.color}
                    strokeWidth="2"
                    tabIndex={arrow.onChange ? 0 : undefined}
                    role={arrow.onChange ? "button" : undefined}
                    aria-label={
                      arrow.onChange
                        ? `Select ${arrow.label} to move; coordinates ${coordinates(arrow.value)}`
                        : undefined
                    }
                    onPointerDown={(e) => begin(e, arrow.id)}
                    onFocus={() => setSelected(arrow.id)}
                    onKeyDown={(e) => {
                      if (!arrow.onChange) return;
                      const dirs: Record<string, [number, number]> = {
                        ArrowRight: [0, 0.5],
                        ArrowLeft: [0, -0.5],
                        ArrowUp: [dimension === 1 ? 0 : 1, 0.5],
                        ArrowDown: [dimension === 1 ? 0 : 1, -0.5],
                        PageUp: [2, 0.5],
                        PageDown: [2, -0.5],
                      };
                      const dir = dirs[e.key];
                      if (dir && dir[0] < dimension) {
                        e.preventDefault();
                        arrow.onChange(
                          end.map((v, i) =>
                            i === dir[0] ? snap(v + dir[1]) : v,
                          ),
                        );
                      }
                    }}
                  />
                )}
                <line
                  x1={b[0]}
                  y1={b[1]}
                  x2={Math.max(
                    labelPositions.get(arrow.id)![0] - 3,
                    Math.min(
                      labelPositions.get(arrow.id)![0] + arrow.label.length * 7,
                      b[0],
                    ),
                  )}
                  y2={labelPositions.get(arrow.id)![1] - 5}
                  stroke={arrow.color}
                  strokeWidth="0.7"
                  strokeOpacity="0.6"
                  style={{ pointerEvents: "none" }}
                />
                <text
                  x={labelPositions.get(arrow.id)![0]}
                  y={labelPositions.get(arrow.id)![1]}
                  className="vector-label"
                  fill={arrow.color}
                  style={{ pointerEvents: "none" }}
                >
                  {arrow.label}
                </text>
              </g>
            );
          })}
        {active &&
          handles.map(({ axis, p, q, units }) => {
            return (
              <g
                key={axis}
                className="axis-handle"
                data-testid={`${active.id}-handle-${axis}`}
                data-units={units}
                onPointerDown={(e) => begin(e, active.id, axis)}
              >
                <line
                  x1={p[0]}
                  y1={p[1]}
                  x2={q[0]}
                  y2={q[1]}
                  stroke={COLORS[axis]}
                  strokeWidth="2"
                />
                <circle
                  cx={q[0]}
                  cy={q[1]}
                  r="10"
                  fill="white"
                  stroke={COLORS[axis]}
                  strokeWidth="2"
                />
                <text
                  x={q[0]}
                  y={q[1] + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill={COLORS[axis]}
                >
                  {["x", "y", "z"][axis]}
                </text>
              </g>
            );
          })}
        <text
          x={project([])[0] - 13}
          y={project([])[1] + 14}
          className="tick-label"
        >
          0
        </text>
      </svg>
      {(dimension === 3 || arrows.filter((a) => a.onChange).length > 1) &&
        arrows.some((a) => a.onChange) && (
          <div className="handle-selector">
            <span>Move:</span>
            {arrows
              .filter((a) => a.onChange)
              .map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={selected === a.id}
                  onClick={() => setSelected(selected === a.id ? null : a.id)}
                >
                  {a.label}
                </button>
              ))}
            <small>
              {dimension === 3
                ? "Select a vector, then drag an x, y, or z handle. Rotate if an axis is edge-on."
                : "Select a vector to bring its endpoint to the front when vectors overlap."}
            </small>
          </div>
        )}
      <div className="space-legend">
        {arrows.map((a) => (
          <span key={a.id} style={{ color: a.color }}>
            <b>{a.label}</b> {coordinates(a.value)}
            {outside(
              numbers(a.value).map(
                (v, i) => v + (a.start?.[i].toNumber() || 0),
              ),
            ) && <em> outside view</em>}
          </span>
        ))}
      </div>
      {(span || unitLabel || description) && (
        <p className="plot-note">
          {span && (
            <>
              Green: column span (
              {["origin", "line", "plane", "all of ℝ³"][sg!.rank]}).{" "}
            </>
          )}
          {unitLabel && <>Gold: {unitLabel}. </>}
          {description}
        </p>
      )}
    </section>
  );
}
