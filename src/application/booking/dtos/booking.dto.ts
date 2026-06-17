import { TicketDTO } from "./ticket.dto";

export interface BookingDTO {
  id: string;
  eventId: string;
  customerId: string;
  ticketCategoryId: string;
  quantity: number;
  totalPrice: { amount: number; currency: string };
  status: string;
  paymentDeadline: string;
  tickets: TicketDTO[];
}
