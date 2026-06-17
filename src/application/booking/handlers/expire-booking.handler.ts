import { ExpireBookingsCommand } from "../commands/expire-booking.command";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";

export class ExpireBookingsCommandHandler {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly eventRepository: IEventRepository,
  ) {}

  async execute(command: ExpireBookingsCommand): Promise<void> {
    const expiredBookings = await this.bookingRepository.findPendingExpired(command.now);

    for (const booking of expiredBookings) {
      booking.expire(command.now);

      // Release reserved quota back to ticket category
      const event = await this.eventRepository.findById(booking.eventId);
      if (event) {
        const category = event.findTicketCategory(booking.ticketCategoryId);
        if (category) {
          category.releaseQuota(booking.quantity);
          await this.eventRepository.update(event);
        }
      }

      await this.bookingRepository.update(booking);
    }
  }
}
