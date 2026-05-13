import { ValueObject } from "../../shared/value-object";

export enum EventStatusEnum {
  DRAFT = "Draft",
  PUBLISHED = "Published",
  CANCELLED = "Cancelled",
  COMPLETED = "Completed",
}

interface EventStatusProps {
  value: EventStatusEnum;
}

export class EventStatus extends ValueObject<EventStatusProps> {
  constructor(value: EventStatusEnum) {
    super({ value });
  }

  get value(): EventStatusEnum {
    return this.props.value;
  }

  static draft(): EventStatus {
    return new EventStatus(EventStatusEnum.DRAFT);
  }
  static published(): EventStatus {
    return new EventStatus(EventStatusEnum.PUBLISHED);
  }
  static cancelled(): EventStatus {
    return new EventStatus(EventStatusEnum.CANCELLED);
  }
  static completed(): EventStatus {
    return new EventStatus(EventStatusEnum.COMPLETED);
  }

  isDraft(): boolean {
    return this.props.value === EventStatusEnum.DRAFT;
  }
  isPublished(): boolean {
    return this.props.value === EventStatusEnum.PUBLISHED;
  }
  isCancelled(): boolean {
    return this.props.value === EventStatusEnum.CANCELLED;
  }
  isCompleted(): boolean {
    return this.props.value === EventStatusEnum.COMPLETED;
  }
}
