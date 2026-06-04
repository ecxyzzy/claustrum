import type { Maybe } from "@/adt";
import { Runnable } from "@/concurrent/Runnable";
import { TaskMaybe } from "@/concurrent/TaskMaybe";
import type { Awaitable } from "@/types/Awaitable";

/**
 * Represents a deferred computation that may be async.
 */
export type Task<T> = _Task<T>;
export const Task = <T>(f: () => Awaitable<T>): Task<T> => new _Task(f);

class _Task<T> extends Runnable<T> {
  constructor(task: () => Awaitable<T>) {
    super(task);
  }

  flatMap<U>(f: (x: T) => Task<U>): Task<U> {
    return Task(async () => f(await this.task()).run());
  }

  map<U>(f: (x: T) => Awaitable<U>): Task<U> {
    return Task(async () => f(await this.task()));
  }

  liftMaybe<U>(this: Task<Maybe<U>>): TaskMaybe<U> {
    return TaskMaybe(async () => await this.task());
  }
}
