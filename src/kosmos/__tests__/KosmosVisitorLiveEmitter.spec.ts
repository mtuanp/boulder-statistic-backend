import { assertEquals, assert } from "../../deps.ts";
import { fs } from "../../deps.ts";
import { mock } from "../../deps.ts";
import { KosmosVisitorLiveEmitter } from "../KosmosVisitorLiveEmitter.ts";
import { KosmosParser } from "../../kosmos/KosmosParser.ts";
import { Datastore } from "../../core/Datastore.ts";
import { Evt } from "../../deps.ts";
import { VisitorStoreEntry } from "../../core/VisitorStoreEntry.ts";
import Parser from "../../core/Parser.ts";
import { VisitorStatus } from "../../core/VisitorResult.ts";

Deno.test("testing emitter", () => {
  const expectedStoreEntry = {
    gym: 0,
    visitorStatus: { count: 12, status: 2 },
  };
  const db: Datastore = {
    insertVisitor: async (entry) => {
      delete entry.timestamp;
      assertEquals(entry, expectedStoreEntry);
    },
  } as Datastore;
  const event: Evt<VisitorStoreEntry> = {
    postAsyncOnceHandled: (entry) => {
      delete entry.timestamp;
      assertEquals(entry, expectedStoreEntry);
      return 1;
    },
  } as Evt<VisitorStoreEntry>;
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
