import { CommonBlocParser } from "./CommonBlocParser.ts";

const BLOC_FREECLIMBING_FALLBACK_URL =
  Deno.env.get("BLOC_FREECLIMBING_FALLBACK_URL") || "";
export const BLOC_HOMEPAGE = "https://boulderhalle-leipzig.de";

/**
 * Bloc parser, it search for the status flag and parse it.
 */
export class BlocParser extends CommonBlocParser {
  constructor(
    txtFetcher: (url: string) => Promise<string> = async (url: string) => {
      const res = await fetch(url);
      const resText = await res.text();
      return resText;
    },
  ) {
    super(txtFetcher, BLOC_HOMEPAGE, BLOC_FREECLIMBING_FALLBACK_URL);
  }
}
