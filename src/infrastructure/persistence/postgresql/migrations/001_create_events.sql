-- Migration 001: Events and Ticket Categories

CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT NOT NULL,
  start_date    TIMESTAMPTZ NOT NULL,
  end_date      TIMESTAMPTZ NOT NULL,
  location      VARCHAR(255) NOT NULL,
  max_capacity  INT NOT NULL CHECK (max_capacity > 0),
  organizer_id  VARCHAR(255) NOT NULL,
  status        VARCHAR(50) NOT NULL DEFAULT 'Draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_categories (
  id               UUID PRIMARY KEY,
  event_id         UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  price_amount     NUMERIC(15, 2) NOT NULL CHECK (price_amount >= 0),
  price_currency   VARCHAR(10) NOT NULL DEFAULT 'IDR',
  quota            INT NOT NULL CHECK (quota > 0),
  remaining_quota  INT NOT NULL CHECK (remaining_quota >= 0),
  sales_start      TIMESTAMPTZ NOT NULL,
  sales_end        TIMESTAMPTZ NOT NULL,
  status           VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_categories_event_id ON ticket_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
