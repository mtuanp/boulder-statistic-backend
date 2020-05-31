import { VisitorDatastore } from "../../core/VisitorDatastore.ts";
import { Gym } from "../../core/Gym.ts";
import Parser from "../../core/Parser.ts";
import { VisitorEventData } from "../../core/VisitorEventData.ts";
import VisitorLiveEmitter from "../../core/VisitorLiveEmitter.ts";
import { Evt } from "../../deps.ts";

export class BlocVisitorLiveEmitter implements VisitorLiveEmitter {
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
    const lastVisitorStatus = await this.datastore.getLatestVisitorStatus(
      Gym.BLOC_NO_LIMIT_BOULDERING,
    );
    const visitorStatureStore = {
      timestamp: new Date(),
      visitorStatus,
    };
    this.datastore.insertVisitor(
      Gym.BLOC_NO_LIMIT_BOULDERING,
      visitorStatureStore,
    );
    this.visitorEvent.postAsyncOnceHandled({
      actualVisitorStatus: visitorStatureStore,
      lastVisitorStatus: lastVisitorStatus,
      gym: Gym.BLOC_NO_LIMIT_BOULDERING,
    });
  }
}
