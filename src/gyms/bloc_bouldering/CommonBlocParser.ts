import { Parser } from "../../core/Parser.ts";
import { VisitorResult, VisitorStatus } from "../../core/VisitorResult.ts";

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
export class CommonBlocParser implements Parser {
  txtFetcher: (url: string) => Promise<string>;
  homepageURL: string;
  fallbackURL: string;

  constructor(
    txtFetcher: (url: string) => Promise<string> = async (url: string) => {
      const res = await fetch(url);
      const resText = await res.text();
      return resText;
    },
    homepageURL: string,
    fallbackURL: string,
  ) {
    this.txtFetcher = txtFetcher;
    this.homepageURL = homepageURL;
    this.fallbackURL = fallbackURL;
  }

  async parseActualVisitorStatus(): Promise<VisitorResult> {
    const blocIndexHtmlText = await this.txtFetcher(this.homepageURL);
    const accessDataGroups = FreeClimbingAccessRegExp.exec(blocIndexHtmlText);
    if (accessDataGroups?.length === 3 || this.fallbackURL) {
      const freeClimbingUrl = getFreeClimberUrl(
        accessDataGroups,
        this.fallbackURL,
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
