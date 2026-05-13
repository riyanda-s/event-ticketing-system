import { DomainEvent } from "../../shared/domain-event.interface";
export class TicketCheckedIn implements DomainEvent {
  readonly eventName = "TicketCheckedIn";
  readonly occurredAt = new Date();
  constructor(
    public readonly ticketId: string,
    public readonly ticketCode: string,
    public readonly eventId: string,
    public readonly bookingId: string,
  ) {}
}
