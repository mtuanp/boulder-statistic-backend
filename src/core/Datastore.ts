import { VisitorStoreEntry } from "./VisitorStoreEntry.ts";
import { Gym } from "./Gym.ts";

export interface Datastore {
  init(): Promise<void>;
  insertVisitor(entry: VisitorStoreEntry): Promise<void>;
  getLatestVisitorStatus(gym: Gym): Promise<VisitorStoreEntry>;
  saveAndClose(): Promise<void>;
}
