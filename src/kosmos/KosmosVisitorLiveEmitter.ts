import { Datastore } from "../core/Datastore.ts";
import { Gym } from "../core/Gym.ts";
import Parser from "../core/Parser.ts";
import VisitorLiveEmitter from "../core/VisitorLiveEmitter.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";
import { Evt } from "../deps.ts";
import { KosmosParser } from "./KosmosParser.ts";

export class KosmosVisitorLiveEmitter implements VisitorLiveEmitter {
  datastore: Datastore;
  parser: Parser;
  visitorEvent: Evt<VisitorStoreEntry>;

  constructor(
    datastore: Datastore,
    visitorEvent: Evt<VisitorStoreEntry>,
    parser: Parser,
  ) {
    this.parser = parser;
    this.visitorEvent = visitorEvent;
    this.datastore = datastore;
  }

  async emitActualVisitor(): Promise<void> {
    const visitorStatus = await this.parser.parseActualVisitorStatus();
    const visitorStatureStore = {
      gym: Gym.KOSMOS,
      timestamp: new Date(),
      visitorStatus,
    };
    this.datastore.insertVisitor(visitorStatureStore);
    this.visitorEvent.postAsyncOnceHandled(visitorStatureStore);
  }
}
