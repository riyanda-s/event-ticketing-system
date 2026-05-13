import { Event } from "../aggregates/event.aggregate";

export interface IEventRepository {
  findById(id: string): Promise<Event | null>;
  findAllPublished(): Promise<Event[]>;
  save(event: Event): Promise<void>;
  update(event: Event): Promise<void>;
}
