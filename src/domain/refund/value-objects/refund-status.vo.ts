import { ValueObject } from "../../shared/value-object";
export enum RefundStatusEnum {
  REQUESTED = "Requested",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  PAID_OUT = "PaidOut",
}
export class RefundStatus extends ValueObject<{ value: RefundStatusEnum }> {
  constructor(value: RefundStatusEnum) {
    super({ value });
  }
  get value(): RefundStatusEnum {
    return this.props.value;
  }
  static requested(): RefundStatus {
    return new RefundStatus(RefundStatusEnum.REQUESTED);
  }
  static approved(): RefundStatus {
    return new RefundStatus(RefundStatusEnum.APPROVED);
  }
  static rejected(): RefundStatus {
    return new RefundStatus(RefundStatusEnum.REJECTED);
  }
  static paidOut(): RefundStatus {
    return new RefundStatus(RefundStatusEnum.PAID_OUT);
  }
  isRequested(): boolean {
    return this.props.value === RefundStatusEnum.REQUESTED;
  }
  isApproved(): boolean {
    return this.props.value === RefundStatusEnum.APPROVED;
  }
  isRejected(): boolean {
    return this.props.value === RefundStatusEnum.REJECTED;
  }
  isPaidOut(): boolean {
    return this.props.value === RefundStatusEnum.PAID_OUT;
  }
}
