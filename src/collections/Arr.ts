import { Maybe } from "@/adt/Maybe";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Task } from "@/concurrent/Task";
import type { SafeInt } from "@/numeric";

class _Arr<T> implements Iterable<T> {
  constructor(private readonly xs: readonly T[]) {}

  catMaybes<U>(this: Arr<Maybe<U>>): Arr<NonNullable<U>> {
    return Arr.from(this.xs.filter(Maybe.isJust).map(Maybe.unwrap));
  }

  drop(n: SafeInt): Arr<T> {
    return Arr.from(this.xs.slice(n.valueOf()));
  }

  filter(f: (x: T) => unknown): Arr<T> {
    return Arr.from(this.xs.filter(f));
  }

  find(f: (x: T) => unknown): Maybe<T> {
    return Maybe(this.xs.find(f));
  }

  join(this: Arr<string>, separator?: string): string {
    return this.xs.join(separator);
  }

  map<U>(f: (x: T) => U): Arr<U> {
    return Arr.from(this.xs.map(f));
  }

  reduce<U>(op: (prev: U, curr: T) => U, z: U): U {
    return this.xs.reduce(op, z);
  }

  size(): number {
    return this.xs.length;
  }

  take(n: SafeInt): Arr<T> {
    return Arr.from(this.xs.slice(0, n.valueOf()));
  }

  traverseTask<U>(f: (x: T) => Awaitable<U>): Task<Arr<U>> {
    const xs = this.xs;
    return Task(async () => {
      const ys: U[] = [];
      for (const x of xs) {
        ys.push(await f(x));
      }
      return Arr.from(ys);
    });
  }

  toSorted(compareFn?: (a: T, b: T) => number): Arr<T> {
    return Arr.from(this.xs.toSorted(compareFn));
  }

  [Symbol.iterator]() {
    return this.xs[Symbol.iterator]();
  }
}

type Arr_constructor = {
  <T>(...xs: T[]): Arr<T>;
};

type Arr_static = {
  catMaybes<T>(s: Arr<Maybe<T>>): Arr<T>;
  from<T>(this: void, it: Iterable<T>): Arr<T>;
  size<T>(s: Arr<T>): number;
};

type Arr_typeof = Arr_constructor & Arr_static;

/**
 * Represents an immutable array.
 */
export type Arr<T> = _Arr<T>;
export const Arr: Arr_typeof = Object.assign<Arr_constructor, Arr_static>((...xs) => new _Arr(xs), {
  catMaybes: s => s.catMaybes(),
  from: it => new _Arr([...it]),
  size: s => s.size(),
});
