import { Entity } from "../../shared/entity";
import { Money } from "../../booking/value-objects/money.vo";
import {
  TicketCategoryStatus,
  TicketCategoryStatusEnum,
} from "../value-objects/ticket-category-status.vo";

export interface TicketCategoryProps {
  id: string;
  name: string;
  price: Money;
  quota: number;
  remainingQuota: number;
  salesStart: Date;
  salesEnd: Date;
  status: TicketCategoryStatus;
}

export class TicketCategory extends Entity<string> {
  private _name: string;
  private _price: Money;
  private _quota: number;
  private _remainingQuota: number;
  private _salesStart: Date;
  private _salesEnd: Date;
  private _status: TicketCategoryStatus;

  private constructor(props: TicketCategoryProps) {
    super(props.id);
    this._name = props.name;
    this._price = props.price;
    this._quota = props.quota;
    this._remainingQuota = props.remainingQuota;
    this._salesStart = props.salesStart;
    this._salesEnd = props.salesEnd;
    this._status = props.status;
  }

  static create(
    props: Omit<TicketCategoryProps, "status" | "remainingQuota">,
  ): TicketCategory {
    if (props.price.amount < 0)
      throw new Error("Ticket price cannot be negative");
    if (props.quota <= 0)
      throw new Error("Ticket quota must be greater than zero");

    return new TicketCategory({
      ...props,
      remainingQuota: props.quota,
      status: TicketCategoryStatus.active(),
    });
  }

  static reconstitute(props: TicketCategoryProps): TicketCategory {
    return new TicketCategory(props);
  }

  get name(): string {
    return this._name;
  }
  get price(): Money {
    return this._price;
  }
  get quota(): number {
    return this._quota;
  }
  get remainingQuota(): number {
    return this._remainingQuota;
  }
  get salesStart(): Date {
    return this._salesStart;
  }
  get salesEnd(): Date {
    return this._salesEnd;
  }
  get status(): TicketCategoryStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status.isActive();
  }

  isAvailableForSale(now: Date): boolean {
    return this.isActive() && now >= this._salesStart && now <= this._salesEnd;
  }

  isSoldOut(): boolean {
    return this._remainingQuota === 0;
  }

  reserveQuota(quantity: number): void {
    if (!this.isActive())
      throw new Error("Cannot reserve quota for an inactive ticket category");
    if (quantity <= 0) throw new Error("Quantity must be greater than zero");
    if (quantity > this._remainingQuota)
      throw new Error("Not enough remaining quota");
    this._remainingQuota -= quantity;
  }

  releaseQuota(quantity: number): void {
    this._remainingQuota = Math.min(
      this._quota,
      this._remainingQuota + quantity,
    );
  }

  disable(): void {
    if (this._status.isInactive())
      throw new Error("Ticket category is already inactive");
    this._status = TicketCategoryStatus.inactive();
  }
}
