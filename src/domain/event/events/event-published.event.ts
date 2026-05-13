import { DomainEvent } from "../../shared/domain-event.interface";

export class EventPublished implements DomainEvent {
  readonly eventName = "EventPublished";
  readonly occurredAt = new Date();
  constructor(public readonly eventId: string) {}
}
