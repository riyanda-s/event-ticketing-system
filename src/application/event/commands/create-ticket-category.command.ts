export class CreateTicketCategoryCommand {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly organizerId: string,
    public readonly name: string,
    public readonly priceAmount: number,
    public readonly priceCurrency: string,
    public readonly quota: number,
    public readonly salesStart: Date,
    public readonly salesEnd: Date,
  ) {}
}
