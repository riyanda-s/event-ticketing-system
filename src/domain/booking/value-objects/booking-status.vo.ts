import { ValueObject } from "../../shared/value-object";

export enum BookingStatusEnum {
  PENDING_PAYMENT = "PendingPayment",
  PAID = "Paid",
  EXPIRED = "Expired",
  REFUNDED = "Refunded",
}

export class BookingStatus extends ValueObject<{ value: BookingStatusEnum }> {
  constructor(value: BookingStatusEnum) {
    super({ value });
  }
  get value(): BookingStatusEnum {
    return this.props.value;
  }
  static pendingPayment(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.PENDING_PAYMENT);
  }
  static paid(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.PAID);
  }
  static expired(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.EXPIRED);
  }
  static refunded(): BookingStatus {
    return new BookingStatus(BookingStatusEnum.REFUNDED);
  }
  isPendingPayment(): boolean {
    return this.props.value === BookingStatusEnum.PENDING_PAYMENT;
  }
  isPaid(): boolean {
    return this.props.value === BookingStatusEnum.PAID;
  }
  isExpired(): boolean {
    return this.props.value === BookingStatusEnum.EXPIRED;
  }
  isRefunded(): boolean {
    return this.props.value === BookingStatusEnum.REFUNDED;
  }
}
