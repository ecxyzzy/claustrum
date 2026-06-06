class _Seq<T> implements Iterable<T> {
  constructor(private readonly xs: readonly T[]) {}

  static from<T>(this: void, it: Iterable<T>): Seq<T> {
    return new _Seq([...it]);
  }

  length(): number {
    return this.xs.length;
  }

  [Symbol.iterator]() {
    return this.xs[Symbol.iterator]();
  }
}

type Seq_constructor = {
  <T>(...xs: T[]): Seq<T>;
};

type Seq_static = {
  from<T>(this: void, it: Iterable<T>): Seq<T>;
};

type Seq_typeof = Seq_constructor & Seq_static;

/**
 * Represents an immutable, ordered sequence of elements that may be indexed.
 */
export type Seq<T> = _Seq<T>;
export const Seq: Seq_typeof = Object.assign<Seq_constructor, Seq_static>((...xs) => new _Seq(xs), {
  from: it => new _Seq([...it]),
});
