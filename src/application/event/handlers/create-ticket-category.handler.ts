import { CreateTicketCategoryCommand } from "../commands/create-ticket-category.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";
import { Money } from "../../../domain/booking/value-objects/money.vo";

export class CreateTicketCategoryCommandHandler {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: CreateTicketCategoryCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== command.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    event.addTicketCategory({
      id: command.id,
      name: command.name,
      price: Money.of(command.priceAmount, command.priceCurrency),
      quota: command.quota,
      salesStart: command.salesStart,
      salesEnd: command.salesEnd,
    });
    await this.eventRepository.update(event);
  }
}
