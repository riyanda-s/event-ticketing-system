export interface CustomerTicketDTO {
  ticketId: string;
  bookingId: string;
  eventId: string;
  ticketCode: string;
  ticketStatus: string;
  checkedInAt?: string;
  bookingStatus: string;
}

export interface IBookingQueryService {
  getCustomerTickets(customerId: string): Promise<CustomerTicketDTO[]>;
}
