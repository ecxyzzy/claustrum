/**
 * Represents an immutable, ordered sequence of elements that may be indexed.
 */
export type Seq<T> = _Seq<T>;
export const Seq = <T>(...xs: T[]): Seq<T> => new _Seq(xs);

class _Seq<T> implements Iterable<T> {
  constructor(private readonly xs: readonly T[]) {}

  length(): number {
    return this.xs.length;
  }

  [Symbol.iterator]() {
    return this.xs[Symbol.iterator]();
  }
}
