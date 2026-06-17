import { GetCustomerTicketsQuery } from "../queries/get-customer-tickets.query";
import { IBookingQueryService, CustomerTicketDTO } from "../../ports/booking-query.interface";

export class GetCustomerTicketsQueryHandler {
  constructor(private readonly bookingQueryService: IBookingQueryService) {}

  async execute(query: GetCustomerTicketsQuery): Promise<CustomerTicketDTO[]> {
    return this.bookingQueryService.getCustomerTickets(query.customerId);
  }
}
