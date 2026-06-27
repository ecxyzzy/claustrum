import { Sequence } from "@/abc/Sequence";
import { Maybe, Nothing } from "@/adt";
import { Arr } from "@/collections/Arr";
import { RichInt } from "@/numeric/RichInt";
import type { SafeInt } from "@/numeric/SafeInt";

class _LazyList<T> extends Sequence<T> {
  constructor(private readonly g: () => Generator<T, void, unknown>) {
    super();
  }

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

  catMaybes(this: LazyList<Maybe<T>>): LazyList<NonNullable<T>> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const mx of g) {
        for (const x of mx) {
          yield x;
        }
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

  every<U extends T>(f: (x: T) => x is U): this is LazyList<U>;
  every(f: (x: T) => unknown): boolean {
    for (const x of this.g()) {
      if (!f(x)) {
        return false;
      }
    }
    return true;
  }

  filter<U extends T>(f: (x: T) => x is U): LazyList<U>;
  filter(f: (x: T) => unknown): LazyList<T>;
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

  join(separator?: string): string {
    return [...this.g()].join(separator);
  }

  map<U>(f: (x: T) => U): LazyList<U> {
    const g = this.g();
    return new _LazyList(function* () {
      for (const x of g) {
        yield f(x);
      }
    });
  }

  reduce<U>(op: (prev: U, curr: T) => U, z: U): U {
    return [...this.g()].reduce(op, z);
  }

  size(): number {
    return [...this.g()].length;
  }

  some(f: (x: T) => unknown): boolean {
    for (const x of this.g()) {
      if (f(x)) {
        return true;
      }
    }
    return false;
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

  zip<T1>(that: Iterable<T1>): LazyList<[T, T1]>;
  zip<T1, T2>(that: Iterable<T1>, that2: Iterable<T2>): LazyList<[T, T1, T2]>;
  zip<T1, T2, T3>(
    that: Iterable<T1>,
    that2: Iterable<T2>,
    that3: Iterable<T3>,
  ): LazyList<[T, T1, T2, T3]>;
  zip(...thats: Iterable<unknown>[]): LazyList<unknown[]> {
    const iters = [this[Symbol.iterator](), ...thats.map(that => that[Symbol.iterator]())];
    return new _LazyList(function* () {
      for (
        let els = iters.map(iter => iter.next());
        els.every(el => !el.done);
        els = iters.map(iter => iter.next())
      ) {
        yield els.map(el => el.value);
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
  fromIter<T>(this: void, iter: IterableIterator<T>): LazyList<T>;
  generate: typeof _LazyList.generate;
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
    fromIter: iter =>
      new _LazyList(function* () {
        for (const x of iter) {
          yield x;
        }
      }),
    generate: _LazyList.generate,
  },
);
