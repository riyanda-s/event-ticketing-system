import { Refund } from "../aggregates/refund.aggregate";

export interface IRefundRepository {
  findById(id: string): Promise<Refund | null>;
  findByBookingId(bookingId: string): Promise<Refund | null>;
  findAllApproved(): Promise<Refund[]>;
  save(refund: Refund): Promise<void>;
  update(refund: Refund): Promise<void>;
}
