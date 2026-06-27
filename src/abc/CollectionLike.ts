import { Enumerable } from "@/abc/Enumerable";
import type { Maybe } from "@/adt";

export abstract class CollectionLike<T> extends Enumerable<T> {
  abstract every<U extends T>(f: (x: T) => x is U): this is CollectionLike<U>;
  abstract every(f: (x: T) => unknown): boolean;
  abstract find(f: (x: T) => unknown): Maybe<T>;
  abstract flatMap<U>(f: (x: T) => CollectionLike<U>): CollectionLike<U>;
  abstract map<U>(f: (x: T) => U): CollectionLike<U>;
  abstract size(): number;
  abstract some(f: (x: T) => unknown): boolean;
}
