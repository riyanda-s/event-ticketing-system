export interface TicketDTO {
  id: string;
  bookingId: string;
  eventId: string;
  code: string;
  status: string;
  checkedInAt?: string;
}
