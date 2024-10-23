
import { Attestation, AttestedData } from '../utils/types';


enum ActionType {
  SET_ATTESTATION = 'attestation/SET_ATTESTATION',
}


export type Action<payload = any> = {
  type: ActionType;
  payload: payload;
  error?: boolean;
  meta?: any;
}

type AttestationData = {
  raw: Attestation;
}

export type State = {
  raw: Attestation;
}

export const initState: State = {
    raw: {
      version: '0.1.0-alpha.7',
      data: '',
      meta: {
        notaryUrl: '',
        websocketProxyUrl: '',
        pluginUrl: '',
      },
    },
};

export const setAttestation = (attestation: AttestationData): Action<AttestationData> => ({
  type: ActionType.SET_ATTESTATION,
  payload: attestation,
});

export default function attestation(state = initState, action: Action): State {
  switch (action.type) {
    case ActionType.SET_ATTESTATION:
      return {
        ...state,
        raw: action.payload,
      };
    default:
      return state;
  }
}
