import { CreateBookingCommand } from "../commands/create-booking.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { Booking } from "../../../domain/booking/aggregates/booking.aggregate";

export class CreateBookingCommandHandler {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly bookingRepository: IBookingRepository,
  ) {}

  async execute(command: CreateBookingCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) throw new Error("Event not found");
    if (!event.status.isPublished())
      throw new Error("Event is not available for booking");

    const category = event.findTicketCategory(command.ticketCategoryId);
    if (!category) throw new Error("Ticket category not found");

    const now = new Date();
    if (!category.isAvailableForSale(now))
      throw new Error("Ticket category is not available for sale at this time");

    if (command.quantity > category.remainingQuota)
      throw new Error("Not enough remaining ticket quota");

    const existing = await this.bookingRepository.findByCustomerAndEvent(
      command.customerId,
      command.eventId,
    );
    if (existing && existing.status.isPendingPayment())
      throw new Error("Customer already has an active booking for this event");

    category.reserveQuota(command.quantity);

    const booking = Booking.create(
      {
        id: command.id,
        eventId: command.eventId,
        customerId: command.customerId,
        ticketCategoryId: command.ticketCategoryId,
        quantity: command.quantity,
        unitPrice: category.price,
      },
      now,
    );

    await this.eventRepository.update(event);
    await this.bookingRepository.save(booking);
  }
}
