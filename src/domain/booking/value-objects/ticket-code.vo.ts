import { ValueObject } from "../../shared/value-object";

export class TicketCode extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0)
      throw new Error("TicketCode cannot be empty");
    super({ value });
  }
  get value(): string {
    return this.props.value;
  }
  static create(value: string): TicketCode {
    return new TicketCode(value);
  }
}
