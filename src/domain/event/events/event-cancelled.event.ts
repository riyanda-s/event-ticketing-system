import { DomainEvent } from "../../shared/domain-event.interface";

export class EventCancelled implements DomainEvent {
  readonly eventName = "EventCancelled";
  readonly occurredAt = new Date();
  constructor(public readonly eventId: string) {}
}
