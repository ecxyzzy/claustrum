import type { RichInt } from "@/numeric/RichInt";

/**
 * Represents an input where a safe integer is expected. A function or method
 * consuming a SafeInt should throw if it does not receive an integral `number`,
 * such that `-(2 ** 53 - 1) <= n <= (2 ** 53 - 1)`, or a `RichInt` object.
 *
 * For developers: This can be accomplished by passing a `SafeInt` directly into
 * the `RichInt()` constructor.
 */
export type SafeInt = number | RichInt;
