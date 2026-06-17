import { GetEventDetailQuery } from "../queries/get-event-detail.query";
import { IEventQueryService, EventDetailDTO } from "../../ports/event-query.interface";

export class GetEventDetailQueryHandler {
  constructor(private readonly eventQueryService: IEventQueryService) {}

  async execute(query: GetEventDetailQuery): Promise<EventDetailDTO | null> {
    return this.eventQueryService.getEventDetail(query.eventId, new Date());
  }
}
