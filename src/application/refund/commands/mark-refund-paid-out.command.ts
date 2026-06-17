export class MarkRefundPaidOutCommand {
  constructor(
    public readonly refundId: string,
    public readonly bankAccount: string,
  ) {}
}
