import { VisitorDatastore } from "../core/VisitorDatastore.ts";
import { Gym } from "../core/Gym.ts";
import Parser from "../core/Parser.ts";
import { VisitorEventData } from "../core/VisitorEventData.ts";
import VisitorLiveEmitter from "../core/VisitorLiveEmitter.ts";
import { Evt } from "../deps.ts";

export class KosmosVisitorLiveEmitter implements VisitorLiveEmitter {
  datastore: VisitorDatastore;
  parser: Parser;
  visitorEvent: Evt<VisitorEventData>;

  constructor(
    datastore: VisitorDatastore,
    visitorEvent: Evt<VisitorEventData>,
    parser: Parser,
  ) {
    this.parser = parser;
    this.visitorEvent = visitorEvent;
    this.datastore = datastore;
  }

  async emitActualVisitor(): Promise<void> {
    const visitorStatus = await this.parser.parseActualVisitorStatus();
    const visitorStatureStore = {
      timestamp: new Date(),
      visitorStatus,
    };
    this.datastore.insertVisitor(Gym.KOSMOS, visitorStatureStore);
    this.visitorEvent.postAsyncOnceHandled({
      ...visitorStatureStore,
      gym: Gym.KOSMOS,
    });
  }
}
