import { VisitorStatus } from "../../../core/VisitorResult.ts";
import { assertEquals } from "../../../deps.ts";
import { BlocParser, BLOC_HOMEPAGE } from "../BlocParser.ts";

const mockFetch = async (url: string) => {
  if (url === BLOC_HOMEPAGE) {
    return `
    <div class="custom"  >
	<script type="text/javascript" src="https://cdn.webclimber.de/webclimber_trafficlight.min.js"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.webclimber.de/webclimber_trafficlight.min.css" /><script type="text/javascript">
WebclimberTrafficlight.loadTrafficlight("1234", "gfdt4553fds", "trafficlightContainer");</script>
</div>
    `;
  } else {
    return `WebclimberTrafficlight.insertTrafficlight({"container":"trafficlightContainer","html":"    <div class='trafficlight_body'>        <div class='status_topic'>Aktuelle Auslastung:        </div>            <div class='trafficlight'>                <div class='container'><div class='circle red'></div>                    <div class='circle yellow'></div>                    <div class='circle green active'></div>                </div>            </div>        <div class='status_text'>Geringe Auslastung        </div>    </div>"})`;
  }
};

Deno.test("Bloc parser", () => {
  const parser = new BlocParser(mockFetch);
  const actualResult = parser.parseActualVisitorStatus();
  return actualResult.then((result) =>
    assertEquals(result, { status: VisitorStatus.FREE })
  );
});
