import { Html5Entities } from "../../deps.ts";

import { Parser } from "../../core/Parser.ts";
import { VisitorResult, VisitorStatus } from "../../core/VisitorResult.ts";

const BoulderadoIframeRegEx = new RegExp(
  'iframe src="(.*)" name="Boulderado Clientcounter"',
);
const FreeCounterRegEx = new RegExp(
  'data-value="(\\d+)" id="visitorcount-container"',
);
const KOSMOS_HOMEPAGE = "http://kosmos-bouldern.de";
const KOSMOS_BOULDERADO_FALLBACK_URL =
  Deno.env.get("KOSMOS_BOULDERADO_FALLBACK_URL") || "";
export const AlmostFullThreshold = 75;
export const FullThreshold = 100;

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
    const kosmosIndexHtmlText = await this.txtFetcher(KOSMOS_HOMEPAGE);
    const iframeGroups = BoulderadoIframeRegEx.exec(kosmosIndexHtmlText);
    if (
      (iframeGroups && iframeGroups.length === 2) ||
      KOSMOS_BOULDERADO_FALLBACK_URL
    ) {
      const decodedUrl = iframeGroups?.length === 2
        ? Html5Entities.decode(iframeGroups[1])
        : KOSMOS_BOULDERADO_FALLBACK_URL;
      const counterHtmlText = await this.txtFetcher(decodedUrl);
      const freeCounterGroup = FreeCounterRegEx.exec(counterHtmlText);
      if (freeCounterGroup && freeCounterGroup.length === 2) {
        const visitorCount = +freeCounterGroup[1];
        return {
          count: visitorCount,
          status: visitorCount >= 0 && visitorCount < AlmostFullThreshold
            ? VisitorStatus.FREE
            : visitorCount >= FullThreshold
            ? VisitorStatus.FULL
            : VisitorStatus.ALMOST_FULL,
        };
      }
    }
    throw new Error("Parsing not successfully");
  }
}
