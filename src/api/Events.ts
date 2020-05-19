import { Evt } from "https://deno.land/x/evt/mod.ts";

import VisitorResult from "./VisitorResult.ts";

export const KosmosStatusEvent = new Evt<VisitorResult>();
