import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

let serviceAccount: any;

let db: any;

if (process.env.POAP !== 'true') {
  console.log(`POAP feature is disabled`);
  db = {};
} else {
  console.log(`POAP feature is enabled`);

  // Use the real config in production
  serviceAccount = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'util/firebase-admin.json'), 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  db = admin.firestore();

}

export const getUserPoap = async (
  screen_name: string,
): Promise<string | null> => {
  const assignmentRef = db.collection('poapAssignments').doc(screen_name);
  const assignmentSnap = await assignmentRef.get();

  if (assignmentSnap.exists) {
    return assignmentSnap.data()?.poapLink || null;
  }
  return null;
};

export const assignPoapToUser = async (
  screen_name: string,
): Promise<string | null> => {
  const existingPoap = await getUserPoap(screen_name);
  if (existingPoap) return existingPoap;

  const poapsDocRef = db.collection('poaps').doc('poaps');
  const poapsDoc = await poapsDocRef.get();

  if (!poapsDoc.exists) {
    console.error('POAPs document not found in Firestore.');
    return null;
  }

  const poapsData = poapsDoc.data()?.links || {};
  const poapKeys = Object.keys(poapsData);

  if (poapKeys.length === 0) {
    console.log('No available POAPs left.');
    return null;
  }

  const firstKey = poapKeys[0];
  const poapLink = poapsData[firstKey];

  if (!poapLink) {
    console.error('Invalid POAP link found:', poapsData);
    return null;
  }

  try {
    const batch = db.batch();

    const assignmentRef = db.collection('poapAssignments').doc(screen_name);
    batch.set(assignmentRef, {
      poapLink,
      screen_name,
      assignedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.update(poapsDocRef, {
      [`links.${firstKey}`]: admin.firestore.FieldValue.delete(),
    });

    await batch.commit();

    return poapLink;
  } catch (error) {
    console.error('Error writing to Firestore:', error);
    return null;
  }
};
