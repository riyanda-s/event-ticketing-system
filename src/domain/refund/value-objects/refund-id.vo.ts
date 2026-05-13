import { ValueObject } from "../../shared/value-object";
export class RefundId extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0)
      throw new Error("RefundId cannot be empty");
    super({ value });
  }
  get value(): string {
    return this.props.value;
  }
  static create(value: string): RefundId {
    return new RefundId(value);
  }
}
