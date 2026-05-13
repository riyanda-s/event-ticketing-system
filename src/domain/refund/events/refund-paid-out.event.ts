import { DomainEvent } from "../../shared/domain-event.interface";
export class RefundPaidOut implements DomainEvent {
  readonly eventName = "RefundPaidOut";
  readonly occurredAt = new Date();
  constructor(
    public readonly refundId: string,
    public readonly bookingId: string,
    public readonly paymentReference: string,
  ) {}
}
