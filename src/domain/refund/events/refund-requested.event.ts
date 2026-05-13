import { DomainEvent } from "../../shared/domain-event.interface";
export class RefundRequested implements DomainEvent {
  readonly eventName = "RefundRequested";
  readonly occurredAt = new Date();
  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly amount: number,
    public readonly currency: string,
  ) {}
}
