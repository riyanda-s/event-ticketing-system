import { DisableTicketCategoryCommand } from "../commands/disable-ticket-category.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";

export class DisableTicketCategoryCommandHandler {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: DisableTicketCategoryCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== command.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    event.disableTicketCategory(command.categoryId);
    await this.eventRepository.update(event);
  }
}
