import { Pool } from "pg";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";
import { Event } from "../../../domain/event/aggregates/event.aggregate";
import { EventStatus } from "../../../domain/event/value-objects/event-status.vo";
import { TicketCategory } from "../../../domain/event/entities/ticket-category.entity";
import { TicketCategoryStatus } from "../../../domain/event/value-objects/ticket-category-status.vo";
import { Money } from "../../../domain/booking/value-objects/money.vo";

export class PgEventRepository implements IEventRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Event | null> {
    const eventRow = await this.pool
      .query("SELECT * FROM events WHERE id = $1", [id])
      .then((r) => r.rows[0]);
    if (!eventRow) return null;

    const catRows = await this.pool
      .query("SELECT * FROM ticket_categories WHERE event_id = $1", [id])
      .then((r) => r.rows);

    return this.mapToEvent(eventRow, catRows);
  }

  async findAllPublished(): Promise<Event[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM events WHERE status = 'Published' ORDER BY start_date",
    );
    const events: Event[] = [];
    for (const row of rows) {
      const catRows = await this.pool
        .query("SELECT * FROM ticket_categories WHERE event_id = $1", [row.id])
        .then((r) => r.rows);
      events.push(this.mapToEvent(row, catRows));
    }
    return events;
  }

  async save(event: Event): Promise<void> {
    await this.pool.query(
      `INSERT INTO events (id, name, description, start_date, end_date, location, max_capacity, organizer_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        event.id.value, event.name, event.description,
        event.startDate, event.endDate, event.location,
        event.maxCapacity, event.organizerId, event.status.value,
      ],
    );
  }

  async update(event: Event): Promise<void> {
    await this.pool.query(
      `UPDATE events SET name=$2, description=$3, start_date=$4, end_date=$5,
       location=$6, max_capacity=$7, organizer_id=$8, status=$9, updated_at=NOW()
       WHERE id=$1`,
      [
        event.id.value, event.name, event.description,
        event.startDate, event.endDate, event.location,
        event.maxCapacity, event.organizerId, event.status.value,
      ],
    );

    // Upsert all ticket categories
    for (const cat of event.ticketCategories) {
      await this.pool.query(
        `INSERT INTO ticket_categories
         (id, event_id, name, price_amount, price_currency, quota, remaining_quota, sales_start, sales_end, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           name=$3, price_amount=$4, price_currency=$5, quota=$6,
           remaining_quota=$7, sales_start=$8, sales_end=$9, status=$10, updated_at=NOW()`,
        [
          cat.id, event.id.value, cat.name,
          cat.price.amount, cat.price.currency,
          cat.quota, cat.remainingQuota,
          cat.salesStart, cat.salesEnd, cat.status.value,
        ],
      );
    }
  }

  private mapToEvent(row: any, catRows: any[]): Event {
    const categories = catRows.map((c) =>
      TicketCategory.reconstitute({
        id: c.id,
        name: c.name,
        price: Money.of(parseFloat(c.price_amount), c.price_currency),
        quota: c.quota,
        remainingQuota: c.remaining_quota,
        salesStart: c.sales_start,
        salesEnd: c.sales_end,
        status: new TicketCategoryStatus(c.status),
      }),
    );

    return Event.reconstitute(
      {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        location: row.location,
        maxCapacity: row.max_capacity,
        organizerId: row.organizer_id,
        status: new EventStatus(row.status),
      },
      categories,
    );
  }
}
