export interface RefundDTO {
  id: string;
  bookingId: string;
  customerId: string;
  amount: { amount: number; currency: string };
  status: string;
  reason?: string;
  rejectionReason?: string;
  paymentReference?: string;
  requestedAt: string;
}
