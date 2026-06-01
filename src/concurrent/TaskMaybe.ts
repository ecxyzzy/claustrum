import { Maybe, Nothing } from "@/adt/Maybe";
import { Runnable } from "@/concurrent/Runnable";
import { Task } from "@/concurrent/Task";
import type { Awaitable } from "@/types/Awaitable";
import type { Nullable } from "@/types/Nullable";

/**
 * Represents a deferred Maybe-bearing computation that may be async. Functorial
 * and monadic operations on this type "reach into" the inner `Maybe` directly.
 *
 * This is the monad transformer `MaybeT<Task, T>`.
 */
export type TaskMaybe<T> = _TaskMaybe<T>;
export const TaskMaybe = <T>(f: () => Awaitable<Maybe<T>>): TaskMaybe<T> => new _TaskMaybe(f);

class _TaskMaybe<T> extends Runnable<Maybe<T>> {
  constructor(task: () => Awaitable<Maybe<T>>) {
    super(task);
  }

  flatMap<U>(f: (x: T) => TaskMaybe<U>): TaskMaybe<U> {
    return TaskMaybe(async () => {
      const res = await this.task();
      return res.isJust() ? f(res.unwrap()).run() : Nothing;
    });
  }

  map<U>(f: (x: T) => Awaitable<Nullable<U>>): TaskMaybe<U> {
    return TaskMaybe(async () => {
      const res = await this.task();
      return res.isJust() ? Maybe(await f(res.unwrap())) : Nothing;
    });
  }

  unlift(): Task<Maybe<T>> {
    return Task(this.task);
  }
}
