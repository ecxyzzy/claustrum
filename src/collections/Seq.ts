import { Maybe } from "@/adt/Maybe";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Task } from "@/concurrent/Task";

class _Seq<T> implements Iterable<T> {
  constructor(private readonly xs: readonly T[]) {}

  catMaybes<U>(this: Seq<Maybe<U>>): Seq<U> {
    return Seq.from(this.xs.filter(Maybe.isJust).map(Maybe.unwrap));
  }

  filter(f: (x: T) => unknown): Seq<T> {
    return Seq.from(this.xs.filter(f));
  }

  find(f: (x: T) => unknown): Maybe<T> {
    return Maybe(this.xs.find(f));
  }

  length(): number {
    return this.xs.length;
  }

  map<U>(f: (x: T) => U): Seq<U> {
    return Seq.from(this.xs.map(f));
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
