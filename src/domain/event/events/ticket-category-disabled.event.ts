import { DomainEvent } from "../../shared/domain-event.interface";

export class TicketCategoryDisabled implements DomainEvent {
  readonly eventName = "TicketCategoryDisabled";
  readonly occurredAt = new Date();
  constructor(
    public readonly eventId: string,
    public readonly categoryId: string,
  ) {}
}
