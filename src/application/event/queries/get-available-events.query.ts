export class GetAvailableEventsQuery {
  constructor(
    public readonly date?: string,
    public readonly location?: string,
  ) {}
}
