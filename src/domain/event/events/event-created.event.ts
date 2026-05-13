import { DomainEvent } from "../../shared/domain-event.interface";

export class EventCreated implements DomainEvent {
  readonly eventName = "EventCreated";
  readonly occurredAt = new Date();

  constructor(
    public readonly eventId: string,
    public readonly name: string,
    public readonly organizerId: string,
  ) {}
}
