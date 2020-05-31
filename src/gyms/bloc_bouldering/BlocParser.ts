import { Parser } from "../../core/Parser.ts";
import { VisitorResult, VisitorStatus } from "../../core/VisitorResult.ts";

const BLOC_FREECLIMBING_FALLBACK_URL =
  Deno.env.get("BLOC_FREECLIMBING_FALLBACK_URL") || "";
export const BLOC_HOMEPAGE = "https://boulderhalle-leipzig.de";

const FreeClimbingAccessRegExp = new RegExp(
  'loadTrafficlight\\("(\\d*)", "(.*)",',
);
const StatusFreeRegExp = new RegExp("green active");
const StatusAlmostFullRegExp = new RegExp("yellow active");
const StatusFullRegExp = new RegExp("red active");

export const AlmostFullThreshold = 75;
export const FullThreshold = 100;

/**
 * Bloc parser, it search for the status flag and parse it.
 */
export class BlocParser implements Parser {
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
    const blocIndexHtmlText = await this.txtFetcher(BLOC_HOMEPAGE);
    const accessDataGroups = FreeClimbingAccessRegExp.exec(blocIndexHtmlText);
    if (accessDataGroups?.length === 3 || BLOC_FREECLIMBING_FALLBACK_URL) {
      const freeClimbingUrl = getFreeClimberUrl(
        accessDataGroups,
        BLOC_FREECLIMBING_FALLBACK_URL,
      );
      const counterHtmlText = await this.txtFetcher(freeClimbingUrl);
      if (StatusFreeRegExp.exec(counterHtmlText)?.length === 1) {
        return { status: VisitorStatus.FREE };
      } else if (StatusAlmostFullRegExp.exec(counterHtmlText)?.length === 1) {
        return { status: VisitorStatus.ALMOST_FULL };
      } else if (StatusFullRegExp.exec(counterHtmlText)?.length === 1) {
        return { status: VisitorStatus.FULL };
      } else {
        throw new Error("Parsing broken");
      }
    }
    throw new Error("Parsing not successfully");
  }
}

function getFreeClimberUrl(
  accessDataGroups: RegExpExecArray | null,
  fallBackUrl: string,
) {
  if (accessDataGroups?.length === 3) {
    const id = accessDataGroups[1];
    const key = accessDataGroups[2];
    return `https://${id}.webclimber.de/de/trafficlight?callback=WebclimberTrafficlight.insertTrafficlight&key=${key}&container=trafficlightContainer&type=undefined`;
  } else {
    return fallBackUrl;
  }
}
