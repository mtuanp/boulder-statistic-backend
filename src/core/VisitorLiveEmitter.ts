export interface VisitorLiveEmitter {
  /** find the actual live visitor count and save it into the live data file */
  emitActualVisitor(): Promise<void>;
}

export default VisitorLiveEmitter;
