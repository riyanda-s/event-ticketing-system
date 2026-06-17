import { Router, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { AuthenticatedRequest, authMiddleware, requireRole } from "../middleware/auth.middleware";
import { CreateEventCommandHandler } from "../../application/event/handlers/create-event.handler";
import { PublishEventCommandHandler } from "../../application/event/handlers/publish-event.handler";
import { CancelEventCommandHandler } from "../../application/event/handlers/cancel-event.handler";
import { CreateTicketCategoryCommandHandler } from "../../application/event/handlers/create-ticket-category.handler";
import { DisableTicketCategoryCommandHandler } from "../../application/event/handlers/disable-ticket-category.handler";
import { GetAvailableEventsQueryHandler } from "../../application/event/handlers/get-available-events.handler";
import { GetEventDetailQueryHandler } from "../../application/event/handlers/get-event-detail.handler";
import { GetSalesReportQueryHandler } from "../../application/event/handlers/get-sales-report.handler";
import { GetParticipantsQueryHandler } from "../../application/event/handlers/get-participants.handler";
import { CreateEventCommand } from "../../application/event/commands/create-event.command";
import { PublishEventCommand } from "../../application/event/commands/publish-event.command";
import { CancelEventCommand } from "../../application/event/commands/cancel-event.command";
import { CreateTicketCategoryCommand } from "../../application/event/commands/create-ticket-category.command";
import { DisableTicketCategoryCommand } from "../../application/event/commands/disable-ticket-category.command";
import { GetAvailableEventsQuery } from "../../application/event/queries/get-available-events.query";
import { GetEventDetailQuery } from "../../application/event/queries/get-event-detail.query";
import { GetSalesReportQuery } from "../../application/event/queries/get-sales-report.query";
import { GetParticipantsQuery } from "../../application/event/queries/get-participants.query";

export function createEventRouter(deps: {
  createEventHandler: CreateEventCommandHandler;
  publishEventHandler: PublishEventCommandHandler;
  cancelEventHandler: CancelEventCommandHandler;
  createTicketCategoryHandler: CreateTicketCategoryCommandHandler;
  disableTicketCategoryHandler: DisableTicketCategoryCommandHandler;
  getAvailableEventsHandler: GetAvailableEventsQueryHandler;
  getEventDetailHandler: GetEventDetailQueryHandler;
  getSalesReportHandler: GetSalesReportQueryHandler;
  getParticipantsHandler: GetParticipantsQueryHandler;
}): Router {
  const router = Router();

  // GET /events — browse published events (public)
  router.get("/", async (req, res: Response, next: NextFunction) => {
    try {
      const query = new GetAvailableEventsQuery(
        req.query.date as string | undefined,
        req.query.location as string | undefined,
      );
      const events = await deps.getAvailableEventsHandler.execute(query);
      res.json(events);
    } catch (err) { next(err); }
  });

  // GET /events/:id — event detail (public)
  router.get("/:id", async (req, res: Response, next: NextFunction) => {
    try {
      const detail = await deps.getEventDetailHandler.execute(
        new GetEventDetailQuery(req.params.id),
      );
      if (!detail) { res.status(404).json({ error: "Event not found" }); return; }
      res.json(detail);
    } catch (err) { next(err); }
  });

  // POST /events — create event (organizer)
  router.post("/", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = randomUUID();
      await deps.createEventHandler.execute(
        new CreateEventCommand(
          id,
          req.body.name,
          req.body.description,
          new Date(req.body.startDate),
          new Date(req.body.endDate),
          req.body.location,
          req.body.maxCapacity,
          req.user!.id,
        ),
      );
      res.status(201).json({ id });
    } catch (err) { next(err); }
  });

  // POST /events/:id/publish — publish event (organizer)
  router.post("/:id/publish", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.publishEventHandler.execute(
        new PublishEventCommand(req.params.id, req.user!.id),
      );
      res.json({ message: "Event published successfully" });
    } catch (err) { next(err); }
  });

  // POST /events/:id/cancel — cancel event (organizer)
  router.post("/:id/cancel", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.cancelEventHandler.execute(
        new CancelEventCommand(req.params.id, req.user!.id),
      );
      res.json({ message: "Event cancelled successfully" });
    } catch (err) { next(err); }
  });

  // POST /events/:id/ticket-categories — add ticket category (organizer)
  router.post("/:id/ticket-categories", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const categoryId = randomUUID();
      await deps.createTicketCategoryHandler.execute(
        new CreateTicketCategoryCommand(
          categoryId,
          req.params.id,
          req.user!.id,
          req.body.name,
          req.body.priceAmount,
          req.body.priceCurrency ?? "IDR",
          req.body.quota,
          new Date(req.body.salesStart),
          new Date(req.body.salesEnd),
        ),
      );
      res.status(201).json({ id: categoryId });
    } catch (err) { next(err); }
  });

  // DELETE /events/:id/ticket-categories/:categoryId — disable category (organizer)
  router.delete("/:id/ticket-categories/:categoryId", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deps.disableTicketCategoryHandler.execute(
        new DisableTicketCategoryCommand(req.params.id, req.params.categoryId, req.user!.id),
      );
      res.json({ message: "Ticket category disabled" });
    } catch (err) { next(err); }
  });

  // GET /events/:id/sales-report — sales report (organizer)
  router.get("/:id/sales-report", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const report = await deps.getSalesReportHandler.execute(
        new GetSalesReportQuery(req.params.id, req.user!.id),
      );
      res.json(report);
    } catch (err) { next(err); }
  });

  // GET /events/:id/participants — participant list (organizer)
  router.get("/:id/participants", authMiddleware, requireRole("organizer"), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const participants = await deps.getParticipantsHandler.execute(
        new GetParticipantsQuery(req.params.id, req.user!.id),
      );
      res.json(participants);
    } catch (err) { next(err); }
  });

  return router;
}
