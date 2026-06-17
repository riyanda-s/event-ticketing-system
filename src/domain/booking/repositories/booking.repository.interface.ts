import { Booking } from "../aggregates/booking.aggregate";

export interface IBookingRepository {
  findById(id: string): Promise<Booking | null>;
  findByCustomerAndEvent(customerId: string, eventId: string): Promise<Booking | null>;
  findPendingExpired(now: Date): Promise<Booking[]>;
  findPaidByEventId(eventId: string): Promise<Booking[]>;
  findByTicketCode(ticketCode: string): Promise<Booking | null>;
  save(booking: Booking): Promise<void>;
  update(booking: Booking): Promise<void>;
}
