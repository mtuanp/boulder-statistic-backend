import { actdb } from "../deps.ts";
import { logger } from "../log.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";
import { Gym } from "../core/Gym.ts";
import { Datastore } from "../core/Datastore.ts";
import { DailyFileAdapter } from "./DailyFileAdapter.ts";

export class ActDbDatastore implements Datastore {
  kosmosDataPath: string;
  visitors!: actdb.Store<VisitorStoreEntry>;
  constructor(
    kosmosDataPath: string = Deno.env.get("KOSMOS_DATA_PATH") || "data/kosmos",
  ) {
    this.kosmosDataPath = kosmosDataPath;
  }

  async init() {
    const db = new actdb.Act(new DailyFileAdapter(this.kosmosDataPath));
    this.visitors! = db.createStore<VisitorStoreEntry>("visitors");
  }

  async insertVisitor(gym: Gym, entry: VisitorStoreEntry) {
    return this.visitors.insert([entry]);
  }

  async getLatestVisitorStatus(gym: Gym): Promise<VisitorStoreEntry> {
    return {} as VisitorStoreEntry;
  }

  async saveAndClose() {}
}
