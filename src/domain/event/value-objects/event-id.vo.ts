import { ValueObject } from "../../shared/value-object";

interface EventIdProps {
  value: string;
}

export class EventId extends ValueObject<EventIdProps> {
  constructor(value: string) {
    if (!value || value.trim().length === 0)
      throw new Error("EventId cannot be empty");
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): EventId {
    return new EventId(value);
  }

  toString(): string {
    return this.props.value;
  }
}
