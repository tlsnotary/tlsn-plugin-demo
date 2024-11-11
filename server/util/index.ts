import path from 'path';
import fs from 'fs';
import { localPem } from '../../web/utils/constants';

const poapLinksPath = path.join(__dirname, 'util', 'poaps.txt');
const assignmentsFilePath = path.join(__dirname, 'util', 'assignments.json');

export const loadPoapLinks = (): string[] => {
  const fileContent = fs.readFileSync(poapLinksPath, 'utf-8');
  return fileContent.trim().split('\n');
};

export const loadAssignments = (): Record<string, string> => {
  if (fs.existsSync(assignmentsFilePath)) {
    const fileContent = fs.readFileSync(assignmentsFilePath, 'utf-8');
    return JSON.parse(fileContent);
  }
  return {};
};

export const saveAssignments = (assignments: Record<string, string>) => {
  fs.writeFileSync(assignmentsFilePath, JSON.stringify(assignments, null, 2));
};

export const getPoapLink = (screenName: string): string | null => {
  const poapLinks = loadPoapLinks();
  const assignments = loadAssignments();
  if (assignments[screenName]) {
    return assignments[screenName];
  }
  if (poapLinks.length === 0) {
    return null;
  }

  const newLink = poapLinks.shift();
  assignments[screenName] = newLink as string;
  saveAssignments(assignments);
  fs.writeFileSync(poapLinksPath, poapLinks.join('\n'));

  return newLink || null;
};

export function convertNotaryWsToHttp(notaryWs: string) {
  const { protocol, pathname, hostname, port } = new URL(notaryWs);
  const p = protocol === 'wss:' ? 'https:' : 'http:';
  const pt = port ? `:${port}` : '';
  const path = pathname === '/' ? '' : pathname.replace('/notarize', '');
  const h = hostname === 'localhost' ? '127.0.0.1' : hostname;
  return p + '//' + h + pt + path;
}

export async function fetchPublicKeyFromNotary(notaryUrl: string) {
  try {
    const url = new URL(notaryUrl);
    const { hostname } = url;
    if (hostname === '127.0.0.1' || hostname === 'localhost') return localPem;
    const res = await fetch(notaryUrl + '/info');
    const json: any = await res.json();
    if (!json.publicKey) throw new Error('invalid response');
    return json.publicKey;
  } catch (e) {
    console.error('Failed to fetch public key from notary', e);
    return null;
  }
}
