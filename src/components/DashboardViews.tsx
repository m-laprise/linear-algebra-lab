import { useState, useEffect } from "react";
import {
  basisCoordinates,
  columns,
  coordinates,
  determinant,
  fromNumbers,
  identity,
  multiplyVector,
  OLS_X,
  ols,
  rank,
  texMatrix,
  texVector,
  transpose,
  vector,
  type Matrix,
  type Vector,
} from "../math/algebra";
import { operationView } from "../math/operation";
import { basisPresets, presets, selectedPreset } from "../presets";
import { type State, type Action, type Operation } from "../state";
import { MatrixEditor, NumberInput, VectorEditor } from "./Editors";
import { MathText } from "./Math";
import { COLORS, Space, type Arrow } from "./Space";

const DARK = "#273b4a",
  GREEN = "#177e70";
type Props = { s: State; dispatch: (action: Action) => void };
const EDIT_HELP =
  "Editable values use steps of 0.5 from −3 to 3. Calculated results can contain other fractions. Enter or leave a field to apply; arrow keys change a value by 0.5.";

function Dimensions({
  m,
  n,
  onChange,
}: {
  m: number;
  n: number;
  onChange: (m: number, n: number) => void;
}) {
  return (
    <details className="disclosure matrix-size">
      <summary>
        Matrix size · {m} × {n}
      </summary>
      <div className="dimensions">
        <label>
          Input coordinates — columns
          <select
            aria-label="Columns: input dimension"
            value={n}
            onChange={(e) => onChange(m, Number(e.target.value))}
          >
            {[1, 2, 3].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Output coordinates — rows
          <select
            aria-label="Rows: output dimension"
            value={m}
            onChange={(e) => onChange(Number(e.target.value), n)}
          >
            {[1, 2, 3].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <p>
        Changing size restores a matching identity, coordinate-inclusion, or
        coordinate-drop example and resets the inputs.
      </p>
    </details>
  );
}

function Stats({ matrix, symbol }: { matrix: Matrix; symbol: string }) {
  const r = rank(matrix),
    d = determinant(matrix);
  return (
    <div className="stats" aria-live="polite">
      <div>
        <span>Rank {symbol}</span>
        <strong data-testid="rank">{r}</strong>
        <small>
          Number of independent output directions. Outputs lie in{" "}
          {
            ["the origin only", "a line", "a plane", "three-dimensional space"][
              r
            ]
          }
          .
        </small>
      </div>
      <div>
        <span>Determinant {symbol}</span>
        <strong data-testid="determinant">
          {d === null ? "Not defined" : d.toString()}
        </strong>
        <small>
          {d === null
            ? "A determinant is defined only for a square matrix: the same number of rows and columns."
            : d.zero
              ? "The transformation collapses a dimension, so the length, area, or volume in the original dimension becomes zero."
              : `The ${["", "length", "area", "volume"][matrix.length]} multiplier is ${d.n < 0n ? d.neg() : d}. ${d.n < 0n ? "The negative sign means orientation is reversed, as in a reflection." : "The positive sign means orientation is preserved."}`}
        </small>
      </div>
    </div>
  );
}

function Properties({
  matrix,
  symbol,
  onSpan,
}: {
  matrix: Matrix;
  symbol: string;
  onSpan: (value: boolean) => void;
}) {
  const [open, setOpen] = useState(false),
    [span, setSpan] = useState(false);
  useEffect(() => {
    onSpan(false);
    return () => onSpan(false);
  }, [onSpan]);
  return (
    <details
      className="disclosure properties"
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setOpen(next);
        onSpan(next && span);
      }}
    >
      <summary>Rank and determinant</summary>
      <Stats matrix={matrix} symbol={symbol} />
      <label className="check-option">
        <input
          type="checkbox"
          checked={span}
          onChange={(e) => {
            setSpan(e.target.checked);
            onSpan(open && e.target.checked);
          }}
        />
        Show full output span
      </label>
      <p>
        The span contains every combination of the matrix’s columns, with
        unrestricted real-number weights. Green shading shows this full span,
        beyond the input values allowed by the controls.
      </p>
    </details>
  );
}

function columnArrows(
  a: Matrix,
  prefix: string,
  onChange?: (j: number, values: number[]) => void,
  basis = false,
): Arrow[] {
  return columns(a).map((value, j) => ({
    id: `column-${j}`,
    label: `${prefix}${"₁₂₃"[j]}`,
    name: `${basis ? "Basis arrow" : "Column"} ${j + 1}`,
    value,
    color: COLORS[j],
    onChange: onChange ? (values) => onChange(j, values) : undefined,
  }));
}

function Combination({
  a,
  x,
  symbol = "A",
  input = "x",
  basis = false,
}: {
  a: Matrix;
  x: Vector;
  symbol?: string;
  input?: string;
  basis?: boolean;
}) {
  const y = multiplyVector(a, x);
  const terms = columns(a).map(
    (c, j) =>
      `${x[j].n < 0n ? `\\left(${x[j].tex()}\\right)` : x[j].tex()}\\,\\textcolor{${COLORS[j]}}{${texVector(c)}}`,
  );
  const title = basis
    ? "Reconstructing the vector"
    : "Calculating the output vector";
  return (
    <section className="equation-card calculation" aria-label={title}>
      <h3>{title}</h3>
      <p>
        {basis
          ? "Multiply each basis arrow by its calculated coordinate, then add to recover v."
          : "Multiply each column by the corresponding input coordinate, then add."}
      </p>
      <MathText
        block
        tex={`${basis ? "v" : symbol + input}=${terms.join("+")}=${texVector(y)}`}
      />
      {!basis && (
        <p className="notation-note">
          <MathText tex={`${symbol}${input}`} /> means the output obtained by
          applying {symbol === "A" ? "A" : symbol === "A^{-1}" ? "A⁻¹" : "Aᵀ"}{" "}
          to input {input}.
        </p>
      )}
    </section>
  );
}

function TransposeReadout({ a }: { a: Matrix }) {
  const [cell, setCell] = useState<[number, number]>([0, 0]);
  return (
    <section className="transpose-readout" aria-label="Transpose entries">
      <h3>Rows of A become columns of Aᵀ</h3>
      <p>Select a number to see its matching position in the other matrix.</p>
      <div className="transpose-pair">
        {[a, transpose(a)].map((m, side) => (
          <div key={side}>
            <b>{side ? "Transpose Aᵀ" : "Original A"}</b>
            <div
              className="readout-matrix"
              style={{ gridTemplateColumns: `repeat(${m[0].length}, 1fr)` }}
            >
              {m.flatMap((row, i) =>
                row.map((q, j) => {
                  const selected =
                    cell[0] === (side ? j : i) && cell[1] === (side ? i : j);
                  return (
                    <button
                      key={`${i}-${j}`}
                      className={selected ? "highlighted" : ""}
                      aria-label={`${side ? "transpose" : "original"} entry row ${i + 1} column ${j + 1}`}
                      aria-pressed={selected}
                      onClick={() => setCell(side ? [j, i] : [i, j])}
                    >
                      {q.toString()}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Matrices({ s, dispatch }: Props) {
  const [showColumns, setShowColumns] = useState(false),
    [showUnit, setShowUnit] = useState(false),
    [showSpan, setShowSpan] = useState(false);
  const a = fromNumbers(s.a),
    m = a.length,
    n = a[0].length;
  const {
    matrix: shown,
    symbol,
    label,
    input,
    column,
    unavailable,
  } = operationView(a, s.operation);
  const isInverse = s.operation === "inverse",
    isTranspose = s.operation === "transpose";
  const inputValues = isTranspose ? s.transposeX : isInverse ? s.inverseY : s.x;
  const x = vector(inputValues),
    y = shown ? multiplyVector(shown, x) : null;
  const patch = (value: Partial<State>) => dispatch({ type: "patch", value });
  const changeInput = (values: number[]) =>
    patch(
      isTranspose
        ? { transposeX: values }
        : isInverse
          ? { inverseY: values }
          : { x: values },
    );
  const choices = presets(m, n),
    preset = choices.find((p) => p.id === selectedPreset(choices, s.a));
  const unitName = [
    "",
    "a length-1 interval",
    "a 1 × 1 square",
    "a 1 × 1 × 1 cube",
  ][shown?.[0].length ?? n];
  return (
    <div className="workspace">
      <aside className="controls panel" id="matrix-controls" tabIndex={-1}>
        <h2>{s.operation === "original" ? "Matrix A" : "Original matrix A"}</h2>
        <label className="select-label">
          Example
          <select
            aria-label="Named matrix example"
            value={selectedPreset(choices, s.a)}
            onChange={(e) => {
              const p = choices.find((p) => p.id === e.target.value);
              if (p) patch({ a: p.values });
            }}
          >
            <option value="custom" disabled>
              Custom matrix
            </option>
            {choices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <MatrixEditor values={s.a} name="A" onChange={(a) => patch({ a })} />
        {s.operation !== "original" && preset?.description && (
          <p className="example-description">{preset.description}</p>
        )}
        <details className="disclosure">
          <summary>Editing values</summary>
          <p>{EDIT_HELP}</p>
        </details>
        <Dimensions
          m={m}
          n={n}
          onChange={(m, n) => {
            setShowSpan(false);
            dispatch({ type: "shape", m, n });
          }}
        />
        <details
          className="disclosure operations"
          open={s.operation !== "original" ? true : undefined}
        >
          <summary>Other matrix operations</summary>
          <fieldset className="operation-options">
            <legend>Choose the matrix shown in the plots</legend>
            {(["original", "inverse", "transpose"] as Operation[]).map(
              (op, i) => (
                <label key={op}>
                  <input
                    type="radio"
                    name="matrix-operation"
                    checked={s.operation === op}
                    onChange={() => patch({ operation: op })}
                  />
                  {["A", "Inverse A⁻¹", "Transpose Aᵀ"][i]}
                </label>
              ),
            )}
          </fieldset>
          <p>
            Each operation retains its own input vector. Edit A here to change
            the source matrix.
          </p>
        </details>
      </aside>
      <div className="visual-area" data-operation={s.operation}>
        <a className="mobile-controls-link" href="#matrix-controls">
          Edit matrix or choose an example ↓
        </a>
        {s.operation === "original" && preset?.description && (
          <p>{preset.description}</p>
        )}
        {s.operation !== "original" && (
          <section
            className="operator-summary"
            aria-label="Displayed operation"
          >
            <h2>
              {isInverse
                ? "Inverse transformation"
                : "Transpose transformation"}
            </h2>
            {shown ? (
              <>
                {isInverse ? (
                  <>
                    <p>
                      The inverse reverses A: it maps an output of A back to the
                      input that produced it. These plots apply A⁻¹ to input y.
                    </p>
                    <MathText block tex={`A^{-1}=${texMatrix(shown)}`} />
                  </>
                ) : (
                  <>
                    <p>
                      The transpose exchanges rows and columns. It generally
                      does not undo A. These plots apply Aᵀ to input u.
                    </p>
                    <TransposeReadout key={`${m}-${n}`} a={a} />
                  </>
                )}
              </>
            ) : (
              <p className="notice" role="status">
                {unavailable}
              </p>
            )}
          </section>
        )}
        {shown && y && (
          <>
            <p className="dimension-summary">
              {shown[0].length} input{" "}
              {shown[0].length === 1 ? "number" : "numbers"} → {shown.length}{" "}
              output {shown.length === 1 ? "number" : "numbers"}
            </p>
            <div className="spaces">
              <Space
                key={`in-${shown[0].length}-${s.resetKey}`}
                title="Input vector"
                dimension={shown[0].length}
                controls={
                  <>
                    <VectorEditor
                      name={input}
                      values={inputValues}
                      onChange={changeInput}
                    />
                    <p className="coordinate-hint">
                      Steps of 0.5, from −3 to 3.
                    </p>
                  </>
                }
                arrows={[
                  {
                    id: "input",
                    label: "Input",
                    value: x,
                    color: DARK,
                    onChange: changeInput,
                  },
                ]}
                unit={showUnit ? identity(shown[0].length) : undefined}
                unitLabel={showUnit ? unitName : undefined}
              />
              <Space
                key={`out-${shown.length}-${s.resetKey}`}
                title="Output vector"
                dimension={shown.length}
                controls={
                  <>
                    <div
                      className="vector-editor vector-readout"
                      aria-label="Output coordinates"
                    >
                      {y.map((q, i) => (
                        <div key={i}>
                          <span>{["First", "Second", "Third"][i]}</span>
                          <output>{q.toString()}</output>
                        </div>
                      ))}
                    </div>
                    <p className="coordinate-hint">
                      Calculated results keep exact fractions.
                    </p>
                  </>
                }
                arrows={[
                  ...(showColumns
                    ? columnArrows(
                        shown,
                        column,
                        s.operation === "original"
                          ? (j, values) =>
                              patch({
                                a: s.a.map((row, i) =>
                                  row.map((v, k) => (k === j ? values[i] : v)),
                                ),
                              })
                          : undefined,
                      )
                    : []),
                  { id: "output", label: "Output", value: y, color: DARK },
                ]}
                span={showSpan ? shown : undefined}
                unit={showUnit ? shown : undefined}
                unitLabel={
                  showUnit
                    ? `the result of transforming ${unitName} with ${label}`
                    : undefined
                }
                description={
                  showColumns
                    ? s.operation === "original"
                      ? "Drag a colored column endpoint to edit the matrix. The output is calculated."
                      : `Columns of ${label} are calculated from A and are read-only.`
                    : undefined
                }
              />
            </div>
            <div className="display-options">
              <label className="check-option">
                <input
                  type="checkbox"
                  checked={showColumns}
                  onChange={(e) => setShowColumns(e.target.checked)}
                />
                Show columns and calculation
              </label>
              <label className="check-option">
                <input
                  type="checkbox"
                  checked={showUnit}
                  onChange={(e) => setShowUnit(e.target.checked)}
                />
                Show {unitName}
              </label>
            </div>
            {showUnit && (
              <p className="view-explanation">
                The gold shape on the input plot is {unitName}. The output plot
                shows what {label} does to that shape.
              </p>
            )}
            {showColumns && (
              <>
                <p className="view-explanation">
                  Each colored arrow is one column of {label}. The input numbers
                  tell you how much of each column to add. An input with 1 in
                  one coordinate and 0 in the others produces the corresponding
                  column.
                </p>
                <Combination a={shown} x={x} symbol={symbol} input={input} />
              </>
            )}
            <Properties
              key={`${s.operation}-${m}-${n}`}
              matrix={shown}
              symbol={label}
              onSpan={setShowSpan}
            />
            {isInverse && (
              <details className="disclosure">
                <summary>Check that the inverse reverses A</summary>
                <section aria-label="Inverse check">
                  <p>
                    Apply A to this inverse’s output to recover its input y.
                  </p>
                  <MathText
                    block
                    tex={`A(A^{-1}y)=A${texVector(y)}=${texVector(multiplyVector(a, y))}=y`}
                  />
                  <p data-testid="inverse-recovered">
                    Recovered y = {coordinates(multiplyVector(a, y))}
                  </p>
                </section>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Bases({ s, dispatch }: Props) {
  const [grid, setGrid] = useState(false),
    [plot, setPlot] = useState(false),
    [span, setSpan] = useState(false);
  const b = fromNumbers(s.b),
    v = vector(s.v),
    c = basisCoordinates(b, v),
    d = b.length;
  const patch = (value: Partial<State>) => dispatch({ type: "patch", value });
  const choices = basisPresets(d);
  return (
    <div className="workspace">
      <aside className="controls panel" id="basis-controls" tabIndex={-1}>
        <h2>Reference arrows</h2>
        <label className="select-label">
          Example
          <select
            aria-label="Named basis example"
            value={selectedPreset(choices, s.b)}
            onChange={(e) => {
              const p = choices.find((p) => p.id === e.target.value);
              if (p) patch({ b: p.values });
            }}
          >
            <option value="custom" disabled>
              Custom arrows
            </option>
            {choices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <p>
          Each column of B is a reference arrow. Editing B holds the vector v
          fixed.
        </p>
        <MatrixEditor values={s.b} name="B" onChange={(b) => patch({ b })} />
        <details className="disclosure">
          <summary>Editing values</summary>
          <p>{EDIT_HELP}</p>
        </details>
        <details className="disclosure basis-size">
          <summary>Number of coordinates · {d}</summary>
          <label>
            Coordinates
            <select
              aria-label="Basis dimension"
              value={d}
              onChange={(e) =>
                dispatch({ type: "basisDimension", d: Number(e.target.value) })
              }
            >
              {[1, 2, 3].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
          </label>
          <p>
            Changing dimension restores the usual coordinate arrows and resets
            v.
          </p>
        </details>
      </aside>
      <div className="visual-area">
        <a className="mobile-controls-link" href="#basis-controls">
          Edit reference arrows or choose an example ↓
        </a>
        <div className="spaces basis-spaces">
          <Space
            key={`basis-${d}-${s.resetKey}`}
            title="Vector and reference arrows"
            dimension={d}
            controls={
              <>
                <VectorEditor
                  name="v"
                  values={s.v}
                  onChange={(v) => patch({ v })}
                />
                <p className="coordinate-hint">
                  Edit vector v · steps of 0.5, from −3 to 3.
                </p>
              </>
            }
            span={span ? b : undefined}
            gridBasis={grid && c ? b : undefined}
            arrows={[
              ...columnArrows(
                b,
                "b",
                (j, values) =>
                  patch({
                    b: s.b.map((row, i) =>
                      row.map((value, k) => (k === j ? values[i] : value)),
                    ),
                  }),
                true,
              ),
              {
                id: "target",
                label: "v",
                name: "Vector v",
                value: v,
                color: DARK,
                onChange: (v) => patch({ v }),
              },
            ]}
            description={
              grid && c
                ? "Dashed lines follow the chosen reference arrows. Gray axes use the usual coordinates."
                : "Move a reference arrow to change the basis. Move v to choose a different vector."
            }
          />
          <section
            className="coordinate-result panel"
            aria-label="Coordinates of the same vector"
          >
            <h2>Coordinates of the same vector</h2>
            <p className="result-badge">Calculated · read-only</p>
            <table className="coordinate-table">
              <thead>
                <tr>
                  <th scope="col">Using</th>
                  <th scope="col">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">The usual axes</th>
                  <td data-testid="standard-coordinates">{coordinates(v)}</td>
                </tr>
                <tr>
                  <th scope="row">The chosen basis</th>
                  <td data-testid="basis-coordinates">
                    {c ? coordinates(c) : "Unavailable"}
                  </td>
                </tr>
              </tbody>
            </table>
            {c ? (
              <>
                <p>
                  These numbers describe the same vector using different
                  reference arrows. Edit B or v to change the calculation.
                </p>
                <Combination a={b} x={c} basis />
              </>
            ) : (
              <div className="notice" role="status">
                <strong>Not a basis</strong>
                <p>
                  These arrows cannot describe every vector uniquely in {d}{" "}
                  {d === 1 ? "dimension" : "dimensions"}. Choose another example
                  or move the reference arrows.
                </p>
              </div>
            )}
          </section>
        </div>
        <div className="display-options">
          <label className="check-option">
            <input
              type="checkbox"
              checked={grid && !!c}
              disabled={!c}
              onChange={(e) => setGrid(e.target.checked)}
            />
            Show basis grid
          </label>
        </div>
        {c && (
          <details
            className="disclosure"
            open={plot}
            onToggle={(e) => setPlot(e.currentTarget.open)}
          >
            <summary>Plot the coordinate values</summary>
            <p>
              This plot places the calculated coordinates on separate axes. It
              represents the numbers in the table; the geometric vector v
              remains in the first plot.
            </p>
            {plot && (
              <Space
                key={`coord-${d}-${s.resetKey}`}
                title="Calculated basis coordinates"
                dimension={d}
                axisLabels={["c₁", "c₂", "c₃"]}
                arrows={[
                  {
                    id: "coordinates",
                    label: "c",
                    name: "Basis coordinates",
                    value: c,
                    color: GREEN,
                  },
                ]}
                description="Read-only coefficients: how much of each reference arrow to add. Calculated fractions are not snapped."
              />
            )}
          </details>
        )}
        <Properties key={d} matrix={b} symbol="B" onSpan={setSpan} />
      </div>
    </div>
  );
}

export function OLS({ s, dispatch }: Props) {
  const y = vector(s.y),
    fit = ols(y);
  return (
    <section className="ols-panel" aria-label="OLS example">
      <h2>Regression example (OLS)</h2>
      <p>
        The three observed outcomes form one vector. The shaded plane contains
        the fitted values obtainable from a model with an intercept and one
        predictor. Ordinary least squares (OLS) chooses the point on that plane
        closest to the observed vector.
      </p>
      <div className="ols-layout">
        <div className="ols-copy">
          <table className="observation-table">
            <caption>Three observations · edit the outcomes</caption>
            <thead>
              <tr>
                <th scope="col">Observation</th>
                <th scope="col">Predictor</th>
                <th scope="col">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {s.y.map((value, i) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  <td>{i - 1}</td>
                  <td>
                    <NumberInput
                      value={value}
                      revision={s.y}
                      label={`y coordinate ${i + 1}`}
                      onChange={(next) =>
                        dispatch({
                          type: "patch",
                          value: { y: s.y.map((v, j) => (j === i ? next : v)) },
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="input-hint">Outcomes use steps of 0.5 from −3 to 3.</p>
          <dl className="coefficient-list">
            <div>
              <dt>Intercept</dt>
              <dd>{fit.beta[0].toString()}</dd>
            </div>
            <div>
              <dt>Slope</dt>
              <dd>{fit.beta[1].toString()}</dd>
            </div>
          </dl>
          <p data-testid="ols-fitted">
            Fitted values ŷ = {coordinates(fit.fitted)}
          </p>
          <p data-testid="ols-residual">
            Residual r = {coordinates(fit.residual)}
          </p>
          <p>
            The residual is observed minus fitted. Its arrow runs from the
            fitted vector to the observed vector and is perpendicular to the
            plane.
          </p>
          <details className="disclosure">
            <summary>Matrix calculation</summary>
            <p>
              The first column of X supplies the intercept; the second contains
              the predictor values. β contains the intercept and slope.
            </p>
            <MathText block tex={`X=${texMatrix(OLS_X)}`} />
            <MathText
              block
              tex={`\\hat\\beta=(X^{\\mathsf T}X)^{-1}X^{\\mathsf T}y=${texVector(fit.beta)}`}
            />
            <p>
              Perpendicularity means the residual has zero dot product with both
              columns of X:
            </p>
            <MathText
              block
              tex={`X^{\\mathsf T}(y-\\hat y)=${texVector(multiplyVector(transpose(OLS_X), fit.residual))}`}
            />
          </details>
        </div>
        <Space
          key={s.resetKey}
          title="Observed and fitted values"
          dimension={3}
          axisLabels={["Observation 1", "Observation 2", "Observation 3"]}
          span={OLS_X}
          spanDescription="The plane contains all fitted vectors Xβ as the intercept and slope vary."
          arrows={[
            {
              id: "response",
              label: "y",
              name: "Observed values",
              value: y,
              color: DARK,
              onChange: (y) => dispatch({ type: "patch", value: { y } }),
            },
            {
              id: "fitted",
              label: "ŷ",
              name: "Fitted values",
              value: fit.fitted,
              color: GREEN,
            },
            {
              id: "residual",
              label: "r",
              name: "Residual: observed minus fitted",
              start: fit.fitted,
              value: fit.residual,
              color: "#905b1d",
              dashed: true,
            },
          ]}
          description="Each axis represents one observation. Coordinates collect the three outcomes into one vector."
        />
      </div>
    </section>
  );
}
