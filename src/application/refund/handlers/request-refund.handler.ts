import { RequestRefundCommand } from "../commands/request-refund.command";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { Refund } from "../../../domain/refund/aggregates/refund.aggregate";

export class RequestRefundCommandHandler {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly refundRepository: IRefundRepository,
  ) {}

  async execute(command: RequestRefundCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.customerId !== command.customerId)
      throw new Error("Forbidden: booking does not belong to this customer");
    if (!booking.status.isPaid())
      throw new Error("Refund can only be requested for a paid booking");
    if (booking.hasCheckedInTickets())
      throw new Error("Refund cannot be requested: some tickets have already been checked in");

    const refund = Refund.create({
      id: command.id,
      bookingId: command.bookingId,
      customerId: command.customerId,
      amount: booking.totalPrice,
      reason: command.reason,
    });
    await this.refundRepository.save(refund);
  }
}
