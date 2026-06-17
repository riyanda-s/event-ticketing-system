import { GetSalesReportQuery } from "../queries/get-sales-report.query";
import { IEventQueryService, SalesReportDTO } from "../../ports/event-query.interface";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";

export class GetSalesReportQueryHandler {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventQueryService: IEventQueryService,
  ) {}

  async execute(query: GetSalesReportQuery): Promise<SalesReportDTO> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== query.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    return this.eventQueryService.getSalesReport(query.eventId);
  }
}
