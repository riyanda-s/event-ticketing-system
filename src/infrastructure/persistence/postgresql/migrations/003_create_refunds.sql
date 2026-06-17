-- Migration 003: Refunds

CREATE TABLE IF NOT EXISTS refunds (
  id                UUID PRIMARY KEY,
  booking_id        UUID NOT NULL REFERENCES bookings(id),
  customer_id       VARCHAR(255) NOT NULL,
  amount_amount     NUMERIC(15, 2) NOT NULL,
  amount_currency   VARCHAR(10) NOT NULL DEFAULT 'IDR',
  status            VARCHAR(50) NOT NULL DEFAULT 'Requested',
  reason            TEXT,
  rejection_reason  TEXT,
  payment_reference VARCHAR(255),
  requested_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_id ON refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
