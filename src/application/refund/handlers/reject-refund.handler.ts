import { RejectRefundCommand } from "../commands/reject-refund.command";
import { IRefundRepository } from "../../../domain/refund/repositories/refund.repository.interface";
import { INotificationService } from "../../ports/notification.interface";

export class RejectRefundCommandHandler {
  constructor(
    private readonly refundRepository: IRefundRepository,
    private readonly notificationService: INotificationService,
  ) {}

  async execute(command: RejectRefundCommand): Promise<void> {
    const refund = await this.refundRepository.findById(command.refundId);
    if (!refund) throw new Error("Refund not found");

    refund.reject(command.rejectionReason);
    await this.refundRepository.update(refund);

    await this.notificationService.sendEmail(
      refund.customerId,
      "Refund Rejected",
      `Your refund request ${refund.id.value} has been rejected. Reason: ${command.rejectionReason}`,
    );
  }
}
