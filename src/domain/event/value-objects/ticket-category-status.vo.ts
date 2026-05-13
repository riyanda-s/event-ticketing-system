import { ValueObject } from "../../shared/value-object";

export enum TicketCategoryStatusEnum {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
}

interface TicketCategoryStatusProps {
  value: TicketCategoryStatusEnum;
}

export class TicketCategoryStatus extends ValueObject<TicketCategoryStatusProps> {
  constructor(value: TicketCategoryStatusEnum) {
    super({ value });
  }

  get value(): TicketCategoryStatusEnum {
    return this.props.value;
  }

  static active(): TicketCategoryStatus {
    return new TicketCategoryStatus(TicketCategoryStatusEnum.ACTIVE);
  }
  static inactive(): TicketCategoryStatus {
    return new TicketCategoryStatus(TicketCategoryStatusEnum.INACTIVE);
  }

  isActive(): boolean {
    return this.props.value === TicketCategoryStatusEnum.ACTIVE;
  }
  isInactive(): boolean {
    return this.props.value === TicketCategoryStatusEnum.INACTIVE;
  }
}
