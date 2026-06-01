import type { Awaitable } from "@/types/Awaitable";

/**
 * The abstract base class for other abstractions over deferred computations.
 */
export abstract class Runnable<T> {
  protected constructor(protected readonly task: () => Awaitable<T>) {}

  run(): Awaitable<T> {
    return this.task();
  }
}
