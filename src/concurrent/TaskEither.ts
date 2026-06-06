import { type Either, Left } from "@/adt/Either";
import type { Awaitable } from "@/concurrent/Awaitable";
import { Runnable } from "@/concurrent/Runnable";
import { Task } from "@/concurrent/Task";

class _TaskEither<L, R> extends Runnable<Either<L, R>> {
  constructor(task: () => Awaitable<Either<L, R>>) {
    super(task);
  }

  flatMap<S>(f: (x: R) => TaskEither<L, S>): TaskEither<L, S> {
    return new _TaskEither(async () => {
      const res = await this.task();
      return res.isRight() ? f(res.unwrap()).run() : Left(res.swap().unwrap());
    });
  }

  unlift(): Task<Either<L, R>> {
    return Task(async () => await this.task());
  }
}

/**
 * Represents a deferred Either-bearing computation that may be async.
 * Functorial and monadic operations on this type "reach into" the inner
 * `Either` directly.
 *
 * This is the monad transformer `EitherT<Task, L, R>`.
 */
export type TaskEither<L, R> = _TaskEither<L, R>;
export const TaskEither = <L, R>(f: () => Awaitable<Either<L, R>>): TaskEither<L, R> =>
  new _TaskEither(f);
