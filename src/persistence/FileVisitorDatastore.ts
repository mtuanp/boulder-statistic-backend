import { Gym } from "../core/Gym.ts";
import { buildDateString } from "../core/Utils.ts";
import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { VisitorStatus } from "../core/VisitorResult.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";
import { fs } from "../deps.ts";
import { logger } from "../log.ts";
import { defaultDataPathMap } from "./Constants.ts";

export class FileVisitorDatastore implements VisitorDatastore {
  dataPathMap: Map<Gym, { path: string; lastUpdate?: VisitorStoreEntry }>;
  constructor(
    dataPathMap: Map<Gym, { path: string; lastUpdate?: VisitorStoreEntry }> =
      defaultDataPathMap(),
  ) {
    this.dataPathMap = dataPathMap;
  }

  async init() {
    const now = new Date();
    const dateString = buildDateString(now);
    this.dataPathMap.forEach(({ path }, gym) => {
      const filePath = `${path}/${dateString}.json`;
      let lastUpdate;
      fs.ensureDirSync(path);
      if (fs.existsSync(filePath)) {
        const existingContent = this._readJson(filePath);
        lastUpdate = existingContent[existingContent.length - 1];
      } else {
        lastUpdate = this._buildDefaultStatus(now);
      }
      this.dataPathMap.set(gym, { path, lastUpdate });
    });
    logger.debug("Datastore is ready");
  }

  async insertVisitor(gym: Gym, entry: VisitorStoreEntry) {
    const dateString = buildDateString(entry.timestamp);
    const { path } = this.dataPathMap.get(gym)!;
    const filePath = `${path}/${dateString}.json`;
    const collection = fs.existsSync(filePath) ? this._readJson(filePath) : [];
    collection.push(entry);
    this.dataPathMap.set(gym, { path, lastUpdate: entry });
    return fs.writeJson(filePath, collection, { spaces: 2 });
  }

  async getLatestVisitorStatus(gym: Gym): Promise<VisitorStoreEntry> {
    return (
      this.dataPathMap.get(gym)?.lastUpdate ||
      this._buildDefaultStatus(new Date())
    );
  }

  _readJson(path: string): VisitorStoreEntry[] {
    return (fs.readJsonSync(path) as VisitorStoreEntry[]).map((e) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  }

  _buildDefaultStatus(now: Date): VisitorStoreEntry {
    return {
      timestamp: now,
      visitorStatus: { count: 0, status: VisitorStatus.UNKNOWN },
    };
  }
}
