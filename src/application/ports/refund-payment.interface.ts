export interface RefundPayoutResult {
  referenceId: string;
  status: "success" | "failed";
}

export interface IRefundPaymentService {
  processPayout(
    amount: number,
    currency: string,
    bankAccount: string,
  ): Promise<RefundPayoutResult>;
}
