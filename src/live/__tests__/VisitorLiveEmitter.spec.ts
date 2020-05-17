import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { VisitorLiveEmitterImpl } from "../VisitorLiveEmitter.ts";
import { KosmosParser } from "../../kosmos/KosmosParser.ts";
import { existsSync  } from "https://deno.land/std/fs/mod.ts";


Deno.test("testing emitter", () => {
    const emitter = new VisitorLiveEmitterImpl('./tmp/testing', new KosmosParser());
    return emitter.emitActualVisitor().then(() => {
        assertEquals(existsSync('./tmp/testing'), true)
    })
});