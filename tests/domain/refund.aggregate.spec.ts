import { Refund } from "../../src/domain/refund/aggregates/refund.aggregate";
import { Money } from "../../src/domain/booking/value-objects/money.vo";

// ── Helpers ───────────────────────────────────────────────────────────────────
const refundAmount = Money.of(300_000, "IDR");

const makeRefund = () =>
  Refund.create({
    id: "refund-001",
    bookingId: "booking-001",
    customerId: "customer-001",
    amount: refundAmount,
    reason: "Event cancelled",
  });

// ── Refund Request ────────────────────────────────────────────────────────────
describe("Refund — request", () => {
  test("creates refund with Requested status and raises RefundRequested", () => {
    const refund = makeRefund();
    expect(refund.status.isRequested()).toBe(true);
    const events = refund.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("RefundRequested");
  });
});

// ── Approval ──────────────────────────────────────────────────────────────────
describe("Refund — approval", () => {
  test("approves a Requested refund and raises RefundApproved", () => {
    const refund = makeRefund();
    refund.pullDomainEvents();

    refund.approve();
    expect(refund.status.isApproved()).toBe(true);
    expect(refund.pullDomainEvents()[0].eventName).toBe("RefundApproved");
  });

  test("throws if refund is not in Requested status", () => {
    const refund = makeRefund();
    refund.approve();
    expect(() => refund.approve()).toThrow("status is Requested");
  });

  test("throws if trying to approve a rejected refund", () => {
    const refund = makeRefund();
    refund.reject("Not eligible");
    expect(() => refund.approve()).toThrow("status is Requested");
  });
});

// ── Rejection ─────────────────────────────────────────────────────────────────
describe("Refund — rejection", () => {
  test("rejects a Requested refund with a reason and raises RefundRejected", () => {
    const refund = makeRefund();
    refund.pullDomainEvents();

    refund.reject("Customer already attended the event");
    expect(refund.status.isRejected()).toBe(true);
    expect(refund.rejectionReason).toBe("Customer already attended the event");
    expect(refund.pullDomainEvents()[0].eventName).toBe("RefundRejected");
  });

  test("throws if rejection reason is empty", () => {
    const refund = makeRefund();
    expect(() => refund.reject("")).toThrow(
      "Rejection reason must be provided",
    );
  });

  test("throws if rejection reason is only whitespace", () => {
    const refund = makeRefund();
    expect(() => refund.reject("   ")).toThrow(
      "Rejection reason must be provided",
    );
  });

  test("throws if refund is not in Requested status", () => {
    const refund = makeRefund();
    refund.reject("Not eligible");
    expect(() => refund.reject("Another reason")).toThrow(
      "status is Requested",
    );
  });
});

// ── Payout ────────────────────────────────────────────────────────────────────
describe("Refund — payout", () => {
  test("marks approved refund as PaidOut and raises RefundPaidOut", () => {
    const refund = makeRefund();
    refund.approve();
    refund.pullDomainEvents();

    refund.markAsPaidOut("PAY-REF-12345");
    expect(refund.status.isPaidOut()).toBe(true);
    expect(refund.paymentReference).toBe("PAY-REF-12345");
    expect(refund.pullDomainEvents()[0].eventName).toBe("RefundPaidOut");
  });

  test("throws if refund is not in Approved status", () => {
    const refund = makeRefund();
    expect(() => refund.markAsPaidOut("REF-001")).toThrow("status is Approved");
  });

  test("throws if payment reference is empty", () => {
    const refund = makeRefund();
    refund.approve();
    expect(() => refund.markAsPaidOut("")).toThrow(
      "Payment reference must be provided",
    );
  });

  test("PaidOut is a terminal state — cannot approve again", () => {
    const refund = makeRefund();
    refund.approve();
    refund.markAsPaidOut("REF-001");
    expect(() => refund.approve()).toThrow("status is Requested");
  });

  test("PaidOut is a terminal state — cannot reject after payout", () => {
    const refund = makeRefund();
    refund.approve();
    refund.markAsPaidOut("REF-001");
    expect(() => refund.reject("too late")).toThrow("status is Requested");
  });
});
