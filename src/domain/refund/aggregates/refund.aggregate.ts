import { AggregateRoot } from "../../shared/aggregate-root";
import { RefundId } from "../value-objects/refund-id.vo";
import { RefundStatus } from "../value-objects/refund-status.vo";
import { Money } from "../../booking/value-objects/money.vo";
import { RefundRequested } from "../events/refund-requested.event";
import { RefundApproved } from "../events/refund-approved.event";
import { RefundRejected } from "../events/refund-rejected.event";
import { RefundPaidOut } from "../events/refund-paid-out.event";

export interface CreateRefundProps {
  id: string;
  bookingId: string;
  customerId: string;
  amount: Money;
  reason?: string;
}

export class Refund extends AggregateRoot {
  private _id: RefundId;
  private _bookingId: string;
  private _customerId: string;
  private _amount: Money;
  private _status: RefundStatus;
  private _reason?: string;
  private _rejectionReason?: string;
  private _paymentReference?: string;
  private _requestedAt: Date;

  private constructor(
    id: RefundId,
    bookingId: string,
    customerId: string,
    amount: Money,
    status: RefundStatus,
    requestedAt: Date,
    reason?: string,
    rejectionReason?: string,
    paymentReference?: string,
  ) {
    super();
    this._id = id;
    this._bookingId = bookingId;
    this._customerId = customerId;
    this._amount = amount;
    this._status = status;
    this._requestedAt = requestedAt;
    this._reason = reason;
    this._rejectionReason = rejectionReason;
    this._paymentReference = paymentReference;
  }

  // ── Factory ──────────────────────────────────────────────────────────
  static create(props: CreateRefundProps, now: Date = new Date()): Refund {
    const refund = new Refund(
      RefundId.create(props.id),
      props.bookingId,
      props.customerId,
      props.amount,
      RefundStatus.requested(),
      now,
      props.reason,
    );

    refund.addDomainEvent(
      new RefundRequested(
        props.id,
        props.bookingId,
        props.customerId,
        props.amount.amount,
        props.amount.currency,
      ),
    );

    return refund;
  }

  static reconstitute(
    id: string,
    bookingId: string,
    customerId: string,
    amount: Money,
    status: RefundStatus,
    requestedAt: Date,
    reason?: string,
    rejectionReason?: string,
    paymentReference?: string,
  ): Refund {
    return new Refund(
      RefundId.create(id),
      bookingId,
      customerId,
      amount,
      status,
      requestedAt,
      reason,
      rejectionReason,
      paymentReference,
    );
  }

  // ── Getters ──────────────────────────────────────────────────────────
  get id(): RefundId {
    return this._id;
  }
  get bookingId(): string {
    return this._bookingId;
  }
  get customerId(): string {
    return this._customerId;
  }
  get amount(): Money {
    return this._amount;
  }
  get status(): RefundStatus {
    return this._status;
  }
  get reason(): string | undefined {
    return this._reason;
  }
  get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }
  get paymentReference(): string | undefined {
    return this._paymentReference;
  }
  get requestedAt(): Date {
    return this._requestedAt;
  }

  // ── Behaviour ────────────────────────────────────────────────────────
  approve(): void {
    if (!this._status.isRequested())
      throw new Error("Refund can only be approved when status is Requested");

    this._status = RefundStatus.approved();
    this.addDomainEvent(new RefundApproved(this._id.value, this._bookingId));
  }

  reject(reason: string): void {
    if (!this._status.isRequested())
      throw new Error("Refund can only be rejected when status is Requested");
    if (!reason || reason.trim().length === 0)
      throw new Error("Rejection reason must be provided");

    this._status = RefundStatus.rejected();
    this._rejectionReason = reason;
    this.addDomainEvent(
      new RefundRejected(this._id.value, this._bookingId, reason),
    );
  }

  markAsPaidOut(paymentReference: string): void {
    if (!this._status.isApproved())
      throw new Error("Refund can only be paid out when status is Approved");
    if (!paymentReference || paymentReference.trim().length === 0)
      throw new Error("Payment reference must be provided");

    this._status = RefundStatus.paidOut();
    this._paymentReference = paymentReference;
    this.addDomainEvent(
      new RefundPaidOut(this._id.value, this._bookingId, paymentReference),
    );
  }
}
