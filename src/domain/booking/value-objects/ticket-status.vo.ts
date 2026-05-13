import { ValueObject } from "../../shared/value-object";

export enum TicketStatusEnum {
  ACTIVE = "Active",
  CHECKED_IN = "CheckedIn",
  CANCELLED = "Cancelled",
}

export class TicketStatus extends ValueObject<{ value: TicketStatusEnum }> {
  constructor(value: TicketStatusEnum) {
    super({ value });
  }
  get value(): TicketStatusEnum {
    return this.props.value;
  }
  static active(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.ACTIVE);
  }
  static checkedIn(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.CHECKED_IN);
  }
  static cancelled(): TicketStatus {
    return new TicketStatus(TicketStatusEnum.CANCELLED);
  }
  isActive(): boolean {
    return this.props.value === TicketStatusEnum.ACTIVE;
  }
  isCheckedIn(): boolean {
    return this.props.value === TicketStatusEnum.CHECKED_IN;
  }
  isCancelled(): boolean {
    return this.props.value === TicketStatusEnum.CANCELLED;
  }
}
