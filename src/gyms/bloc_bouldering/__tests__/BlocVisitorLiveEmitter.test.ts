import { VisitorDatastore } from "../../../core/VisitorDatastore.ts";
import { Gym } from "../../../core/Gym.ts";
import Parser from "../../../core/Parser.ts";
import { VisitorEventData } from "../../../core/VisitorEventData.ts";
import { VisitorStatus } from "../../../core/VisitorResult.ts";
import { assert, assertEquals, Evt } from "../../../deps.ts";
import { BlocVisitorLiveEmitter } from "../BlocVisitorLiveEmitter.ts";

Deno.test("testing emitter", () => {
  const expectedStoreEntry = {
    visitorStatus: { status: VisitorStatus.ALMOST_FULL },
  };
  const expectedEventData = {
    gym: 1,
    actualVisitorStatus: {
      visitorStatus: {
        status: VisitorStatus.ALMOST_FULL,
      },
    },
    lastVisitorStatus: {
      timestamp: new Date(2020, 4, 23, 13, 0, 0),
      visitorStatus: {
        status: VisitorStatus.FREE,
      },
    },
  } as VisitorEventData;
  const db: VisitorDatastore = {
    insertVisitor: async (gym, entry) => {
      assertEquals(gym, Gym.BLOC_NO_LIMIT_BOULDERING);
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
      status: VisitorStatus.ALMOST_FULL,
    }),
  } as Parser;
  const emitter = new BlocVisitorLiveEmitter(db, event, parser);
  return emitter.emitActualVisitor().then(() => {
    assert(true);
  });
});
