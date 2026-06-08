import { Maybe } from "@/adt/Maybe";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Task } from "@/concurrent/Task";
import type { SafeInt } from "@/numeric";

class _Seq<T> implements Iterable<T> {
  constructor(private readonly xs: readonly T[]) {}

  catMaybes<U>(this: Seq<Maybe<U>>): Seq<U> {
    return Seq.from(this.xs.filter(Maybe.isJust).map(Maybe.unwrap));
  }

  drop(n: SafeInt): Seq<T> {
    return Seq.from(this.xs.slice(n.valueOf()));
  }

  filter(f: (x: T) => unknown): Seq<T> {
    return Seq.from(this.xs.filter(f));
  }

  find(f: (x: T) => unknown): Maybe<T> {
    return Maybe(this.xs.find(f));
  }

  join(separator?: string): string {
    return this.xs.join(separator);
  }

  length(): number {
    return this.xs.length;
  }

  map<U>(f: (x: T) => U): Seq<U> {
    return Seq.from(this.xs.map(f));
  }

  take(n: SafeInt): Seq<T> {
    return Seq.from(this.xs.slice(0, n.valueOf()));
  }

  traverseTask<U>(f: (x: T) => Awaitable<U>): Task<Seq<U>> {
    const xs = this.xs;
    return Task(async () => {
      const ys: U[] = [];
      for (const x of xs) {
        ys.push(await f(x));
      }
      return Seq.from(ys);
    });
  }

  toSorted(compareFn?: (a: T, b: T) => number): Seq<T> {
    return Seq.from(this.xs.toSorted(compareFn));
  }

  [Symbol.iterator]() {
    return this.xs[Symbol.iterator]();
  }
}

type Seq_constructor = {
  <T>(...xs: T[]): Seq<T>;
};

type Seq_static = {
  catMaybes<T>(s: Seq<Maybe<T>>): Seq<T>;
  from<T>(this: void, it: Iterable<T>): Seq<T>;
};

type Seq_typeof = Seq_constructor & Seq_static;

/**
 * Represents an immutable, ordered sequence of elements that may be indexed.
 */
export type Seq<T> = _Seq<T>;
export const Seq: Seq_typeof = Object.assign<Seq_constructor, Seq_static>((...xs) => new _Seq(xs), {
  catMaybes: s => s.catMaybes(),
  from: it => new _Seq([...it]),
});
