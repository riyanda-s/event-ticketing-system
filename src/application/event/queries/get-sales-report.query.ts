export class GetSalesReportQuery {
  constructor(
    public readonly eventId: string,
    public readonly organizerId: string,
  ) {}
}
