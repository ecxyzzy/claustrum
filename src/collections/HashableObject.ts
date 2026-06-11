export abstract class HashableObject {
  abstract hashCode(): number;
  abstract equals(that: unknown): boolean;
}
