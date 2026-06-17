import { IRefundPaymentService, RefundPayoutResult } from "../../application/ports/refund-payment.interface";

/**
 * Stub implementation of IRefundPaymentService.
 * Replace with a real bank transfer SDK/API in production.
 */
export class BankRefundPaymentService implements IRefundPaymentService {
  async processPayout(
    amount: number,
    currency: string,
    bankAccount: string,
  ): Promise<RefundPayoutResult> {
    // TODO: Replace with real bank transfer API call
    console.log(`[BankRefund] Sending ${currency} ${amount} to account ${bankAccount}`);
    return { referenceId: `REF-${Date.now()}`, status: "success" };
  }
}
