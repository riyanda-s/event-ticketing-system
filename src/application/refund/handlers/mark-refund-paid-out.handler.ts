import { MarkRefundPaidOutCommand } from "../commands/mark-refund-paid-out.command";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { IRefundPaymentService } from "../../ports/refund-payment.interface";
import { INotificationService } from "../../ports/notification.interface";

export class MarkRefundPaidOutCommandHandler {
  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly refundPaymentService: IRefundPaymentService,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: MarkRefundPaidOutCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) throw new Error("Refund not found");

    const payoutResult = await this.refundPaymentService.processPayout(
      refund.amount.amount,
      refund.amount.currency,
      command.bankAccount,
    );
    if (payoutResult.status !== "success")
      throw new Error("Refund payout processing failed");

    refund.markAsPaidOut(payoutResult.referenceId);
    await this.refundRepository.update(refund);

    await this.notificationService.sendEmail(
      refund.customerId,
      "Refund Paid Out",
      `Your refund ${refund.id.value} of ${refund.amount.currency} ${refund.amount.amount} has been transferred. Reference: ${payoutResult.referenceId}`,
    );
  }
}
