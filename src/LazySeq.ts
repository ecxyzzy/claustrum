export type LazySeq<T> = _LazySeq<T>;

export function LazySeq<T>(left: T, right: LazySeq<T>): LazySeq<T>;
export function LazySeq<T>(left: LazySeq<T>, right: LazySeq<T>): LazySeq<T>;
export function LazySeq<T>(left: T | LazySeq<T>, right: LazySeq<T>): LazySeq<T> {
  if (left instanceof _LazySeq) {
    return new _LazySeq(function* () {
      for (const x of left) {
        yield x;
      }
      for (const y of right) {
        yield y;
      }
    });
  }
  return new _LazySeq(function* () {
    yield left;
    for (const x of right) {
      yield x;
    }
  });
}

class _LazySeq<T> implements Iterable<T> {
  constructor(private readonly g: () => Generator<T, void, unknown>) {}

  [Symbol.iterator]() {
    return this.g();
  }
}
