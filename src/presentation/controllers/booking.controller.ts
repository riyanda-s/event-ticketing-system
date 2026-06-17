import { Router, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { AuthenticatedRequest, authMiddleware, requireRole } from "../middleware/auth.middleware";
import { CreateBookingCommandHandler } from "../../application/booking/handlers/create-booking.handler";
import { PayBookingCommandHandler } from "../../application/booking/handlers/pay-booking.handler";
import { GetCustomerTicketsQueryHandler } from "../../application/booking/handlers/get-customer-tickets.handler";
import { CreateBookingCommand } from "../../application/booking/commands/create-booking.command";
import { PayBookingCommand } from "../../application/booking/commands/pay-booking.command";
import { GetCustomerTicketsQuery } from "../../application/booking/queries/get-customer-tickets.query";

export function createBookingRouter(deps: {
  createBookingHandler: CreateBookingCommandHandler;
  payBookingHandler: PayBookingCommandHandler;
  getCustomerTicketsHandler: GetCustomerTicketsQueryHandler;
}): Router {
  const router = Router();

  // POST /bookings — create booking (customer)
  router.post("/", authMiddleware, requireRole("customer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = randomUUID();
      await deps.createBookingHandler.execute(
        new CreateBookingCommand(
          id,
          req.body.eventId,
          req.user!.id,
          req.body.ticketCategoryId,
          req.body.quantity,
        ),
      );
      res.status(201).json({ id });
    } catch (err) { next(err); }
  });

  // POST /bookings/:id/pay — pay booking (customer)
  router.post("/:id/pay", authMiddleware, requireRole("customer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.payBookingHandler.execute(
        new PayBookingCommand(req.params.id, req.user!.id, req.body.paymentToken),
      );
      res.json({ message: "Payment successful" });
    } catch (err) { next(err); }
  });

  // GET /bookings/my-tickets — view purchased tickets (customer)
  router.get("/my-tickets", authMiddleware, requireRole("customer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tickets = await deps.getCustomerTicketsHandler.execute(
        new GetCustomerTicketsQuery(req.user!.id),
      );
      res.json(tickets);
    } catch (err) { next(err); }
  });

  return router;
}
