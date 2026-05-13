import { DomainEvent } from "../../shared/domain-event.interface";

export class TicketCategoryCreated implements DomainEvent {
  readonly eventName = "TicketCategoryCreated";
  readonly occurredAt = new Date();
  constructor(
    public readonly eventId: string,
    public readonly categoryId: string,
    public readonly name: string,
  ) {}
}
