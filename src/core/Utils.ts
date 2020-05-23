import { VisitorStatus } from "./VisitorResult.ts";

export function delay(n: number): Promise<void> {
  return new Promise((resolve: () => void, _) => {
    setTimeout(resolve, n);
  });
}

export function genUrl(url: string, parameters?: any): string {
  const requestParameters = parameters
    ? Object.keys(parameters)
        .filter((param) => parameters[param] !== undefined)
        .map((param) => `${param}=${parameters[param]}`)
        .join("&")
    : "";
  return `${url}${requestParameters.length > 0 ? "?" + requestParameters : ""}`;
}

export function statusEnumToString(visitorStatus: VisitorStatus): string {
  switch (visitorStatus) {
    case VisitorStatus.FREE:
      return "free";
    case VisitorStatus.ALMOST_FULL:
      return "almost full";
    case VisitorStatus.FULL:
      return "full";
    case VisitorStatus.UNKNOWN:
      return "unknown";
  }
}
