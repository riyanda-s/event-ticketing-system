import { AggregateRoot } from "../../shared/aggregate-root";
import { BookingId } from "../value-objects/booking-id.vo";
import { BookingStatus } from "../value-objects/booking-status.vo";
import { Money } from "../value-objects/money.vo";
import { Ticket } from "../entities/ticket.entity";
import { TicketCode } from "../value-objects/ticket-code.vo";
import { TicketReserved } from "../events/ticket-reserved.event";
import { BookingPaid } from "../events/booking-paid.event";
import { BookingExpired } from "../events/booking-expired.event";
import { TicketCheckedIn } from "../events/ticket-checked-in.event";

const PAYMENT_DEADLINE_MINUTES = 15;

export interface CreateBookingProps {
  id: string;
  eventId: string;
  customerId: string;
  ticketCategoryId: string;
  quantity: number;
  unitPrice: Money;
  serviceFee?: Money;
}

export class Booking extends AggregateRoot {
  private _id: BookingId;
  private _eventId: string;
  private _customerId: string;
  private _ticketCategoryId: string;
  private _quantity: number;
  private _totalPrice: Money;
  private _status: BookingStatus;
  private _paymentDeadline: Date;
  private _tickets: Ticket[];

  private constructor(
    id: BookingId,
    eventId: string,
    customerId: string,
    ticketCategoryId: string,
    quantity: number,
    totalPrice: Money,
    status: BookingStatus,
    paymentDeadline: Date,
    tickets: Ticket[],
  ) {
    super();
    this._id = id;
    this._eventId = eventId;
    this._customerId = customerId;
    this._ticketCategoryId = ticketCategoryId;
    this._quantity = quantity;
    this._totalPrice = totalPrice;
    this._status = status;
    this._paymentDeadline = paymentDeadline;
    this._tickets = tickets;
  }

  // ── Factory ──────────────────────────────────────────────────────────
  static create(props: CreateBookingProps, now: Date = new Date()): Booking {
    if (props.quantity <= 0)
      throw new Error("Booking quantity must be greater than zero");

    const base = props.unitPrice.multiply(props.quantity);
    const totalPrice = props.serviceFee ? base.add(props.serviceFee) : base;

    const deadline = new Date(
      now.getTime() + PAYMENT_DEADLINE_MINUTES * 60 * 1000,
    );

    const booking = new Booking(
      BookingId.create(props.id),
      props.eventId,
      props.customerId,
      props.ticketCategoryId,
      props.quantity,
      totalPrice,
      BookingStatus.pendingPayment(),
      deadline,
      [],
    );

    booking.addDomainEvent(
      new TicketReserved(
        props.id,
        props.eventId,
        props.customerId,
        props.ticketCategoryId,
        props.quantity,
      ),
    );

    return booking;
  }

  static reconstitute(
    id: string,
    eventId: string,
    customerId: string,
    ticketCategoryId: string,
    quantity: number,
    totalPrice: Money,
    status: BookingStatus,
    paymentDeadline: Date,
    tickets: Ticket[],
  ): Booking {
    return new Booking(
      BookingId.create(id),
      eventId,
      customerId,
      ticketCategoryId,
      quantity,
      totalPrice,
      status,
      paymentDeadline,
      tickets,
    );
  }

  // ── Getters ──────────────────────────────────────────────────────────
  get id(): BookingId {
    return this._id;
  }
  get eventId(): string {
    return this._eventId;
  }
  get customerId(): string {
    return this._customerId;
  }
  get ticketCategoryId(): string {
    return this._ticketCategoryId;
  }
  get quantity(): number {
    return this._quantity;
  }
  get totalPrice(): Money {
    return this._totalPrice;
  }
  get status(): BookingStatus {
    return this._status;
  }
  get paymentDeadline(): Date {
    return this._paymentDeadline;
  }
  get tickets(): Ticket[] {
    return [...this._tickets];
  }

  // ── Behaviour ────────────────────────────────────────────────────────
  pay(
    paymentAmount: Money,
    ticketCodes: TicketCode[],
    now: Date = new Date(),
  ): void {
    if (!this._status.isPendingPayment())
      throw new Error("Booking can only be paid when status is PendingPayment");
    if (now > this._paymentDeadline)
      throw new Error("Payment deadline has passed");
    if (!paymentAmount.equals(this._totalPrice))
      throw new Error("Payment amount does not match booking total price");
    if (ticketCodes.length !== this._quantity)
      throw new Error("Number of ticket codes must match booking quantity");

    this._status = BookingStatus.paid();
    this._tickets = ticketCodes.map((code, i) =>
      Ticket.create({
        id: `${this._id.value}-ticket-${i + 1}`,
        bookingId: this._id.value,
        eventId: this._eventId,
        code,
      }),
    );

    this.addDomainEvent(
      new BookingPaid(
        this._id.value,
        this._customerId,
        this._totalPrice.amount,
        this._totalPrice.currency,
      ),
    );
  }

  expire(now: Date = new Date()): void {
    if (this._status.isPaid())
      throw new Error("A paid booking cannot be expired");
    if (!this._status.isPendingPayment())
      throw new Error("Only a PendingPayment booking can expire");
    if (now <= this._paymentDeadline)
      throw new Error("Booking has not yet reached its payment deadline");

    this._status = BookingStatus.expired();
    this.addDomainEvent(
      new BookingExpired(
        this._id.value,
        this._ticketCategoryId,
        this._quantity,
      ),
    );
  }

  markRefunded(): void {
    if (!this._status.isPaid())
      throw new Error("Only a paid booking can be refunded");
    this._status = BookingStatus.refunded();
  }

  checkInTicket(
    ticketId: string,
    eventId: string,
    now: Date = new Date(),
  ): void {
    const ticket = this._tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("Ticket not found in this booking");

    ticket.checkIn(eventId, now);

    this.addDomainEvent(
      new TicketCheckedIn(
        ticket.id,
        ticket.code.value,
        eventId,
        this._id.value,
      ),
    );
  }

  cancelAllTickets(): void {
    this._tickets.forEach((t) => {
      if (t.isActive()) t.cancel();
    });
  }

  hasCheckedInTickets(): boolean {
    return this._tickets.some((t) => t.isCheckedIn());
  }
}
