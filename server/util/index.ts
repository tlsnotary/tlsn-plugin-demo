import path from 'path';
import fs from 'fs';


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
