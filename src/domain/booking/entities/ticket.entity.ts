import { Entity } from "../../shared/entity";
import { TicketCode } from "../value-objects/ticket-code.vo";
import { TicketStatus } from "../value-objects/ticket-status.vo";

export interface TicketProps {
  id: string;
  bookingId: string;
  eventId: string;
  code: TicketCode;
  status: TicketStatus;
  checkedInAt?: Date;
}

export class Ticket extends Entity<string> {
  private _bookingId: string;
  private _eventId: string;
  private _code: TicketCode;
  private _status: TicketStatus;
  private _checkedInAt?: Date;

  private constructor(props: TicketProps) {
    super(props.id);
    this._bookingId = props.bookingId;
    this._eventId = props.eventId;
    this._code = props.code;
    this._status = props.status;
    this._checkedInAt = props.checkedInAt;
  }

  static create(props: Omit<TicketProps, "status">): Ticket {
    return new Ticket({ ...props, status: TicketStatus.active() });
  }

  static reconstitute(props: TicketProps): Ticket {
    return new Ticket(props);
  }

  get bookingId(): string {
    return this._bookingId;
  }
  get eventId(): string {
    return this._eventId;
  }
  get code(): TicketCode {
    return this._code;
  }
  get status(): TicketStatus {
    return this._status;
  }
  get checkedInAt(): Date | undefined {
    return this._checkedInAt;
  }

  checkIn(eventId: string, now: Date): void {
    if (this._eventId !== eventId)
      throw new Error("Ticket does not belong to this event");
    if (!this._status.isActive())
      throw new Error(
        this._status.isCheckedIn()
          ? "Ticket has already been checked in"
          : "Ticket is not active",
      );
    this._status = TicketStatus.checkedIn();
    this._checkedInAt = now;
  }

  cancel(): void {
    if (this._status.isCheckedIn())
      throw new Error("Cannot cancel a checked-in ticket");
    this._status = TicketStatus.cancelled();
  }

  isCheckedIn(): boolean {
    return this._status.isCheckedIn();
  }
  isActive(): boolean {
    return this._status.isActive();
  }
}
