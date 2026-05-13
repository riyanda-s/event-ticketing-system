import { Event } from "../../src/domain/event/aggregates/event.aggregate";
import { Money } from "../../src/domain/booking/value-objects/money.vo";

// ── Helpers ──────────────────────────────────────────────────────────────────
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};
const nextWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
};
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const defaultEventProps = () => ({
  id: "event-001",
  name: "Tech Conference 2025",
  description: "Annual tech conference",
  startDate: nextWeek(),
  endDate: new Date(nextWeek().getTime() + 86400000),
  location: "Jakarta Convention Center",
  maxCapacity: 500,
  organizerId: "organizer-001",
});

const addDefaultCategory = (event: Event) =>
  event.addTicketCategory({
    id: "cat-001",
    name: "Regular",
    price: Money.of(100_000, "IDR"),
    quota: 100,
    salesStart: new Date(),
    salesEnd: tomorrow(),
  });

// ── Event Creation ────────────────────────────────────────────────────────────
describe("Event — creation", () => {
  test("creates event with Draft status and raises EventCreated", () => {
    const event = Event.create(defaultEventProps());
    expect(event.status.isDraft()).toBe(true);
    const events = event.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("EventCreated");
  });

  test("throws if end date is before start date", () => {
    expect(() =>
      Event.create({ ...defaultEventProps(), endDate: yesterday() }),
    ).toThrow("end date must be after start date");
  });

  test("throws if end date equals start date", () => {
    const same = nextWeek();
    expect(() =>
      Event.create({ ...defaultEventProps(), startDate: same, endDate: same }),
    ).toThrow("end date must be after start date");
  });

  test("throws if max capacity is zero", () => {
    expect(() =>
      Event.create({ ...defaultEventProps(), maxCapacity: 0 }),
    ).toThrow("max capacity must be greater than zero");
  });

  test("throws if max capacity is negative", () => {
    expect(() =>
      Event.create({ ...defaultEventProps(), maxCapacity: -1 }),
    ).toThrow("max capacity must be greater than zero");
  });
});

// ── Ticket Category ───────────────────────────────────────────────────────────
describe("Event — ticket category", () => {
  test("adds a ticket category and raises TicketCategoryCreated", () => {
    const event = Event.create(defaultEventProps());
    event.pullDomainEvents(); // clear EventCreated

    addDefaultCategory(event);
    const events = event.pullDomainEvents();
    expect(events[0].eventName).toBe("TicketCategoryCreated");
    expect(event.ticketCategories).toHaveLength(1);
  });

  test("throws if category quota exceeds event capacity", () => {
    const event = Event.create({ ...defaultEventProps(), maxCapacity: 50 });
    expect(() =>
      event.addTicketCategory({
        id: "cat-001",
        name: "Regular",
        price: Money.of(100_000, "IDR"),
        quota: 100,
        salesStart: new Date(),
        salesEnd: tomorrow(),
      }),
    ).toThrow("exceed maximum event capacity");
  });

  test("throws if ticket price is negative", () => {
    const event = Event.create(defaultEventProps());
    expect(() =>
      event.addTicketCategory({
        id: "cat-001",
        name: "Regular",
        price: Money.of(-1, "IDR"),
        quota: 10,
        salesStart: new Date(),
        salesEnd: tomorrow(),
      }),
    ).toThrow();
  });
});

// ── Publish ───────────────────────────────────────────────────────────────────
describe("Event — publishing", () => {
  test("publishes successfully and raises EventPublished", () => {
    const event = Event.create(defaultEventProps());
    addDefaultCategory(event);
    event.pullDomainEvents();

    event.publish();
    expect(event.status.isPublished()).toBe(true);
    const events = event.pullDomainEvents();
    expect(events[0].eventName).toBe("EventPublished");
  });

  test("throws if no active ticket category", () => {
    const event = Event.create(defaultEventProps());
    expect(() => event.publish()).toThrow(
      "at least one active ticket category",
    );
  });

  test("throws if total quota exceeds capacity", () => {
    const event = Event.create({ ...defaultEventProps(), maxCapacity: 100 });
    event.addTicketCategory({
      id: "cat-001",
      name: "Regular",
      price: Money.of(100_000, "IDR"),
      quota: 60,
      salesStart: new Date(),
      salesEnd: tomorrow(),
    });
    // Adding 50 more would push total to 110, exceeding capacity of 100
    expect(() =>
      event.addTicketCategory({
        id: "cat-002",
        name: "VIP",
        price: Money.of(200_000, "IDR"),
        quota: 50,
        salesStart: new Date(),
        salesEnd: tomorrow(),
      }),
    ).toThrow("exceed maximum event capacity");
  });

  test("throws if event is already cancelled", () => {
    const event = Event.create(defaultEventProps());
    addDefaultCategory(event);
    event.publish();
    event.cancel();
    expect(() => event.publish()).toThrow(
      "cancelled event cannot be published",
    );
  });
});

// ── Cancel ────────────────────────────────────────────────────────────────────
describe("Event — cancellation", () => {
  test("cancels a published event and raises EventCancelled", () => {
    const event = Event.create(defaultEventProps());
    addDefaultCategory(event);
    event.publish();
    event.pullDomainEvents();

    event.cancel();
    expect(event.status.isCancelled()).toBe(true);
    expect(event.pullDomainEvents()[0].eventName).toBe("EventCancelled");
  });

  test("throws if event is in Draft status", () => {
    const event = Event.create(defaultEventProps());
    expect(() => event.cancel()).toThrow(
      "Only a published event can be cancelled",
    );
  });

  test("throws if event is completed", () => {
    const event = Event.create(defaultEventProps());
    addDefaultCategory(event);
    event.publish();
    event.complete();
    expect(() => event.cancel()).toThrow("completed event cannot be cancelled");
  });
});
