export function genUrl(url: string, parameters?: any): string {
  const requestParameters = parameters
    ? Object.keys(parameters)
      .filter((param) => parameters[param] !== undefined)
      .map((param) => `${param}=${parameters[param]}`)
      .join("&")
    : "";
  return `${url}${requestParameters.length > 0 ? "?" + requestParameters : ""}`;
}
