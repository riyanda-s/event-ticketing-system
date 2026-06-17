import { Pool } from "pg";
import {
  IEventQueryService,
  EventSummaryDTO,
  EventDetailDTO,
  TicketCategoryDetailDTO,
  SalesReportDTO,
  ParticipantDTO,
  GetAvailableEventsFilters,
} from "../../../application/ports/event-query.interface";

export class PgEventQueryService implements IEventQueryService {
  constructor(private readonly pool: Pool) {}

  async getAvailableEvents(filters: GetAvailableEventsFilters = {}): Promise<EventSummaryDTO[]> {
    let query = `
      SELECT e.id, e.name, e.start_date, e.end_date, e.location, e.status,
             MIN(tc.price_amount) AS lowest_price, MAX(tc.price_currency) AS currency
      FROM events e
      LEFT JOIN ticket_categories tc ON tc.event_id = e.id AND tc.status = 'Active'
      WHERE e.status = 'Published'
    `;
    const params: any[] = [];

    if (filters.date) {
      params.push(filters.date);
      query += ` AND DATE(e.start_date) = $${params.length}`;
    }
    if (filters.location) {
      params.push(`%${filters.location}%`);
      query += ` AND LOWER(e.location) LIKE LOWER($${params.length})`;
    }
    query += " GROUP BY e.id ORDER BY e.start_date";

    const { rows } = await this.pool.query(query, params);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      startDate: r.start_date.toISOString(),
      endDate: r.end_date.toISOString(),
      location: r.location,
      status: r.status,
      lowestPrice: r.lowest_price
        ? { amount: parseFloat(r.lowest_price), currency: r.currency }
        : undefined,
    }));
  }

  async getEventDetail(eventId: string, now: Date = new Date()): Promise<EventDetailDTO | null> {
    const eventRow = await this.pool
      .query("SELECT * FROM events WHERE id=$1", [eventId])
      .then((r) => r.rows[0]);
    if (!eventRow) return null;

    const catRows = await this.pool
      .query("SELECT * FROM ticket_categories WHERE event_id=$1 ORDER BY price_amount", [eventId])
      .then((r) => r.rows);

    const ticketCategories: TicketCategoryDetailDTO[] = catRows.map((c) => {
      let saleStatus: TicketCategoryDetailDTO["saleStatus"] = "Available";
      if (!c.status || c.status === "Inactive") saleStatus = "Inactive";
      else if (now < new Date(c.sales_start)) saleStatus = "ComingSoon";
      else if (now > new Date(c.sales_end)) saleStatus = "SalesClosed";
      else if (c.remaining_quota === 0) saleStatus = "SoldOut";

      return {
        id: c.id,
        name: c.name,
        price: { amount: parseFloat(c.price_amount), currency: c.price_currency },
        quota: c.quota,
        remainingQuota: c.remaining_quota,
        salesStart: c.sales_start.toISOString(),
        salesEnd: c.sales_end.toISOString(),
        status: c.status,
        saleStatus,
      };
    });

    return {
      id: eventRow.id,
      name: eventRow.name,
      description: eventRow.description,
      startDate: eventRow.start_date.toISOString(),
      endDate: eventRow.end_date.toISOString(),
      location: eventRow.location,
      organizerId: eventRow.organizer_id,
      status: eventRow.status,
      ticketCategories,
    };
  }

  async getSalesReport(eventId: string): Promise<SalesReportDTO> {
    // Revenue and sales per category
    const catSales = await this.pool.query(
      `SELECT tc.id AS category_id, tc.name, tc.price_currency AS currency,
              COUNT(b.id) FILTER (WHERE b.status='Paid') AS paid_count,
              COALESCE(SUM(b.total_price_amount) FILTER (WHERE b.status='Paid'), 0) AS revenue
       FROM ticket_categories tc
       LEFT JOIN bookings b ON b.ticket_category_id = tc.id
       WHERE tc.event_id = $1
       GROUP BY tc.id, tc.name, tc.price_currency`,
      [eventId],
    );

    // Bookings by status
    const statusCounts = await this.pool.query(
      `SELECT status, COUNT(*) AS cnt FROM bookings WHERE event_id=$1 GROUP BY status`,
      [eventId],
    );

    const byStatus: Record<string, number> = {};
    statusCounts.rows.forEach((r) => { byStatus[r.status] = parseInt(r.cnt); });

    const currency = catSales.rows[0]?.currency ?? "IDR";
    const totalRevenue = catSales.rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    return {
      eventId,
      categorySales: catSales.rows.map((r) => ({
        categoryId: r.category_id,
        name: r.name,
        sold: parseInt(r.paid_count),
        revenue: parseFloat(r.revenue),
        currency: r.currency,
      })),
      bookingsByStatus: {
        PendingPayment: byStatus["PendingPayment"] ?? 0,
        Paid: byStatus["Paid"] ?? 0,
        Expired: byStatus["Expired"] ?? 0,
        Refunded: byStatus["Refunded"] ?? 0,
      },
      totalRevenue: { amount: totalRevenue, currency },
    };
  }

  async getParticipants(eventId: string): Promise<ParticipantDTO[]> {
    const { rows } = await this.pool.query(
      `SELECT b.customer_id, tc.name AS category_name, t.code AS ticket_code, t.status AS ticket_status
       FROM bookings b
       JOIN ticket_categories tc ON tc.id = b.ticket_category_id
       JOIN tickets t ON t.booking_id = b.id
       WHERE b.event_id = $1 AND b.status = 'Paid'
       ORDER BY b.customer_id`,
      [eventId],
    );

    return rows.map((r) => ({
      customerId: r.customer_id,
      ticketCategory: r.category_name,
      ticketCode: r.ticket_code,
      checkInStatus: r.ticket_status === "CheckedIn" ? "CheckedIn" : "Active",
    }));
  }
}
