export interface AttestedData {
  version: '0.1.0-alpha.7' | '0.1.0-alpha.5';
  time: number;
  sent: string;
  recv: string;
  notaryUrl: string;
  notaryKey: string;
  websocketProxyUrl?: string;
  verifierKey?: string;
}


export type Attestation = {
  version: '0.1.0-alpha.7';
  data: string;
  meta: {
    notaryUrl: string;
    websocketProxyUrl: string;
    pluginUrl?: string;
  };
};
