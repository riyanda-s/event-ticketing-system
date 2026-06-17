import { Router, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { AuthenticatedRequest, authMiddleware, requireRole } from "../middleware/auth.middleware";
import { RequestRefundCommandHandler } from "../../application/refund/handlers/request-refund.handler";
import { ApproveRefundCommandHandler } from "../../application/refund/handlers/approve-refund.handler";
import { RejectRefundCommandHandler } from "../../application/refund/handlers/reject-refund.handler";
import { MarkRefundPaidOutCommandHandler } from "../../application/refund/handlers/mark-refund-paid-out.handler";
import { RequestRefundCommand } from "../../application/refund/commands/request-refund.command";
import { ApproveRefundCommand } from "../../application/refund/commands/approve-refund.command";
import { RejectRefundCommand } from "../../application/refund/commands/reject-refund.command";
import { MarkRefundPaidOutCommand } from "../../application/refund/commands/mark-refund-paid-out.command";

export function createRefundRouter(deps: {
  requestRefundHandler: RequestRefundCommandHandler;
  approveRefundHandler: ApproveRefundCommandHandler;
  rejectRefundHandler: RejectRefundCommandHandler;
  markPaidOutHandler: MarkRefundPaidOutCommandHandler;
}): Router {
  const router = Router();

  // POST /refunds — request refund (customer)
  router.post("/", authMiddleware, requireRole("customer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = randomUUID();
      await deps.requestRefundHandler.execute(
        new RequestRefundCommand(id, req.body.bookingId, req.user!.id, req.body.reason),
      );
      res.status(201).json({ id });
    } catch (err) { next(err); }
  });

  // POST /refunds/:id/approve — approve refund (organizer)
  router.post("/:id/approve", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.approveRefundHandler.execute(
        new ApproveRefundCommand(req.params.id, req.user!.id),
      );
      res.json({ message: "Refund approved" });
    } catch (err) { next(err); }
  });

  // POST /refunds/:id/reject — reject refund (organizer)
  router.post("/:id/reject", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.rejectRefundHandler.execute(
        new RejectRefundCommand(req.params.id, req.user!.id, req.body.reason),
      );
      res.json({ message: "Refund rejected" });
    } catch (err) { next(err); }
  });

  // POST /refunds/:id/payout — process payout (admin)
  router.post("/:id/payout", authMiddleware, requireRole("admin"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.markPaidOutHandler.execute(
        new MarkRefundPaidOutCommand(req.params.id, req.body.bankAccount),
      );
      res.json({ message: "Refund paid out" });
    } catch (err) { next(err); }
  });

  return router;
}
