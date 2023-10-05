export interface ConflictBlock {
  ourMarkerLineNo: number;
  baseMarkerLineNo: number;
  theirMarkerLineNo: number;
  endMarkerLineNo: number;
}

export interface MergeScenario {
  ours: string;
  theirs: string;
}
