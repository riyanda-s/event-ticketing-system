import { DomainEvent } from "../../shared/domain-event.interface";
export class RefundRejected implements DomainEvent {
  readonly eventName = "RefundRejected";
  readonly occurredAt = new Date();
  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly reason: string,
  ) {}
}
