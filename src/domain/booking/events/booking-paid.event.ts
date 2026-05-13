import { DomainEvent } from "../../shared/domain-event.interface";
export class BookingPaid implements DomainEvent {
  readonly eventName = "BookingPaid";
  readonly occurredAt = new Date();
  constructor(
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly totalAmount: number,
    public readonly currency: string,
  ) {}
}
