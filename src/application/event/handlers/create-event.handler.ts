import { CreateEventCommand } from "../commands/create-event.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";
import { Event } from "../../../domain/event/aggregates/event.aggregate";

export class CreateEventCommandHandler {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: CreateEventCommand): Promise<void> {
    const event = Event.create({
      id: command.id,
      name: command.name,
      description: command.description,
      startDate: command.startDate,
      endDate: command.endDate,
      location: command.location,
      maxCapacity: command.maxCapacity,
      organizerId: command.organizerId,
    });
    await this.eventRepository.save(event);
  }
}
