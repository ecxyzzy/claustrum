import type { Sequence } from "@/abc/Sequence";
import { Maybe, Nothing } from "@/adt";
import { Arr } from "@/collections/Arr";
import { RichInt } from "@/numeric/RichInt";
import type { SafeInt } from "@/numeric/SafeInt";

class _LazyList<T> implements Sequence<T> {
  constructor(private readonly g: () => Generator<T, void, unknown>) {}

  static generate(this: void, start: SafeInt): LazyList<RichInt>;
  static generate(this: void, start: SafeInt, step: SafeInt): LazyList<RichInt>;
  static generate(this: void, start: SafeInt, step?: SafeInt): LazyList<RichInt> {
    const startVal = RichInt(start).valueOf();
    const stepVal = step !== undefined ? RichInt(step).valueOf() : 1;
    return new _LazyList(function* () {
      for (let i = startVal; ; i += stepVal) {
        yield RichInt(i);
      }
    });
  }

  drop(n: SafeInt): LazyList<T> {
    const nVal = RichInt(n).valueOf();
    if (nVal < 1) return this;
    const g = this.g();
    return new _LazyList(function* () {
      for (let i = 0; i < nVal; ++i) {
        g.next();
      }
      for (const x of g) {
        yield x;
      }
    });
  }

  filter(f: (x: T) => unknown): LazyList<T> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const x of g) {
        if (f(x)) {
          yield x;
        }
      }
    });
  }

  find(f: (x: T) => unknown): Maybe<T> {
    for (const x of this.g()) {
      if (f(x)) {
        return Maybe(x);
      }
    }
    return Nothing;
  }

  flatMap<U>(f: (x: T) => LazyList<U>): LazyList<U> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const xs of g) {
        for (const x of f(xs)) {
          yield x;
        }
      }
    });
  }

  forEach(f: (x: T) => void) {
    for (const x of this.g()) {
      f(x);
    }
  }

  head(): Maybe<T> {
    const res = this.g().next();
    return res.done ? Nothing : Maybe(res.value);
  }

  map<U>(f: (x: T) => U): LazyList<U> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const x of g) {
        yield f(x);
      }
    });
  }

  narrow<U extends T>(f: (x: T) => x is U): LazyList<U> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const x of g) {
        if (f(x)) {
          yield x;
        }
      }
    });
  }

  reduce<U>(op: (prev: U, curr: T) => U, z: U): U {
    let r = z;
    for (const x of this.g()) {
      r = op(r, x);
    }
    return r;
  }

  size(): number {
    const it = this.g();
    let el = it.next();
    let i = 0;
    while (!el.done) {
      el = it.next();
      ++i;
    }
    return i;
  }

  tail(): LazyList<T> {
    return this.drop(1);
  }

  take(n: SafeInt): LazyList<T> {
    const nVal = RichInt(n).valueOf();
    if (nVal < 1) return LazyList.empty();
    const g = this.g();
    return new _LazyList(function* () {
      for (let i = 0; i < nVal; ++i) {
        const next = g.next();
        if (next.done) return;
        yield next.value;
      }
    });
  }

  zip<U>(that: Iterable<U>): LazyList<[T, U]> {
    const thisIt = this.g();
    const thatIt = that[Symbol.iterator]();
    return new _LazyList(function* () {
      let thisEl = thisIt.next();
      let thatEl = thatIt.next();
      while (!thisEl.done && !thatEl.done) {
        yield [thisEl.value, thatEl.value];
        thisEl = thisIt.next();
        thatEl = thatIt.next();
      }
    });
  }

  toArr(): Arr<T> {
    return Arr.from(this);
  }

  [Symbol.iterator](): Iterator<T> {
    return this.g();
  }
}

type LazyList_constructor = {
  <T>(...xss: (T | LazyList<T>)[]): LazyList<T>;
};

type LazyList_static = {
  empty<T>(this: void): LazyList<T>;
  from<T>(this: void, it: Iterable<T>): LazyList<T>;
  generate: typeof _LazyList.generate;
  /**
   * Ta
   */
  withEmpty<T>(this: void, f: (xs: LazyList<T>) => LazyList<T>): LazyList<T>;
};

type LazyList_typeof = LazyList_constructor & LazyList_static;

/**
 * Represents an immutable list whose elements are computed only when needed.
 * `LazyList`s may be infinite; certain methods may not terminate if called on
 * an infinite `LazyList`.
 */
export type LazyList<T> = _LazyList<T>;
export const LazyList: LazyList_typeof = Object.assign<LazyList_constructor, LazyList_static>(
  (...xss) =>
    new _LazyList(function* () {
      for (const xs of xss) {
        if (xs instanceof _LazyList) {
          for (const x of xs) {
            yield x;
          }
        } else {
          yield xs;
        }
      }
    }),
  {
    empty: () => new _LazyList(function* () {}),
    from: it =>
      new _LazyList(function* () {
        for (const x of it) {
          yield x;
        }
      }),
    generate: _LazyList.generate,
    withEmpty: f => f(LazyList.empty()),
  },
);
