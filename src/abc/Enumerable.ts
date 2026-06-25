import { Foldable } from "@/abc/Foldable";
import { MonadFilter } from "@/abc/MonadFilter";

export abstract class Enumerable<T> implements MonadFilter<T>, Foldable<T> {
  abstract filter(f: (x: T) => unknown): Enumerable<T>;
  abstract flatMap<U>(f: (x: T) => Enumerable<U>): Enumerable<U>;
  abstract forEach(f: (x: T) => void): void;
  abstract map<U>(f: (x: T) => U): Enumerable<U>;
  abstract narrow<U extends T>(f: (x: T) => x is U): Enumerable<U>;
  abstract reduce<U>(op: (prev: U, curr: T) => U, z: U): U;
  abstract [Symbol.iterator](): Iterator<T>;
}
