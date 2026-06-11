import { type Maybe, Just, Nothing } from "@/adt/Maybe";
import type { HashableObject } from "@/collections/HashableObject";
import type { SafeInt } from "@/numeric/SafeInt";

class _RichInt implements HashableObject {
  constructor(private readonly n: number) {}

  valueOf(): number {
    return this.n;
  }

  hashCode(): number {
    return this.n;
  }

  equals(that: unknown): boolean {
    return that instanceof _RichInt && this.valueOf() === that.valueOf();
  }
}

type RichInt_constructor = {
  (n: SafeInt): RichInt;
};

type RichInt_static = {
  from(this: void, n: number): Maybe<RichInt>;
};

type RichInt_typeof = RichInt_constructor & RichInt_static;

/**
 * A wrapper around a `number` that is guaranteed to be a safe integer.
 */
export type RichInt = _RichInt;
export const RichInt: RichInt_typeof = Object.assign<RichInt_constructor, RichInt_static>(
  n => {
    if (n instanceof _RichInt) {
      return n;
    }
    if (!Number.isSafeInteger(n)) {
      throw new TypeError(`Expected safe integer, got ${n}`);
    }
    return new _RichInt(n);
  },
  {
    from: n => (Number.isSafeInteger(n) ? Just(new _RichInt(n)) : Nothing),
  },
);
