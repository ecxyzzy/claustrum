import type { RichInt } from "@/numeric/RichInt";

/**
 * Represents an input where a safe integer is expected. The function may throw
 * if it does not receive an integral `number` or a `RichInt` object.
 */
export type SafeInt = number | RichInt;
