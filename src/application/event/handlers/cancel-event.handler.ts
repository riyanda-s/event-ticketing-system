import { CancelEventCommand } from "../commands/cancel-event.command";
import { IEventRepository } from "../../../domain/event/repositories/event.repository.interface";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { Refund } from "../../../domain/refund/aggregates/refund.aggregate";
import { Money } from "../../../domain/booking/value-objects/money.vo";
import { randomUUID } from "crypto";

export class CancelEventCommandHandler {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly bookingRepository: IBookingRepository,
    private readonly refundRepository: IRefundRepository,
  ) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) throw new Error("Event not found");
    if (event.organizerId !== command.organizerId)
      throw new Error("Forbidden: you are not the organizer of this event");

    event.cancel();
    await this.eventRepository.update(event);

    // Auto-create refund requests for all paid bookings
    const paidBookings = await this.bookingRepository.findPaidByEventId(command.eventId);
    for (const booking of paidBookings) {
      const refund = Refund.create({
        id: randomUUID(),
        bookingId: booking.id.value,
        customerId: booking.customerId,
        amount: booking.totalPrice,
        reason: "Event cancelled by organizer",
      });
      await this.refundRepository.save(refund);
    }
  }
}
