import { existsSync, readJsonSync, writeJsonSync, ensureFileSync } from "https://deno.land/std/fs/mod.ts";

import VisitorLiveEmitter from "../api/VisitorLiveEmitter.ts";
import Parser from "../api/Parser.ts";
import { VisitorStoreEnty } from "../api/VisitorStoreEntry.ts";

export class VisitorLiveEmitterImpl implements VisitorLiveEmitter {

    filePath: string
    parser: Parser

    constructor(filePath: string, parser: Parser) {
        this.parser = parser
        this.filePath = filePath
    }

    async emitActualVisitor(): Promise<void> {
        const fileExists = existsSync(this.filePath)
        const actualFileContent: VisitorStoreEnty[] = fileExists ? readJsonSync(this.filePath) as VisitorStoreEnty[] : []
        const visitorStatus = await this.parser.parseActualVisitorStatus()
        actualFileContent.push({ timestamp: new Date(), visitorStatus })
        ensureFileSync(this.filePath)
        writeJsonSync(this.filePath, actualFileContent)
    }

}