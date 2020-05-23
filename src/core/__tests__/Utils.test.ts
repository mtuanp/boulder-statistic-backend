import { genUrl } from "../Utils.ts";
import { assertEquals } from "../../deps.ts";

Deno.test("testing url with parameters", () => {
  const url = genUrl("base", { foo: "bar", count: 5, no: undefined });
  assertEquals(url, "base?foo=bar&count=5");
});

Deno.test("testing url without parameter", () => {
  const url = genUrl("base");
  assertEquals(url, "base");
});
