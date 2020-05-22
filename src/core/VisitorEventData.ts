import { Gym } from "./Gym.ts";
import { VisitorStoreEntry } from "./VisitorStoreEntry.ts";

export type VisitorEventData = {
  gym: Gym;
} & VisitorStoreEntry;
