import { CommonBlocParser } from "../bloc_bouldering/CommonBlocParser.ts";

const BLOC_NOLIMIT_FREECLIMBING_FALLBACK_URL =
  Deno.env.get("BLOC_NOLIMIT_FREECLIMBING_FALLBACK_URL") || "";
export const BLOC_CLIMBING_HOMEPAGE = "https://www.kletterhalle-leipzig.de";

/**
 * Bloc parser, it search for the status flag and parse it.
 */
export class BlocNoLimitParser extends CommonBlocParser {
  constructor(
    txtFetcher: (url: string) => Promise<string> = async (url: string) => {
      const res = await fetch(url);
      const resText = await res.text();
      return resText;
    },
  ) {
    super(
      txtFetcher,
      BLOC_CLIMBING_HOMEPAGE,
      BLOC_NOLIMIT_FREECLIMBING_FALLBACK_URL,
    );
  }
}
