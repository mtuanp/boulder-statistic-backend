import { Datastore } from "../../core/Datastore.ts";
import { Gym } from "../../core/Gym.ts";
import Parser from "../../core/Parser.ts";
import { VisitorEventData } from "../../core/VisitorEventData.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";
import { assert, assertEquals, Evt } from "../../deps.ts";
import { KosmosVisitorLiveEmitter } from "../KosmosVisitorLiveEmitter.ts";

Deno.test("testing emitter", () => {
  const expectedStoreEntry = {
    visitorStatus: { count: 12, status: 2 },
  };
  const expectedEventData = {
    gym: 0,
    visitorStatus: { count: 12, status: 2 },
  };
  const db: Datastore = {
    insertVisitor: async (gym, entry) => {
      assertEquals(gym, Gym.KOSMOS);
      delete entry.timestamp;
      assertEquals(entry, expectedStoreEntry);
    },
  } as Datastore;
  const event: Evt<VisitorEventData> = {
    postAsyncOnceHandled: (entry) => {
      delete entry.timestamp;
      assertEquals(entry, expectedEventData);
      return 1;
    },
  } as Evt<VisitorEventData>;
  const parser: Parser = {
    parseActualVisitorStatus: async () => ({
      count: 12,
      status: VisitorStatus.FREE,
    }),
  } as Parser;
  const emitter = new KosmosVisitorLiveEmitter(db, event, parser);
  return emitter.emitActualVisitor().then(() => {
    assert(true);
  });
});
