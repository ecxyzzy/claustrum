export abstract class Foldable<T> implements Iterable<T> {
  abstract forEach(f: (x: T) => void): void;
  abstract reduce<U>(op: (prev: U, curr: T) => U, z: U): U;
  abstract [Symbol.iterator](): Iterator<T>;
}
