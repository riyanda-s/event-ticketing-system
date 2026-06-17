export class DisableTicketCategoryCommand {
  constructor(
    public readonly eventId: string,
    public readonly categoryId: string,
    public readonly organizerId: string,
  ) {}
}
