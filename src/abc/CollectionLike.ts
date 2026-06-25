import { Enumerable } from "@/abc/Enumerable";
import type { Maybe } from "@/adt";

export abstract class CollectionLike<T> extends Enumerable<T> {
  abstract find(f: (x: T) => unknown): Maybe<T>;
  abstract size(): number;
}
