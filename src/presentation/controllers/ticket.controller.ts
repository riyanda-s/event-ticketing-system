import { Router, Response, NextFunction } from "express";
import { AuthenticatedRequest, authMiddleware, requireRole } from "../middleware/auth.middleware";
import { CheckInTicketCommandHandler } from "../../application/booking/handlers/check-in-ticket.handler";
import { CheckInTicketCommand } from "../../application/booking/commands/check-in-ticket.command";

export function createTicketRouter(deps: {
  checkInTicketHandler: CheckInTicketCommandHandler;
}): Router {
  const router = Router();

  // POST /tickets/check-in — validate & check in ticket (gate officer)
  router.post("/check-in", authMiddleware, requireRole("gate_officer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.checkInTicketHandler.execute(
        new CheckInTicketCommand(
          req.body.ticketCode,
          req.body.eventId,
          req.user!.id,
        ),
      );
      res.json({ message: "Check-in successful", ticketCode: req.body.ticketCode });
    } catch (err) { next(err); }
  });

  return router;
}
