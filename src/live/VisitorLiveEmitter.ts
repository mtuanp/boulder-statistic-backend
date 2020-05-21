import { fs } from "../deps.ts";
const { existsSync, readJsonSync, writeJsonSync, ensureFileSync } = fs;

import VisitorLiveEmitter from "../core/VisitorLiveEmitter.ts";
import Parser from "../core/Parser.ts";
import { VisitorStoreEntry } from "../core/VisitorStoreEntry.ts";

export class VisitorLiveEmitterImpl implements VisitorLiveEmitter {
  basePath: string;
  parser: Parser;

  constructor(basePath: string, parser: Parser) {
    this.parser = parser;
    this.basePath = basePath;
  }

  async emitActualVisitor(): Promise<void> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const filePath = `${this.basePath}/${year}-${month}-${day}.json`;
    const fileExists = existsSync(filePath);
    const actualFileContent: VisitorStoreEntry[] = fileExists
      ? (readJsonSync(filePath) as VisitorStoreEntry[])
      : [];
    const visitorStatus = await this.parser.parseActualVisitorStatus();
    actualFileContent.push({ timestamp: new Date(), visitorStatus });
    ensureFileSync(filePath);
    writeJsonSync(filePath, actualFileContent);
  }
}
