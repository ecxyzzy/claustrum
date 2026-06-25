export abstract class Monad<T> {
  abstract flatMap<U>(f: (x: T) => Monad<U>): Monad<U>;
  abstract map<U>(f: (x: T) => U): Monad<U>;
}
