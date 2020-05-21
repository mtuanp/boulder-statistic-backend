export type VisitorResult = {
  /** visitor count when available */
  count: number | undefined;

  status: VisitorStatus;
};

export enum VisitorStatus {
  FULL,
  PARTLY,
  FREE,
}

export default VisitorResult;
