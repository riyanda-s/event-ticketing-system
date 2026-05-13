import { DomainEvent } from "../../shared/domain-event.interface";
export class RefundApproved implements DomainEvent {
  readonly eventName = "RefundApproved";
  readonly occurredAt = new Date();
  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
  ) {}
}
