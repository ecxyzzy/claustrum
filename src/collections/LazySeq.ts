import { Seq } from "@/collections/Seq";
import { RichInt } from "@/numeric/RichInt";
import type { SafeInt } from "@/numeric/SafeInt";

class _LazySeq<T> implements Iterable<T> {
  constructor(private readonly g: () => Generator<T, void, unknown>) {}

  static generate(this: void, start: SafeInt): LazySeq<RichInt>;
  static generate(this: void, start: SafeInt, step: SafeInt): LazySeq<RichInt>;
  static generate(this: void, start: SafeInt, step?: SafeInt): LazySeq<RichInt> {
    const startVal = RichInt(start).valueOf();
    const stepVal = step !== undefined ? RichInt(step).valueOf() : 1;
    return new _LazySeq(function* () {
      for (let i = startVal; ; i += stepVal) {
        yield RichInt(i);
      }
    });
  }

  drop(n: SafeInt): LazySeq<T> {
    const nVal = RichInt(n).valueOf();
    if (nVal < 1) return this;
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < nVal; ++i) {
        g.next();
      }
      for (const x of g) {
        yield x;
      }
    });
  }

  map<U>(f: (x: T) => U): LazySeq<U> {
    const g = this.g();
    return new _LazySeq(function* () {
      for (const x of g) {
        yield f(x);
      }
    });
  }

  tail(): LazySeq<T> {
    return this.drop(1);
  }

  take(n: SafeInt): LazySeq<T> {
    const nVal = RichInt(n).valueOf();
    if (nVal < 1) return LazySeq.empty();
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < nVal; ++i) {
        const next = g.next();
        if (next.done) return;
        yield next.value;
      }
    });
  }

  zip<U>(that: Iterable<U>): LazySeq<[T, U]> {
    const thisIt = this[Symbol.iterator]();
    const thatIt = that[Symbol.iterator]();
    return new _LazySeq(function* () {
      let thisEl = thisIt.next();
      let thatEl = thatIt.next();
      while (!thisEl.done && !thatEl.done) {
        yield [thisEl.value, thatEl.value];
        thisEl = thisIt.next();
        thatEl = thatIt.next();
      }
    });
  }

  toSeq(): Seq<T> {
    return Seq.from(this);
  }

  [Symbol.iterator](): Iterator<T, void, unknown> {
    return this.g();
  }
}

type LazySeq_constructor = {
  <T>(left: T | LazySeq<T>, right: LazySeq<T>): LazySeq<T>;
};

type LazySeq_static = {
  empty<T>(this: void): LazySeq<T>;
  from<T>(this: void, it: Iterable<T>): LazySeq<T>;
  generate: typeof _LazySeq.generate;
};

type LazySeq_typeof = LazySeq_constructor & LazySeq_static;

/**
 * Represents an immutable, ordered sequence whose elements are computed only
 * when needed. `LazyList`s may be infinite; certain methods may not terminate
 * if called on an infinite `LazyList`.
 */
export type LazySeq<T> = _LazySeq<T>;
export const LazySeq: LazySeq_typeof = Object.assign<LazySeq_constructor, LazySeq_static>(
  (left, right) => {
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
  },
  {
    empty: () => new _LazySeq(function* () {}),
    from: it =>
      new _LazySeq(function* () {
        for (const x of it) {
          yield x;
        }
      }),
    generate: _LazySeq.generate,
  },
);
