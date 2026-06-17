export class RequestRefundCommand {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly customerId: string,
    public readonly reason?: string,
  ) {}
}
