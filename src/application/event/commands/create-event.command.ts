export class CreateEventCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly location: string,
    public readonly maxCapacity: number,
    public readonly organizerId: string,
  ) {}
}
