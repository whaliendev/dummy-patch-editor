import { MergeScenario } from "../models/mergebot";

const BASE_URL = '/api/sa';

export interface MergeScenarioPayload {
  ms: MergeScenario;
  path: string;
  files: Array<string>;
}

export const postMergeScenario = async (payload: MergeScenarioPayload) => {
  const endpoint = `${BASE_URL}/ms`;
  /// use fetch api to do post request, and get the response
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('post merge scenario result:', data);
  if(data.code !== '00000') {
    throw new Error(data.msg);
  }
};

export interface ResolutionPayload {
  path: string;
  file: string;
  ms: MergeScenario;
}

export interface ResolutionVO {
  pending: boolean;
  projectPath: string;
  file: string;
  resolutions: Array<Resolution>;
  patches: Array<Patch>;
}

export interface Resolution {
  desc: string;
  confidence: number;
  index: number;
  label: string;
  code: Array<string>;
}

export interface Patch {
  start: number;
  offset: number;
  content: Array<string>;
}

export const getResolution = async (payload: ResolutionPayload) => {
  const endpoint = `${BASE_URL}/resolve`;
  /// when pending is true, retry every 5s until we reached 20s
  const RETRY_LIMIT = 3;
  let retryCount = 0;
  let pending = true;
  let resolution: ResolutionVO;
  while(pending && retryCount < RETRY_LIMIT) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('get resolution result:', data);
    if(data.code === '00000') {
      resolution = data.data;
      pending = resolution.pending;
    } else {
      throw new Error(data.msg);
    }

    retryCount++;
  }

  if(pending) {
    throw new Error('timeout fetching resolution');
  }

  return resolution;
};
