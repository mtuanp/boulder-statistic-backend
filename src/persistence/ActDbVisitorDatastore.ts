import { actdb, fs } from "../deps.ts";
import { logger } from "../log.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";
import { Gym } from "../core/Gym.ts";
import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { DailyFileAdapter } from "./DailyFileAdapter.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";

export class ActDbVisitorDatastore implements VisitorDatastore {
  kosmosDataPath: string;
  visitorStore!: actdb.Store<VisitorStoreEntry>;
  constructor(
    kosmosDataPath: string = Deno.env.get("KOSMOS_DATA_PATH") || "data/kosmos",
  ) {
    this.kosmosDataPath = kosmosDataPath;
  }

  async init() {
    fs.ensureDirSync(this.kosmosDataPath);
    const db = new actdb.Act(new DailyFileAdapter(this.kosmosDataPath));
    this.visitorStore! = db.createStore<VisitorStoreEntry>("visitors");
    logger.debug("Datastore is ready");
  }

  async insertVisitor(gym: Gym, entry: VisitorStoreEntry) {
    logger.debug("Datastore insert entry", gym, entry);
    return this.visitorStore.insert([entry]);
  }

  async getLatestVisitorStatus(gym: Gym): Promise<VisitorStoreEntry> {
    const visitors = await this.visitorStore.read();
    return visitors.length > 0
      ? {
        ...visitors[visitors.length - 1],
        timestamp: new Date(visitors[visitors.length - 1].timestamp),
      }
      : {
        timestamp: new Date(),
        visitorStatus: { count: 0, status: VisitorStatus.UNKNOWN },
      };
  }
}
