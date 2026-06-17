export class ExpireBookingsCommand {
  constructor(public readonly now: Date = new Date()) {}
}
