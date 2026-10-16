import { useEffect, useId, useState } from "react";
import { parseInput, snap } from "../state";
export function NumberInput({
  value,
  label,
  onChange,
  revision,
}: {
  value: number;
  label: string;
  onChange: (v: number) => void;
  revision?: unknown;
}) {
  const [draft, setDraft] = useState(String(value)),
    [error, setError] = useState(false);
  const id = useId();
  useEffect(() => {
    setDraft(String(value));
    setError(false);
  }, [value, revision]);
  const commit = () => {
    const v = parseInput(draft);
    if (v === null) {
      setError(true);
      return;
    }
    onChange(v);
    setDraft(String(v));
    setError(false);
  };
  return (
    <span className="number-field">
      <input
        aria-label={label}
        aria-invalid={error}
        aria-describedby={error ? id : undefined}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(false);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(String(value));
            setError(false);
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const v = snap(value + (e.key === "ArrowUp" ? 0.5 : -0.5));
            onChange(v);
            setDraft(String(v));
            setError(false);
          }
        }}
      />
      {error && (
        <span id={id} className="field-error" role="alert">
          Use −3 to 3 in steps of 0.5.
        </span>
      )}
    </span>
  );
}
export function MatrixEditor({
  values,
  name,
  onChange,
  highlight,
}: {
  values: number[][];
  name: string;
  onChange: (v: number[][]) => void;
  highlight?: [number, number] | null;
}) {
  return (
    <div
      className="matrix-editor"
      role="group"
      aria-label={`${name} matrix editor`}
      style={{ gridTemplateColumns: `repeat(${values[0].length}, 1fr)` }}
    >
      {values.flatMap((row, i) =>
        row.map((v, j) => (
          <div
            key={`${i}-${j}`}
            className={
              highlight?.[0] === i && highlight[1] === j
                ? "entry highlighted"
                : "entry"
            }
            style={{ borderBottomColor: ["#307bb4", "#bb5940", "#8563ac"][j] }}
          >
            <NumberInput
              value={v}
              revision={values}
              label={`${name} row ${i + 1} column ${j + 1}`}
              onChange={(next) =>
                onChange(
                  values.map((r, ri) =>
                    r.map((x, cj) => (ri === i && cj === j ? next : x)),
                  ),
                )
              }
            />
          </div>
        )),
      )}
    </div>
  );
}
export function VectorEditor({
  values,
  name,
  onChange,
}: {
  values: number[];
  name: string;
  onChange: (v: number[]) => void;
}) {
  return (
    <div
      className="vector-editor"
      role="group"
      aria-label={`${name} coordinates`}
    >
      {values.map((v, i) => (
        <label key={i}>
          <span>
            {name}
            <sub>{i + 1}</sub>
          </span>
          <NumberInput
            value={v}
            revision={values}
            label={`${name} coordinate ${i + 1}`}
            onChange={(next) =>
              onChange(values.map((x, j) => (j === i ? next : x)))
            }
          />
        </label>
      ))}
    </div>
  );
}
