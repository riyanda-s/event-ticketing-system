import { ApproveRefundCommand } from "../commands/approve-refund.command";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { INotificationService } from "../../ports/notification.interface";

export class ApproveRefundCommandHandler {
  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly bookingRepository: IBookingRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: ApproveRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) throw new Error("Refund not found");

    const booking = await this.bookingRepository.findById(refund.bookingId);
    if (!booking) throw new Error("Booking not found");

    refund.approve();
    booking.cancelAllTickets();
    booking.markRefunded();

    await this.refundRepository.update(refund);
    await this.bookingRepository.update(booking);

    await this.notificationService.sendEmail(
      refund.customerId,
      "Refund Approved",
      `Your refund request ${refund.id.value} has been approved. Amount: ${refund.amount.currency} ${refund.amount.amount}`,
    );
  }
}
