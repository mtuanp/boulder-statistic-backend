import { VisitorResult } from "./VisitorResult.ts";

export interface Parser {
  parseActualVisitorStatus(): Promise<VisitorResult>;
}

export default Parser;
