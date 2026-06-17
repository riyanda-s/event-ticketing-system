# Event Ticketing & Booking System

> EF234402 · Konstruksi Perangkat Lunak — Institut Teknologi Sepuluh Nopember

Backend system untuk manajemen tiket dan booking event, dibangun dengan **Clean Architecture** dan **Domain-Driven Design** tactical patterns.

📐 [Architecture Reference](https://riyanda-s.github.io/event-ticketing-system/)

---

## Authors

- [@riyanda-s](https://www.github.com/riyanda-s)

## Tech Stack

| Concern     | Choice                  |
| ----------- | ----------------------- |
| Language    | TypeScript (Node.js 18) |
| Framework   | Express.js              |
| Database    | PostgreSQL 16           |
| Test Runner | Jest + ts-jest          |

---

## Project Structure

```
src/
├── domain/               # Business logic — zero external dependencies
│   ├── shared/           # AggregateRoot, Entity, ValueObject, DomainEvent
│   ├── event/            # Event aggregate, TicketCategory entity
│   ├── booking/          # Booking aggregate, Ticket entity, Money VO
│   └── refund/           # Refund aggregate
├── application/          # Use cases: commands, queries, handlers, DTOs, ports
│   ├── event/
│   ├── booking/
│   ├── refund/
│   └── ports/            # IPaymentGateway, IRefundPaymentService, INotificationService
│                         # IEventQueryService, IBookingQueryService
├── infrastructure/       # PostgreSQL repos, query services, external service adapters
│   ├── persistence/
│   │   ├── postgresql/   # database.config, migrations, run-migrations
│   │   ├── repositories/ # PgEventRepository, PgBookingRepository, PgRefundRepository
│   │   └── queries/      # PgEventQueryService, PgBookingQueryService
│   └── services/         # StripePaymentGateway, BankRefundPaymentService, EmailNotificationService
└── presentation/         # REST API controllers, middleware
    ├── controllers/      # EventController, BookingController, TicketController, RefundController
    └── middleware/       # authMiddleware, requireRole, errorHandler

tests/
└── domain/               # Unit tests — domain layer only (50 tests)
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker (untuk PostgreSQL) **atau** PostgreSQL 16 ter-install manual

### 1. Clone & Install

```bash
git clone https://github.com/riyanda-s/event-ticketing-system.git
cd event-ticketing-system
npm install
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_ticketing
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
```

### 3. Jalankan PostgreSQL

**Menggunakan Docker (recommended):**

```bash
docker compose up -d
```

**Atau manual (jika PostgreSQL sudah ter-install):**

```bash
psql -U postgres -c "CREATE DATABASE event_ticketing;"
psql -U postgres -c "ALTER USER postgres PASSWORD 'postgres';"
```

### 4. Jalankan Migration

```bash
npm run migrate
```

Migration files di `src/infrastructure/persistence/postgresql/migrations/`:

- `001_create_events.sql` — tabel `events` dan `ticket_categories`
- `002_create_bookings.sql` — tabel `bookings` dan `tickets`
- `003_create_refunds.sql` — tabel `refunds`

### 5. Jalankan Server

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`.

### 6. Jalankan Tests

```bash
npm test
```

Output: **50 tests passing** dengan coverage domain layer.

---

## API Endpoints

### Authentication (Development)

Semua endpoint protected menggunakan header:

```
x-user-id: <user-id>
x-user-role: organizer | customer | gate_officer | admin
```

### Events

| Method | Endpoint                               | Role      | Deskripsi                                            |
| ------ | -------------------------------------- | --------- | ---------------------------------------------------- |
| GET    | `/events`                              | Public    | Browse published events (filter: `?date=&location=`) |
| GET    | `/events/:id`                          | Public    | Detail event + ticket categories                     |
| POST   | `/events`                              | organizer | Buat event baru                                      |
| POST   | `/events/:id/publish`                  | organizer | Publish event                                        |
| POST   | `/events/:id/cancel`                   | organizer | Cancel event                                         |
| POST   | `/events/:id/ticket-categories`        | organizer | Tambah ticket category                               |
| DELETE | `/events/:id/ticket-categories/:catId` | organizer | Disable ticket category                              |
| GET    | `/events/:id/sales-report`             | organizer | Laporan penjualan                                    |
| GET    | `/events/:id/participants`             | organizer | Daftar peserta                                       |

### Bookings

| Method | Endpoint               | Role     | Deskripsi                 |
| ------ | ---------------------- | -------- | ------------------------- |
| POST   | `/bookings`            | customer | Buat booking              |
| POST   | `/bookings/:id/pay`    | customer | Bayar booking             |
| GET    | `/bookings/my-tickets` | customer | Lihat tiket yang dimiliki |

### Tickets

| Method | Endpoint            | Role         | Deskripsi                 |
| ------ | ------------------- | ------------ | ------------------------- |
| POST   | `/tickets/check-in` | gate_officer | Validasi & check-in tiket |

### Refunds

| Method | Endpoint               | Role      | Deskripsi            |
| ------ | ---------------------- | --------- | -------------------- |
| POST   | `/refunds`             | customer  | Request refund       |
| POST   | `/refunds/:id/approve` | organizer | Approve refund       |
| POST   | `/refunds/:id/reject`  | organizer | Reject refund        |
| POST   | `/refunds/:id/payout`  | admin     | Proses payout refund |

### Admin

| Method | Endpoint                 | Role   | Deskripsi                             |
| ------ | ------------------------ | ------ | ------------------------------------- |
| GET    | `/health`                | Public | Health check                          |
| POST   | `/admin/expire-bookings` | admin  | Expire booking yang melewati deadline |

---

## Request & Response Examples

### POST /events

```bash
curl -X POST http://localhost:3000/events \
  -H "Content-Type: application/json" \
  -H "x-user-id: organizer-001" \
  -H "x-user-role: organizer" \
  -d '{
    "name": "Tech Conference 2027",
    "description": "Annual tech event di Jakarta",
    "startDate": "2027-01-15T09:00:00Z",
    "endDate": "2027-01-15T17:00:00Z",
    "location": "Jakarta Convention Center",
    "maxCapacity": 500
  }'
```

```json
{ "id": "745b23ac-088d-4de5-b400-a9a9ed92a613" }
```

### GET /events/:id

```json
{
  "id": "745b23ac-088d-4de5-b400-a9a9ed92a613",
  "name": "Tech Conference 2027",
  "status": "Published",
  "ticketCategories": [
    {
      "id": "9b351d13-34b3-4c9a-9929-06ff88c0d1e8",
      "name": "Regular",
      "price": { "amount": 150000, "currency": "IDR" },
      "quota": 100,
      "remainingQuota": 97,
      "saleStatus": "Available"
    }
  ]
}
```

### POST /tickets/check-in

```bash
curl -X POST http://localhost:3000/tickets/check-in \
  -H "Content-Type: application/json" \
  -H "x-user-id: officer-001" \
  -H "x-user-role: gate_officer" \
  -d '{"ticketCode": "TKT-MQHUCSFD-64G8X4-2", "eventId": "745b23ac-..."}'
```

```json
{ "message": "Check-in successful", "ticketCode": "TKT-MQHUCSFD-64G8X4-2" }
```

### GET /events/:id/sales-report

```json
{
  "eventId": "745b23ac-...",
  "categorySales": [
    { "name": "Regular", "sold": 3, "revenue": 450000, "currency": "IDR" }
  ],
  "bookingsByStatus": {
    "PendingPayment": 0,
    "Paid": 3,
    "Expired": 0,
    "Refunded": 1
  },
  "totalRevenue": { "amount": 450000, "currency": "IDR" }
}
```

---

## Implemented User Stories

| #   | User Story                     | Status |
| --- | ------------------------------ | ------ |
| 1   | Create Event                   | ✅     |
| 2   | Publish Event                  | ✅     |
| 3   | Cancel Event                   | ✅     |
| 4   | Create Ticket Category         | ✅     |
| 5   | Disable Ticket Category        | ✅     |
| 6   | View Available Events          | ✅     |
| 7   | View Event Details             | ✅     |
| 8   | Create Ticket Booking          | ✅     |
| 9   | Calculate Booking Total Price  | ✅     |
| 10  | Pay Booking                    | ✅     |
| 11  | Expire Booking                 | ✅     |
| 12  | View Purchased Tickets         | ✅     |
| 13  | Check In Ticket                | ✅     |
| 14  | Reject Invalid Ticket Check-in | ✅     |
| 15  | Request Refund                 | ✅     |
| 16  | Approve Refund                 | ✅     |
| 17  | Reject Refund                  | ✅     |
| 18  | Mark Refund as Paid Out        | ✅     |
| 19  | View Event Sales Report        | ✅     |
| 20  | View Event Participants        | ✅     |

---

## Implemented Domain Events

| Domain Event             | Raised When                                    |
| ------------------------ | ---------------------------------------------- |
| `EventCreated`           | Event berhasil dibuat                          |
| `EventPublished`         | Event dipublish                                |
| `EventCancelled`         | Event dibatalkan                               |
| `TicketCategoryCreated`  | Ticket category ditambahkan ke event           |
| `TicketCategoryDisabled` | Ticket category dinonaktifkan                  |
| `TicketReserved`         | Booking berhasil dibuat (quota direservasi)    |
| `BookingPaid`            | Booking berhasil dibayar                       |
| `BookingExpired`         | Booking kadaluarsa (payment deadline terlewat) |
| `TicketCheckedIn`        | Tiket berhasil di-check-in                     |
| `RefundRequested`        | Customer mengajukan refund                     |
| `RefundApproved`         | Organizer menyetujui refund                    |
| `RefundRejected`         | Organizer menolak refund                       |
| `RefundPaidOut`          | Admin memproses pembayaran refund              |

---

## Implemented Application Service Interfaces

| Interface               | Lokasi               | Implementasi               |
| ----------------------- | -------------------- | -------------------------- |
| `IPaymentGateway`       | `application/ports/` | `StripePaymentGateway`     |
| `IRefundPaymentService` | `application/ports/` | `BankRefundPaymentService` |
| `INotificationService`  | `application/ports/` | `EmailNotificationService` |
| `IEventQueryService`    | `application/ports/` | `PgEventQueryService`      |
| `IBookingQueryService`  | `application/ports/` | `PgBookingQueryService`    |

---

## Aggregates & Business Rules

### Event Aggregate

- Event dibuat dengan status `Draft`
- Hanya bisa di-publish jika memiliki minimal satu ticket category aktif
- Total quota semua kategori tidak boleh melebihi `maxCapacity`
- Event `Cancelled` tidak bisa di-publish kembali
- Event `Completed` tidak bisa di-cancel
- Saat event di-cancel, semua paid booking otomatis dibuatkan refund request

### Booking Aggregate

- Booking dibuat dengan status `PendingPayment` dan deadline 15 menit
- Satu customer hanya boleh punya satu active booking per event
- Pembayaran harus sesuai total harga dan sebelum deadline
- Booking expired otomatis melepas quota yang direservasi
- Refund tidak bisa diminta jika ada tiket yang sudah di-check-in

### Refund Aggregate

- Status lifecycle: `Requested` → `Approved` → `PaidOut`
- `Requested` → `Rejected` (terminal, tidak bisa diubah lagi)
- `PaidOut` adalah terminal state — tidak bisa approve/reject ulang
- Rejection wajib menyertakan alasan

### Ticket Entity

- Tiket di-generate setelah booking dibayar dengan unique code
- Status: `Active` → `CheckedIn` (terminal per event day)
- Status: `Active` → `Cancelled` (saat refund diapprove)
- Tiket yang sudah `CheckedIn` tidak bisa di-check-in ulang

---

## Ubiquitous Language Glossary

| Term                 | Meaning                                                  |
| -------------------- | -------------------------------------------------------- |
| **Event**            | Kegiatan yang diorganisir dan dihadiri customer          |
| **Event Organizer**  | User yang membuat dan mengelola event                    |
| **Customer**         | User yang memesan dan membeli tiket                      |
| **Gate Officer**     | User yang memvalidasi tiket saat check-in                |
| **Ticket Category**  | Jenis tiket (Regular, VIP, Early Bird)                   |
| **Quota**            | Jumlah maksimal tiket yang tersedia dalam satu kategori  |
| **Booking**          | Reservasi sementara sebelum pembayaran selesai           |
| **PendingPayment**   | Status booking yang belum dibayar                        |
| **Paid**             | Status booking yang sudah dibayar                        |
| **Expired**          | Status booking yang payment deadline-nya terlewat        |
| **Ticket**           | Bukti kehadiran yang digenerate setelah booking dibayar  |
| **Ticket Code**      | Kode unik untuk identifikasi dan validasi tiket          |
| **Check-in**         | Proses validasi tiket saat peserta memasuki venue        |
| **Refund**           | Proses pengembalian uang ke customer                     |
| **Money**            | Value object yang merepresentasikan jumlah dan mata uang |
| **Sales Period**     | Periode selama ticket category bisa dibeli               |
| **Payment Deadline** | Batas waktu pembayaran setelah booking dibuat (15 menit) |
