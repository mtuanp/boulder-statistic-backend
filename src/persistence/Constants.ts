import { Gym } from "../core/Gym.ts";

export const defaultDataPathMap = () => {
  const dataPathMap = new Map();
  dataPathMap.set(
    Gym.KOSMOS,
    { path: Deno.env.get("KOSMOS_DATA_PATH") || "data/kosmos" },
  );
  dataPathMap.set(
    Gym.BLOC_NO_LIMIT_BOULDERING,
    { path: Deno.env.get("BLOC_DATA_PATH") || "data/bloc_bouldering" },
  );
  return dataPathMap;
};
