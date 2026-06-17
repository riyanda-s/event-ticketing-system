import express from "express";
import { pool } from "./infrastructure/persistence/postgresql/database.config";

// Repositories
import { PgEventRepository } from "./infrastructure/persistence/repositories/pg-event.repository";
import { PgBookingRepository } from "./infrastructure/persistence/repositories/pg-booking.repository";
import { PgRefundRepository } from "./infrastructure/persistence/repositories/pg-refund.repository";

// Query Services
import { PgEventQueryService } from "./infrastructure/persistence/queries/pg-event-query.service";
import { PgBookingQueryService } from "./infrastructure/persistence/queries/pg-booking-query.service";

// External Services
import { StripePaymentGateway } from "./infrastructure/services/stripe-payment-gateway.service";
import { BankRefundPaymentService } from "./infrastructure/services/bank-refund-payment.service";
import { EmailNotificationService } from "./infrastructure/services/email-notification.service";

// Command Handlers
import { CreateEventCommandHandler } from "./application/event/handlers/create-event.handler";
import { PublishEventCommandHandler } from "./application/event/handlers/publish-event.handler";
import { CancelEventCommandHandler } from "./application/event/handlers/cancel-event.handler";
import { CreateTicketCategoryCommandHandler } from "./application/event/handlers/create-ticket-category.handler";
import { DisableTicketCategoryCommandHandler } from "./application/event/handlers/disable-ticket-category.handler";
import { CreateBookingCommandHandler } from "./application/booking/handlers/create-booking.handler";
import { PayBookingCommandHandler } from "./application/booking/handlers/pay-booking.handler";
import { ExpireBookingsCommandHandler } from "./application/booking/handlers/expire-booking.handler";
import { CheckInTicketCommandHandler } from "./application/booking/handlers/check-in-ticket.handler";
import { RequestRefundCommandHandler } from "./application/refund/handlers/request-refund.handler";
import { ApproveRefundCommandHandler } from "./application/refund/handlers/approve-refund.handler";
import { RejectRefundCommandHandler } from "./application/refund/handlers/reject-refund.handler";
import { MarkRefundPaidOutCommandHandler } from "./application/refund/handlers/mark-refund-paid-out.handler";

// Query Handlers
import { GetAvailableEventsQueryHandler } from "./application/event/handlers/get-available-events.handler";
import { GetEventDetailQueryHandler } from "./application/event/handlers/get-event-detail.handler";
import { GetSalesReportQueryHandler } from "./application/event/handlers/get-sales-report.handler";
import { GetParticipantsQueryHandler } from "./application/event/handlers/get-participants.handler";
import { GetCustomerTicketsQueryHandler } from "./application/booking/handlers/get-customer-tickets.handler";

// Routers
import { createEventRouter } from "./presentation/controllers/event.controller";
import { createBookingRouter } from "./presentation/controllers/booking.controller";
import { createTicketRouter } from "./presentation/controllers/ticket.controller";
import { createRefundRouter } from "./presentation/controllers/refund.controller";
import { errorHandler } from "./presentation/middleware/error-handler.middleware";
import { authMiddleware, requireRole, AuthenticatedRequest } from "./presentation/middleware/auth.middleware";
import { ExpireBookingsCommand } from "./application/booking/commands/expire-booking.command";
import { Response, NextFunction } from "express";

export function createApp() {
  // ── Infrastructure ─────────────────────────────────────────────────
  const eventRepo = new PgEventRepository(pool);
  const bookingRepo = new PgBookingRepository(pool);
  const refundRepo = new PgRefundRepository(pool);
  const eventQuerySvc = new PgEventQueryService(pool);
  const bookingQuerySvc = new PgBookingQueryService(pool);
  const paymentGateway = new StripePaymentGateway();
  const refundPaymentSvc = new BankRefundPaymentService();
  const notificationSvc = new EmailNotificationService();

  // ── Application ────────────────────────────────────────────────────
  const handlers = {
    createEventHandler: new CreateEventCommandHandler(eventRepo),
    publishEventHandler: new PublishEventCommandHandler(eventRepo),
    cancelEventHandler: new CancelEventCommandHandler(eventRepo, bookingRepo, refundRepo),
    createTicketCategoryHandler: new CreateTicketCategoryCommandHandler(eventRepo),
    disableTicketCategoryHandler: new DisableTicketCategoryCommandHandler(eventRepo),
    createBookingHandler: new CreateBookingCommandHandler(eventRepo, bookingRepo),
    payBookingHandler: new PayBookingCommandHandler(bookingRepo, paymentGateway, notificationSvc),
    expireBookingsHandler: new ExpireBookingsCommandHandler(bookingRepo, eventRepo),
    checkInTicketHandler: new CheckInTicketCommandHandler(bookingRepo),
    requestRefundHandler: new RequestRefundCommandHandler(bookingRepo, refundRepo),
    approveRefundHandler: new ApproveRefundCommandHandler(refundRepo, bookingRepo, notificationSvc),
    rejectRefundHandler: new RejectRefundCommandHandler(refundRepo, notificationSvc),
    markPaidOutHandler: new MarkRefundPaidOutCommandHandler(refundRepo, refundPaymentSvc, notificationSvc),
    getAvailableEventsHandler: new GetAvailableEventsQueryHandler(eventQuerySvc),
    getEventDetailHandler: new GetEventDetailQueryHandler(eventQuerySvc),
    getSalesReportHandler: new GetSalesReportQueryHandler(eventRepo, eventQuerySvc),
    getParticipantsHandler: new GetParticipantsQueryHandler(eventRepo, eventQuerySvc),
    getCustomerTicketsHandler: new GetCustomerTicketsQueryHandler(bookingQuerySvc),
  };

  // ── Express App ────────────────────────────────────────────────────
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Admin: trigger booking expiry (can also be scheduled via cron)
  app.post(
    "/admin/expire-bookings",
    authMiddleware,
    requireRole("admin"),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        await handlers.expireBookingsHandler.execute(new ExpireBookingsCommand(new Date()));
        res.json({ message: "Expired bookings processed" });
      } catch (err) { next(err); }
    },
  );

  // Resource routes
  app.use("/events", createEventRouter(handlers));
  app.use("/bookings", createBookingRouter(handlers));
  app.use("/tickets", createTicketRouter(handlers));
  app.use("/refunds", createRefundRouter(handlers));

  app.use(errorHandler);
  return app;
}
