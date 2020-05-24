import { VisitorDatastore } from "../../core/VisitorDatastore.ts";
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
    actualVisitorStatus: {
      visitorStatus: {
        count: 12,
        status: VisitorStatus.FREE,
      },
    },
    lastVisitorStatus: {
      timestamp: new Date(2020, 4, 23, 13, 0, 0),
      visitorStatus: {
        count: 8,
        status: VisitorStatus.FREE,
      },
    },
  } as VisitorEventData;
  const db: VisitorDatastore = {
    insertVisitor: async (gym, entry) => {
      assertEquals(gym, Gym.KOSMOS);
      delete entry.timestamp;
      assertEquals(entry, expectedStoreEntry);
    },
    getLatestVisitorStatus: async (gym) => expectedEventData.lastVisitorStatus,
  } as VisitorDatastore;
  const event: Evt<VisitorEventData> = {
    postAsyncOnceHandled: (entry) => {
      delete entry.actualVisitorStatus.timestamp;
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
