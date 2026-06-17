export class GetParticipantsQuery {
  constructor(
    public readonly eventId: string,
    public readonly organizerId: string,
  ) {}
}
