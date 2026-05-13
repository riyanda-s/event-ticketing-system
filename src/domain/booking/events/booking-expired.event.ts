import { DomainEvent } from "../../shared/domain-event.interface";
export class BookingExpired implements DomainEvent {
  readonly eventName = "BookingExpired";
  readonly occurredAt = new Date();
  constructor(
    public readonly bookingId: string,
    public readonly ticketCategoryId: string,
    public readonly quantity: number,
  ) {}
}
