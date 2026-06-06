class _FSet<T> implements Iterable<T> {
  private readonly s: ReadonlySet<T>;

  constructor(xs: Iterable<T>) {
    this.s = new Set(xs);
  }

  size(): number {
    return this.s.size;
  }

  [Symbol.iterator]() {
    return this.s[Symbol.iterator]();
  }
}

export type FSet<T> = _FSet<T>;
export const FSet = <T>(...xs: T[]): FSet<T> => new _FSet<T>(xs);
