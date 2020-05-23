export type VisitorResult = {
  /** visitor count when available */
  count: number | undefined;

  status: VisitorStatus;
};

export enum VisitorStatus {
  FULL,
  ALMOST_FULL,
  FREE,
  UNKNOWN,
}

export default VisitorResult;
