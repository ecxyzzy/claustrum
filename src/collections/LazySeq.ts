import { Seq } from "@/collections/Seq";
import { RichInt } from "@/numeric/RichInt";
import type { SafeInt } from "@/numeric/SafeInt";

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

  static generate(this: void, start: SafeInt): LazySeq<RichInt>;
  static generate(this: void, start: SafeInt, step: SafeInt): LazySeq<RichInt>;
  static generate(this: void, start: SafeInt, step?: SafeInt): LazySeq<RichInt> {
    return new _LazySeq(function* () {
      for (
        let i = RichInt(start).valueOf();
        ;
        i += step !== undefined ? RichInt(step).valueOf() : 1
      ) {
        yield RichInt(i);
      }
    });
  }

  drop(n: SafeInt): LazySeq<T> {
    const rn = RichInt(n);
    if (rn.valueOf() < 1) return this;
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < rn.valueOf(); ++i) {
        g.next();
      }
      for (const x of g) {
        yield x;
      }
    });
  }

  take(n: SafeInt): LazySeq<T> {
    const rn = RichInt(n);
    if (rn.valueOf() < 1) return LazySeq.empty();
    const g = this.g();
    return new _LazySeq(function* () {
      for (let i = 0; i < rn.valueOf(); ++i) {
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
