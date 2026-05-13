import { AggregateRoot } from "../../shared/aggregate-root";
import { EventId } from "../value-objects/event-id.vo";
import { EventStatus } from "../value-objects/event-status.vo";
import { TicketCategory } from "../entities/ticket-category.entity";
import { Money } from "../../booking/value-objects/money.vo";
import { EventCreated } from "../events/event-created.event";
import { EventPublished } from "../events/event-published.event";
import { EventCancelled } from "../events/event-cancelled.event";
import { TicketCategoryCreated } from "../events/ticket-category-created.event";
import { TicketCategoryDisabled } from "../events/ticket-category-disabled.event";

export interface CreateEventProps {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  maxCapacity: number;
  organizerId: string;
}

export class Event extends AggregateRoot {
  private _id: EventId;
  private _name: string;
  private _description: string;
  private _startDate: Date;
  private _endDate: Date;
  private _location: string;
  private _maxCapacity: number;
  private _organizerId: string;
  private _status: EventStatus;
  private _ticketCategories: TicketCategory[];

  private constructor(
    props: CreateEventProps,
    categories: TicketCategory[] = [],
  ) {
    super();
    this._id = EventId.create(props.id);
    this._name = props.name;
    this._description = props.description;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._location = props.location;
    this._maxCapacity = props.maxCapacity;
    this._organizerId = props.organizerId;
    this._status = EventStatus.draft();
    this._ticketCategories = categories;
  }

  // ── Factory ─────────────────────────────────────────────────────────
  static create(props: CreateEventProps): Event {
    if (props.endDate <= props.startDate)
      throw new Error("Event end date must be after start date");
    if (props.maxCapacity <= 0)
      throw new Error("Event max capacity must be greater than zero");

    const event = new Event(props);
    event.addDomainEvent(
      new EventCreated(props.id, props.name, props.organizerId),
    );
    return event;
  }

  static reconstitute(
    props: CreateEventProps & { status: EventStatus },
    categories: TicketCategory[],
  ): Event {
    const event = new Event(props, categories);
    event._status = props.status;
    return event;
  }

  // ── Getters ──────────────────────────────────────────────────────────
  get id(): EventId {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string {
    return this._description;
  }
  get startDate(): Date {
    return this._startDate;
  }
  get endDate(): Date {
    return this._endDate;
  }
  get location(): string {
    return this._location;
  }
  get maxCapacity(): number {
    return this._maxCapacity;
  }
  get organizerId(): string {
    return this._organizerId;
  }
  get status(): EventStatus {
    return this._status;
  }
  get ticketCategories(): TicketCategory[] {
    return [...this._ticketCategories];
  }

  // ── Behaviour ────────────────────────────────────────────────────────
  publish(): void {
    if (this._status.isCancelled())
      throw new Error("A cancelled event cannot be published");
    if (!this._status.isDraft())
      throw new Error("Only a draft event can be published");

    const activeCategories = this._ticketCategories.filter((c) => c.isActive());
    if (activeCategories.length === 0)
      throw new Error(
        "Event must have at least one active ticket category to be published",
      );

    const totalQuota = this._ticketCategories.reduce(
      (sum, c) => sum + c.quota,
      0,
    );
    if (totalQuota > this._maxCapacity)
      throw new Error("Total ticket quota exceeds maximum event capacity");

    this._status = EventStatus.published();
    this.addDomainEvent(new EventPublished(this._id.value));
  }

  cancel(): void {
    if (this._status.isCompleted())
      throw new Error("A completed event cannot be cancelled");
    if (!this._status.isPublished())
      throw new Error("Only a published event can be cancelled");

    this._status = EventStatus.cancelled();
    this.addDomainEvent(new EventCancelled(this._id.value));
  }

  complete(): void {
    if (!this._status.isPublished())
      throw new Error("Only a published event can be completed");
    this._status = EventStatus.completed();
  }

  addTicketCategory(props: {
    id: string;
    name: string;
    price: Money;
    quota: number;
    salesStart: Date;
    salesEnd: Date;
  }): TicketCategory {
    if (props.salesEnd > this._startDate)
      throw new Error(
        "Ticket sales period must end before or at the event start date",
      );

    const totalExistingQuota = this._ticketCategories.reduce(
      (sum, c) => sum + c.quota,
      0,
    );
    if (totalExistingQuota + props.quota > this._maxCapacity)
      throw new Error("Total ticket quota would exceed maximum event capacity");

    const category = TicketCategory.create(props);
    this._ticketCategories.push(category);
    this.addDomainEvent(
      new TicketCategoryCreated(this._id.value, props.id, props.name),
    );
    return category;
  }

  disableTicketCategory(categoryId: string): void {
    if (this._status.isCompleted())
      throw new Error("Cannot disable a ticket category for a completed event");

    const category = this._ticketCategories.find((c) => c.id === categoryId);
    if (!category) throw new Error("Ticket category not found");

    category.disable();
    this.addDomainEvent(new TicketCategoryDisabled(this._id.value, categoryId));
  }

  findTicketCategory(categoryId: string): TicketCategory | undefined {
    return this._ticketCategories.find((c) => c.id === categoryId);
  }

  getLowestPrice(): Money | null {
    const active = this._ticketCategories.filter((c) => c.isActive());
    if (active.length === 0) return null;
    return active.reduce(
      (min, c) => (c.price.amount < min.amount ? c.price : min),
      active[0].price,
    );
  }
}
