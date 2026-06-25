import { Filterable } from "@/abc/Filterable";
import { Monad } from "@/abc/Monad";

export abstract class MonadFilter<T> implements Monad<T>, Filterable<T> {
  abstract filter(f: (x: T) => unknown): MonadFilter<T>;
  abstract flatMap<U>(f: (x: T) => MonadFilter<U>): MonadFilter<U>;
  abstract map<U>(f: (x: T) => U): MonadFilter<U>;
  abstract narrow<U extends T>(f: (x: T) => x is U): MonadFilter<U>;
}
