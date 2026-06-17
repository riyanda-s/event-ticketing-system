import { Pool } from "pg";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { Booking } from "../../../domain/booking/aggregates/booking.aggregate";
import { BookingStatus } from "../../../domain/booking/value-objects/booking-status.vo";
import { Ticket } from "../../../domain/booking/entities/ticket.entity";
import { TicketCode } from "../../../domain/booking/value-objects/ticket-code.vo";
import { TicketStatus } from "../../../domain/booking/value-objects/ticket-status.vo";
import { Money } from "../../../domain/booking/value-objects/money.vo";

export class PgBookingRepository implements IBookingRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Booking | null> {
    const row = await this.pool
      .query("SELECT * FROM bookings WHERE id = $1", [id])
      .then((r) => r.rows[0]);
    if (!row) return null;
    const tickets = await this.fetchTickets(id);
    return this.mapToBooking(row, tickets);
  }

  async findByCustomerAndEvent(customerId: string, eventId: string): Promise<Booking | null> {
    const row = await this.pool
      .query(
        "SELECT * FROM bookings WHERE customer_id=$1 AND event_id=$2 AND status IN ('PendingPayment','Paid') LIMIT 1",
        [customerId, eventId],
      )
      .then((r) => r.rows[0]);
    if (!row) return null;
    const tickets = await this.fetchTickets(row.id);
    return this.mapToBooking(row, tickets);
  }

  async findPendingExpired(now: Date): Promise<Booking[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM bookings WHERE status='PendingPayment' AND payment_deadline < $1",
      [now],
    );
    return Promise.all(rows.map(async (r) => this.mapToBooking(r, await this.fetchTickets(r.id))));
  }

  async findPaidByEventId(eventId: string): Promise<Booking[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM bookings WHERE event_id=$1 AND status='Paid'",
      [eventId],
    );
    return Promise.all(rows.map(async (r) => this.mapToBooking(r, await this.fetchTickets(r.id))));
  }

  async findByTicketCode(ticketCode: string): Promise<Booking | null> {
    const ticketRow = await this.pool
      .query("SELECT booking_id FROM tickets WHERE code=$1", [ticketCode])
      .then((r) => r.rows[0]);
    if (!ticketRow) return null;
    return this.findById(ticketRow.booking_id);
  }

  async save(booking: Booking): Promise<void> {
    await this.pool.query(
      `INSERT INTO bookings (id, event_id, customer_id, ticket_category_id, quantity,
       total_price_amount, total_price_currency, status, payment_deadline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        booking.id.value, booking.eventId, booking.customerId,
        booking.ticketCategoryId, booking.quantity,
        booking.totalPrice.amount, booking.totalPrice.currency,
        booking.status.value, booking.paymentDeadline,
      ],
    );
  }

  async update(booking: Booking): Promise<void> {
    await this.pool.query(
      `UPDATE bookings SET status=$2, updated_at=NOW() WHERE id=$1`,
      [booking.id.value, booking.status.value],
    );
    for (const ticket of booking.tickets) {
      await this.pool.query(
        `INSERT INTO tickets (id, booking_id, event_id, code, status, checked_in_at)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (id) DO UPDATE SET status=$5, checked_in_at=$6`,
        [
          ticket.id, booking.id.value, ticket.eventId,
          ticket.code.value, ticket.status.value, ticket.checkedInAt ?? null,
        ],
      );
    }
  }

  private async fetchTickets(bookingId: string): Promise<any[]> {
    return this.pool
      .query("SELECT * FROM tickets WHERE booking_id=$1", [bookingId])
      .then((r) => r.rows);
  }

  private mapToBooking(row: any, ticketRows: any[]): Booking {
    const tickets = ticketRows.map((t) =>
      Ticket.reconstitute({
        id: t.id,
        bookingId: t.booking_id,
        eventId: t.event_id,
        code: TicketCode.create(t.code),
        status: new TicketStatus(t.status),
        checkedInAt: t.checked_in_at ?? undefined,
      }),
    );

    return Booking.reconstitute(
      row.id,
      row.event_id,
      row.customer_id,
      row.ticket_category_id,
      row.quantity,
      Money.of(parseFloat(row.total_price_amount), row.total_price_currency),
      new BookingStatus(row.status),
      row.payment_deadline,
      tickets,
    );
  }
}
