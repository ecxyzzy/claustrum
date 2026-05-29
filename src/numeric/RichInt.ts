import { type Maybe, Just, Nothing } from "@/adt/Maybe";
import type { SafeInt } from "@/numeric/SafeInt";

/**
 * A wrapper around a `number` that is guaranteed to be a safe integer.
 */
export type RichInt = _RichInt;
export const RichInt = (n: SafeInt): RichInt => {
  if (n instanceof _RichInt) {
    return n;
  }
  if (!Number.isSafeInteger(n)) {
    throw new TypeError(`Expected safe integer, got ${n}`);
  }
  return new _RichInt(n);
};

class _RichInt {
  constructor(private readonly n: number) {}

  static from(this: void, n: number): Maybe<RichInt> {
    return Number.isSafeInteger(n) ? Just(new _RichInt(n)) : Nothing;
  }

  valueOf(): number {
    return this.n;
  }
}

RichInt.from = _RichInt.from;
