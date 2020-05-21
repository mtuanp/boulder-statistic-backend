import { Html5Entities } from "https://deno.land/x/html_entities@v1.0/mod.js";

import { Parser } from "../core/Parser.ts";
import { VisitorResult, VisitorStatus } from "../core/VisitorResult.ts";

const BoulderadoIframeRegEx = new RegExp(
  'iframe src="(.*)" name="Boulderado Clientcounter"',
);
const FreeCounterRegEx = new RegExp(
  'data-value="(\\d+)" id="visitorcount-container"',
);
const PartlyThreshold = 60;
const FullThreshold = 80;

/**
 * Kosmos parser, it search for the Boulderado iframe and extract the current visitor count.
 */
export class KosmosParser implements Parser {
  txtFetcher: (url: string) => Promise<string>;

  constructor(
    txtFetcher: (url: string) => Promise<string> = async (url: string) => {
      const res = await fetch(url);
      const resText = await res.text();
      return resText;
    },
  ) {
    this.txtFetcher = txtFetcher;
  }

  async parseActualVisitorStatus(): Promise<VisitorResult> {
    const kosmosIndexHtmlText = await this.txtFetcher(
      "http://kosmos-bouldern.de",
    );
    const iframeGroups = BoulderadoIframeRegEx.exec(kosmosIndexHtmlText);
    if (iframeGroups && iframeGroups.length === 2) {
      const decodedUrl = Html5Entities.decode(iframeGroups[1]);
      const counterHtmlText = await this.txtFetcher(decodedUrl);
      const freeCounterGroup = FreeCounterRegEx.exec(counterHtmlText);
      if (freeCounterGroup && freeCounterGroup.length === 2) {
        const visitorCount = +freeCounterGroup[1];
        return {
          count: visitorCount,
          status:
            visitorCount >= 0 && visitorCount < PartlyThreshold
              ? VisitorStatus.FREE
              : visitorCount >= FullThreshold
              ? VisitorStatus.FULL
              : VisitorStatus.PARTLY,
        };
      }
    }
    throw new Error("Parsing not successfully");
  }
}
