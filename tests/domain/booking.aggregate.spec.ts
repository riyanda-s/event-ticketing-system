import { Booking } from "../../src/domain/booking/aggregates/booking.aggregate";
import { Money } from "../../src/domain/booking/value-objects/money.vo";
import { TicketCodeGeneratorService } from "../../src/domain/booking/domain-services/ticket-code-generator.service";
import { BookingPricingService } from "../../src/domain/booking/domain-services/booking-pricing.service";

// ── Helpers ───────────────────────────────────────────────────────────────────
const unitPrice = Money.of(150_000, "IDR");

const makeBooking = (
  overrides: Partial<{ quantity: number; now: Date }> = {},
) => {
  const now = overrides.now ?? new Date();
  return Booking.create(
    {
      id: "booking-001",
      eventId: "event-001",
      customerId: "customer-001",
      ticketCategoryId: "cat-001",
      quantity: overrides.quantity ?? 2,
      unitPrice,
    },
    now,
  );
};

const pastDeadline = (booking: Booking) => {
  // 16 minutes after creation (deadline is 15 min)
  const past = new Date(booking.paymentDeadline.getTime() + 60_000);
  return past;
};

// ── Booking Creation ──────────────────────────────────────────────────────────
describe("Booking — creation", () => {
  test("creates booking with PendingPayment status and raises TicketReserved", () => {
    const booking = makeBooking();
    expect(booking.status.isPendingPayment()).toBe(true);
    const events = booking.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("TicketReserved");
  });

  test("throws if quantity is zero", () => {
    expect(() => makeBooking({ quantity: 0 })).toThrow(
      "quantity must be greater than zero",
    );
  });

  test("throws if quantity is negative", () => {
    expect(() => makeBooking({ quantity: -1 })).toThrow(
      "quantity must be greater than zero",
    );
  });

  test("sets payment deadline to 15 minutes after creation", () => {
    const now = new Date();
    const booking = makeBooking({ now });
    const diff = booking.paymentDeadline.getTime() - now.getTime();
    expect(diff).toBe(15 * 60 * 1000);
  });

  test("calculates correct total price", () => {
    const booking = makeBooking({ quantity: 3 });
    // 3 × 150,000 = 450,000
    expect(booking.totalPrice.amount).toBe(450_000);
  });
});

// ── Pricing Service ───────────────────────────────────────────────────────────
describe("BookingPricingService", () => {
  test("calculates subtotal without service fee", () => {
    const total = BookingPricingService.calculateTotal(unitPrice, 2, false);
    expect(total.amount).toBe(300_000);
  });

  test("calculates total with 5% service fee", () => {
    const total = BookingPricingService.calculateTotal(unitPrice, 2, true);
    expect(total.amount).toBe(315_000); // 300,000 + 15,000
  });

  test("throws if quantity is zero", () => {
    expect(() => BookingPricingService.calculateTotal(unitPrice, 0)).toThrow();
  });
});

// ── Payment ───────────────────────────────────────────────────────────────────
describe("Booking — payment", () => {
  test("pays booking successfully and raises BookingPaid", () => {
    const booking = makeBooking({ quantity: 2 });
    booking.pullDomainEvents();

    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 2);
    booking.pay(booking.totalPrice, codes);

    expect(booking.status.isPaid()).toBe(true);
    expect(booking.tickets).toHaveLength(2);
    const events = booking.pullDomainEvents();
    expect(events[0].eventName).toBe("BookingPaid");
  });

  test("throws if payment amount does not match total", () => {
    const booking = makeBooking({ quantity: 2 });
    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 2);
    expect(() => booking.pay(Money.of(99_999, "IDR"), codes)).toThrow(
      "does not match booking total price",
    );
  });

  test("throws if payment deadline has passed", () => {
    const booking = makeBooking();
    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 2);
    expect(() =>
      booking.pay(booking.totalPrice, codes, pastDeadline(booking)),
    ).toThrow("Payment deadline has passed");
  });

  test("throws if booking is not in PendingPayment status", () => {
    const booking = makeBooking({ quantity: 1 });
    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 1);
    booking.pay(booking.totalPrice, codes);

    expect(() => booking.pay(booking.totalPrice, codes)).toThrow(
      "status is PendingPayment",
    );
  });
});

// ── Expiry ────────────────────────────────────────────────────────────────────
describe("Booking — expiry", () => {
  test("expires booking and raises BookingExpired", () => {
    const booking = makeBooking();
    booking.pullDomainEvents();

    booking.expire(pastDeadline(booking));
    expect(booking.status.isExpired()).toBe(true);
    expect(booking.pullDomainEvents()[0].eventName).toBe("BookingExpired");
  });

  test("throws if booking is already paid", () => {
    const booking = makeBooking({ quantity: 1 });
    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 1);
    booking.pay(booking.totalPrice, codes);

    expect(() => booking.expire(pastDeadline(booking))).toThrow(
      "paid booking cannot be expired",
    );
  });

  test("throws if deadline has not passed yet", () => {
    const booking = makeBooking();
    const beforeDeadline = new Date(booking.paymentDeadline.getTime() - 1000);
    expect(() => booking.expire(beforeDeadline)).toThrow(
      "not yet reached its payment deadline",
    );
  });
});

// ── Check-in ──────────────────────────────────────────────────────────────────
describe("Booking — check-in", () => {
  const setupPaidBooking = () => {
    const booking = makeBooking({ quantity: 1 });
    const codes = TicketCodeGeneratorService.generateBatch("booking-001", 1);
    booking.pay(booking.totalPrice, codes);
    booking.pullDomainEvents();
    return booking;
  };

  test("checks in a ticket and raises TicketCheckedIn", () => {
    const booking = setupPaidBooking();
    const ticketId = booking.tickets[0].id;

    booking.checkInTicket(ticketId, "event-001");
    expect(booking.tickets[0].isCheckedIn()).toBe(true);
    expect(booking.pullDomainEvents()[0].eventName).toBe("TicketCheckedIn");
  });

  test("throws if ticket has already been checked in", () => {
    const booking = setupPaidBooking();
    const ticketId = booking.tickets[0].id;

    booking.checkInTicket(ticketId, "event-001");
    expect(() => booking.checkInTicket(ticketId, "event-001")).toThrow(
      "already been checked in",
    );
  });

  test("throws if ticket belongs to a different event", () => {
    const booking = setupPaidBooking();
    const ticketId = booking.tickets[0].id;

    expect(() => booking.checkInTicket(ticketId, "wrong-event-id")).toThrow(
      "does not belong to this event",
    );
  });
});

// ── Money Value Object ────────────────────────────────────────────────────────
describe("Money value object", () => {
  test("cannot be created with negative amount", () => {
    expect(() => Money.of(-1, "IDR")).toThrow("cannot be negative");
  });

  test("add returns new Money", () => {
    const a = Money.of(100_000, "IDR");
    const b = Money.of(50_000, "IDR");
    const sum = a.add(b);
    expect(sum.amount).toBe(150_000);
    expect(a.amount).toBe(100_000); // immutable
  });

  test("throws on currency mismatch", () => {
    const a = Money.of(100_000, "IDR");
    const b = Money.of(50, "USD");
    expect(() => a.add(b)).toThrow("Currency mismatch");
  });

  test("multiply returns correct amount", () => {
    const price = Money.of(100_000, "IDR");
    expect(price.multiply(3).amount).toBe(300_000);
  });
});
