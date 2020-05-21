import { Gym } from "./Gym.ts";
import VisitorResult from "./VisitorResult.ts";

export type VisitorStoreEntry = {
  timestamp: Date;
  gym: Gym;
  visitorStatus: VisitorResult;
};
