import { GetParticipantsQuery } from "../queries/get-participants.query";
import { IEventQueryService, ParticipantDTO } from "../../ports/event-query.interface";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";

export class GetParticipantsQueryHandler {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly eventQueryService: IEventQueryService,
  ) {}

  async execute(query: GetParticipantsQuery): Promise<ParticipantDTO[]> {
    const event = await this.eventRepository.findById(query.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== query.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    return this.eventQueryService.getParticipants(query.eventId);
  }
}
