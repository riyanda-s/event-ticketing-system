import { ValueObject } from "../../shared/value-object";

export class BookingId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0)
      throw new Error("BookingId cannot be empty");
    super({ value });
  }
  get value(): string {
    return this.props.value;
  }
  static create(value: string): BookingId {
    return new BookingId(value);
  }
}
