export class CreateBookingCommand {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly customerId: string,
    public readonly ticketCategoryId: string,
    public readonly quantity: number,
  ) {}
}
