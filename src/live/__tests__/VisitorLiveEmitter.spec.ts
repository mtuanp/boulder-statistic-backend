import { assertEquals } from "../../deps.ts";
import { fs } from "../../deps.ts";

import { VisitorLiveEmitterImpl } from "../VisitorLiveEmitter.ts";
import { KosmosParser } from "../../kosmos/KosmosParser.ts";

Deno.test("testing emitter", () => {
  const emitter = new VisitorLiveEmitterImpl(
    "./tmp/testing",
    new KosmosParser(),
  );
  return emitter.emitActualVisitor().then(() => {
    assertEquals(fs.existsSync("./tmp/testing"), true);
  });
});
