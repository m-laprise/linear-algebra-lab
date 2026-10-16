/** Reduced fractions. All algebra stays exact; only drawing uses toNumber(). */
export class Q {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    let a = BigInt(n),
      b = BigInt(d);
    if (b === 0n) throw new Error("Zero denominator");
    if (b < 0n) {
      a = -a;
      b = -b;
    }
    let x = a < 0n ? -a : a,
      y = b;
    while (y) [x, y] = [y, x % y];
    this.n = a / x;
    this.d = b / x;
  }
  static half(value: number): Q {
    if (!Number.isFinite(value) || !Number.isInteger(value * 2))
      throw new Error("Expected a half integer");
    return new Q(value * 2, 2);
  }
  add(q: Q) {
    return new Q(this.n * q.d + q.n * this.d, this.d * q.d);
  }
  sub(q: Q) {
    return this.add(q.neg());
  }
  mul(q: Q) {
    return new Q(this.n * q.n, this.d * q.d);
  }
  div(q: Q) {
    if (q.n === 0n) throw new Error("Division by zero");
    return new Q(this.n * q.d, this.d * q.n);
  }
  neg() {
    return new Q(-this.n, this.d);
  }
  get zero() {
    return this.n === 0n;
  }
  equals(q: Q) {
    return this.n === q.n && this.d === q.d;
  }
  toNumber() {
    return Number(this.n) / Number(this.d);
  }
  toString() {
    return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`;
  }
  tex() {
    return this.d === 1n
      ? `${this.n}`
      : `${this.n < 0n ? "-" : ""}\\frac{${this.n < 0n ? -this.n : this.n}}{${this.d}}`;
  }
}
export const ZERO = new Q(0),
  ONE = new Q(1);
