import { DomainEvent } from "../../shared/domain-event.interface";
export class TicketReserved implements DomainEvent {
  readonly eventName = "TicketReserved";
  readonly occurredAt = new Date();
  constructor(
    public readonly bookingId: string,
    public readonly eventId: string,
    public readonly customerId: string,
    public readonly ticketCategoryId: string,
    public readonly quantity: number,
  ) {}
}
