import { VisitorStatus } from "../../../core/VisitorResult.ts";
import { assertEquals } from "../../../deps.ts";
import { KosmosParser } from "../KosmosParser.ts";

const mockFetch = async (url: string) => {
  if (url === "http://kosmos-bouldern.de") {
    return '<iframe src="https://www.boulderado.de/boulderadoweb/gym-clientcounter/index.php?mode=get&amp;token=tokem.foo.bar" name="Boulderado Clientcounter" width="100%" height="400" id="idIframe" on-load="" style="border: none;" allowfullscreen=""></iframe>';
  } else {
    return `<body>
        <div data-value="2" id="visitorcount-container" class="freepercent1 ">						
    <div data-value="1" class="actcounter zoom"><div class="actcounter-title"><span>Besucher</span></div><div class="actcounter-content"><span data-value="1">1</span></div></div><div data-value="79" class="freecounter zoom"><div class="freecounter-title"><span>Frei</span></div><div class="freecounter-content"><span data-value="79">79</span></div></div>						
        </div>
    </body>`;
  }
};

Deno.test("Kosmos parser", () => {
  const parser = new KosmosParser(mockFetch);
  const actualResult = parser.parseActualVisitorStatus();
  return actualResult.then((result) =>
    assertEquals(result, { count: 2, status: VisitorStatus.FREE })
  );
});
