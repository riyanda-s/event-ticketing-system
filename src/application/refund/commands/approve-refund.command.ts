export class ApproveRefundCommand {
  constructor(
    public readonly refundId: string,
    public readonly organizerId: string,
  ) {}
}
