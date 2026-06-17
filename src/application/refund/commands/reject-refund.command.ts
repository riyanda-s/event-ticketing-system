export class RejectRefundCommand {
  constructor(
    public readonly refundId: string,
    public readonly organizerId: string,
    public readonly rejectionReason: string,
  ) {}
}
