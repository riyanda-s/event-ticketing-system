import { PayBookingCommand } from "../commands/pay-booking.command";
import { IBookingRepository } from "../../../domain/booking/repositories/booking.repository.interface";
import { IPaymentGateway } from "../../ports/payment-gateway.interface";
import { INotificationService } from "../../ports/notification.interface";
import { TicketCodeGeneratorService } from "../../../domain/booking/domain-services/ticket-code-generator.service";

export class PayBookingCommandHandler {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly paymentGateway: IPaymentGateway,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: PayBookingCommand): Promise<void> {
    const booking = await this.bookingRepository.findById(command.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.customerId !== command.customerId)
      throw new Error("Forbidden: booking does not belong to this customer");

    const now = new Date();

    // Process payment through gateway
    const paymentResult = await this.paymentGateway.charge(
      booking.totalPrice.amount,
      booking.totalPrice.currency,
      command.paymentToken,
    );
    if (paymentResult.status !== "success")
      throw new Error("Payment failed");

    // Generate ticket codes and pay
    const ticketCodes = TicketCodeGeneratorService.generateBatch(
      booking.id.value,
      booking.quantity,
    );
    booking.pay(booking.totalPrice, ticketCodes, now);
    await this.bookingRepository.update(booking);

    // Send confirmation notification
    await this.notificationService.sendEmail(
      command.customerId,
      "Booking Confirmed",
      `Your booking ${booking.id.value} has been confirmed. Transaction ID: ${paymentResult.transactionId}`,
    );
  }
}
