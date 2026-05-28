import { Seq } from "@/collections/Seq";

export type LazySeq<T> = _LazySeq<T>;
export const LazySeq = <T>(left: T | LazySeq<T>, right: LazySeq<T>): LazySeq<T> => {
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
};

class _LazySeq<T> implements Iterable<T> {
  constructor(private readonly g: () => Generator<T, void, unknown>) {}

  static empty<T>(this: void): LazySeq<T> {
    return new _LazySeq(function* () {});
  }

  static from<T>(this: void, it: Iterable<T>): LazySeq<T> {
    return new _LazySeq(function* () {
      for (const x of it) {
        yield x;
      }
    });
  }

  static generate(this: void, start: number): LazySeq<number>;
  static generate(this: void, start: number, step: number): LazySeq<number>;
  static generate(this: void, start: number, step?: number): LazySeq<number> {
    if (!Number.isSafeInteger(start)) {
      throw new Error(`LazySeq.generate: expected safe integer start, got ${start}`);
    }
    if (step && !Number.isSafeInteger(step)) {
      throw new Error(`LazySeq.generate: expected safe integer or undefined step, got ${step}`);
    }
    return new _LazySeq(function* () {
      for (let i = start; ; i += step ?? 1) {
        yield i;
      }
    });
  }

  drop(n: number): LazySeq<T> {
    if (!Number.isSafeInteger(n)) {
      throw new TypeError(`LazySeq.drop: expected safe integer n, got ${n}`);
    }
    if (n < 1) return this;
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < n; ++i) {
        g.next();
      }
      for (const x of g) {
        yield x;
      }
    });
  }

  take(n: number): LazySeq<T> {
    if (!Number.isSafeInteger(n)) {
      throw new TypeError(`LazySeq.take: expected safe integer n, got ${n}`);
    }
    if (n < 1) return LazySeq.empty();
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < n; ++i) {
        const next = g.next();
        if (next.done) return;
        yield next.value;
      }
    });
  }

  toSeq(): Seq<T> {
    return Seq.from(this);
  }

  [Symbol.iterator]() {
    return this.g();
  }
}

LazySeq.empty = _LazySeq.empty;
LazySeq.from = _LazySeq.from;
LazySeq.generate = _LazySeq.generate;
