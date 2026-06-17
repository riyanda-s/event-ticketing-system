import { GetAvailableEventsQuery } from "../queries/get-available-events.query";
import { IEventQueryService, EventSummaryDTO } from "../../ports/event-query.interface";

export class GetAvailableEventsQueryHandler {
  constructor(private readonly eventQueryService: IEventQueryService) {}

  async execute(query: GetAvailableEventsQuery): Promise<EventSummaryDTO[]> {
    return this.eventQueryService.getAvailableEvents({
      date: query.date,
      location: query.location,
    });
  }
}
