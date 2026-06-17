export interface PaymentResult {
  transactionId: string;
  status: "success" | "failed";
}

export interface IPaymentGateway {
  charge(
    amount: number,
    currency: string,
    paymentToken: string,
  ): Promise<PaymentResult>;
}
