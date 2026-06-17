import { CheckInTicketCommand } from "../commands/check-in-ticket.command";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";

export class CheckInTicketCommandHandler {
  constructor(private readonly bookingRepository: IBookingRepository) {}

  async execute(command: CheckInTicketCommand): Promise<void> {
    const booking = await this.bookingRepository.findByTicketCode(command.ticketCode);

    if (!booking)
      throw new Error("Invalid ticket: ticket code not found");
    if (!booking.status.isPaid())
      throw new Error("Ticket is not valid for check-in");

    const ticket = booking.tickets.find((t) => t.code.value === command.ticketCode);
    if (!ticket) throw new Error("Invalid ticket: ticket code not found");

    if (ticket.eventId !== command.eventId)
      throw new Error("Ticket does not match this event");

    booking.checkInTicket(ticket.id, command.eventId, new Date());
    await this.bookingRepository.update(booking);
  }
}
