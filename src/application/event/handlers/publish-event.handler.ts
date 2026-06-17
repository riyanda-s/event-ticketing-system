import { PublishEventCommand } from "../commands/publish-event.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";

export class PublishEventCommandHandler {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: PublishEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== command.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    event.publish();
    await this.eventRepository.update(event);
  }
}
