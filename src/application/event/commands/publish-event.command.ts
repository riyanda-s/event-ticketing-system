export class PublishEventCommand {
  constructor(
    public readonly eventId: string,
    public readonly organizerId: string,
  ) {}
}
