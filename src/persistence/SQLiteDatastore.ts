import { sql } from "../deps.ts";
import { logger } from "../log.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";
import { Gym } from "../core/Gym.ts";
import { Datastore } from "../core/Datastore.ts";

export class SQLiteDatastore implements Datastore {
  databaseFile: string;
  #database!: sql.DB;

  constructor(
    databaseFile: string = Deno.env.get("SQLITE_DATABASE_FILE") || "data.db",
  ) {
    this.databaseFile = databaseFile;
  }

  async init() {
    this.#database = await sql.open(this.databaseFile);
    this.#database.query(
      `CREATE TABLE IF NOT EXISTS visitor (id INTEGER PRIMARY KEY AUTOINCREMENT, 
        timestamp DATETIME, gym INTEGER, visitorCount INTEGER, visitorStatus INTEGER)`,
      [],
    );
    this.#database.query(
      `CREATE INDEX IF NOT EXISTS gym_index 
      ON visitor(gym);`,
      [],
    );
    this.#database.query(
      `CREATE INDEX  IF NOT EXISTS timestamp_index 
        ON visitor(timestamp);`,
      [],
    );
    await sql.save(this.#database, this.databaseFile);
  }

  async insertVisitor(entry: VisitorStoreEntry) {
    const { timestamp, gym, visitorStatus } = entry;
    const { count, status } = visitorStatus;
    const rows = await this.#database.query(
      "INSERT INTO visitor (timestamp, gym, visitorCount, visitorStatus) VALUES (?,?,?,?)",
      [timestamp, gym, count, status],
    );
  }

  async getLatestVisitorStatus(gym: Gym): Promise<VisitorStoreEntry> {
    for (const row of this.#database.query(
      `SELECT timestamp, visitorCount, visitorStatus FROM visitor 
      WHERE gym = ? ORDER BY timestamp DESC LIMIT 1`,
      [gym],
    )) {
      return {
        timestamp: new Date(row![0]),
        gym,
        visitorStatus: { count: row![1], status: row![2] },
      };
    }
    throw new Error("No visitor status found.");
  }

  async saveAndClose() {
    await sql.save(this.#database, this.databaseFile);
    this.#database.close();
  }
}
