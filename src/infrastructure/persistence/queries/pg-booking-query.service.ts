import { Pool } from "pg";
import { IBookingQueryService, CustomerTicketDTO } from "../../../application/ports/booking-query.interface";

export class PgBookingQueryService implements IBookingQueryService {
  constructor(private readonly pool: Pool) {}

  async getCustomerTickets(customerId: string): Promise<CustomerTicketDTO[]> {
    const { rows } = await this.pool.query(
      `SELECT t.id AS ticket_id, t.booking_id, t.event_id, t.code AS ticket_code,
              t.status AS ticket_status, t.checked_in_at, b.status AS booking_status
       FROM tickets t
       JOIN bookings b ON b.id = t.booking_id
       WHERE b.customer_id = $1 AND b.status = 'Paid'
       ORDER BY t.created_at DESC`,
      [customerId],
    );

    return rows.map((r) => ({
      ticketId: r.ticket_id,
      bookingId: r.booking_id,
      eventId: r.event_id,
      ticketCode: r.ticket_code,
      ticketStatus: r.ticket_status,
      checkedInAt: r.checked_in_at?.toISOString(),
      bookingStatus: r.booking_status,
    }));
  }
}
