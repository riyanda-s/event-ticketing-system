-- Migration 002: Bookings and Tickets

CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID PRIMARY KEY,
  event_id              UUID NOT NULL,
  customer_id           VARCHAR(255) NOT NULL,
  ticket_category_id    UUID NOT NULL REFERENCES ticket_categories(id),
  quantity              INT NOT NULL CHECK (quantity > 0),
  total_price_amount    NUMERIC(15, 2) NOT NULL,
  total_price_currency  VARCHAR(10) NOT NULL DEFAULT 'IDR',
  status                VARCHAR(50) NOT NULL DEFAULT 'PendingPayment',
  payment_deadline      TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id             VARCHAR(255) PRIMARY KEY,
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL,
  code           VARCHAR(100) NOT NULL UNIQUE,
  status         VARCHAR(50) NOT NULL DEFAULT 'Active',
  checked_in_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);
