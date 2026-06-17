import { Pool } from "pg";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { Refund } from "../../../domain/refund/aggregates/refund.aggregate";
import { RefundStatus } from "../../../domain/refund/value-objects/refund-status.vo";
import { Money } from "../../../domain/booking/value-objects/money.vo";

export class PgRefundRepository implements IRefundRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Refund | null> {
    const row = await this.pool
      .query("SELECT * FROM refunds WHERE id=$1", [id])
      .then((r) => r.rows[0]);
    return row ? this.mapToRefund(row) : null;
  }

  async findByBookingId(bookingId: string): Promise<Refund | null> {
    const row = await this.pool
      .query("SELECT * FROM refunds WHERE booking_id=$1 LIMIT 1", [bookingId])
      .then((r) => r.rows[0]);
    return row ? this.mapToRefund(row) : null;
  }

  async findAllApproved(): Promise<Refund[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM refunds WHERE status='Approved' ORDER BY requested_at",
    );
    return rows.map(this.mapToRefund.bind(this));
  }

  async save(refund: Refund): Promise<void> {
    await this.pool.query(
      `INSERT INTO refunds
       (id, booking_id, customer_id, amount_amount, amount_currency, status, reason, requested_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        refund.id.value, refund.bookingId, refund.customerId,
        refund.amount.amount, refund.amount.currency,
        refund.status.value, refund.reason ?? null, refund.requestedAt,
      ],
    );
  }

  async update(refund: Refund): Promise<void> {
    await this.pool.query(
      `UPDATE refunds SET
       status=$2, rejection_reason=$3, payment_reference=$4, updated_at=NOW()
       WHERE id=$1`,
      [
        refund.id.value, refund.status.value,
        refund.rejectionReason ?? null, refund.paymentReference ?? null,
      ],
    );
  }

  private mapToRefund(row: any): Refund {
    return Refund.reconstitute(
      row.id,
      row.booking_id,
      row.customer_id,
      Money.of(parseFloat(row.amount_amount), row.amount_currency),
      new RefundStatus(row.status),
      row.requested_at,
      row.reason ?? undefined,
      row.rejection_reason ?? undefined,
      row.payment_reference ?? undefined,
    );
  }
}
