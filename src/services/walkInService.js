import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'walkIns';

export const createWalkIn = async (data) => {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    whatsappStatus: 'pending',
    createdAt: Timestamp.now()
  });
  return { id: ref.id, ...data, whatsappStatus: 'pending' };
};

export const updateWalkInWhatsappStatus = async (id, status) => {
  await updateDoc(doc(db, COLLECTION, id), { whatsappStatus: status });
};

export const getWalkIns = async (office) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (!office) return all;
  if (office === 'Ramdev Galli') {
    return all.filter(e => e.office === 'Ramdev Galli' || !e.office);
  }
  return all.filter(e => e.office === office);
};

// Real-time listener — returns unsubscribe function
export const subscribeWalkIns = (office, callback) => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    let filtered;
    if (!office) {
      filtered = all;
    } else if (office === 'Ramdev Galli') {
      filtered = all.filter(e => e.office === 'Ramdev Galli' || !e.office);
    } else {
      filtered = all.filter(e => e.office === office);
    }
    callback(filtered);
  });
};

// Get latest incoming message for a walk-in entry
export const getIncomingMessage = async (walkInId) => {
  const q = query(
    collection(db, 'incomingMessages'),
    where('walkInId', '==', walkInId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  // Sort in code to avoid composite index requirement
  const sorted = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.receivedAt?.seconds || 0) - (a.receivedAt?.seconds || 0));
  return sorted[0];
};

// Mark message as replied
export const markAsReplied = async (messageId, replyText) => {
  await updateDoc(doc(db, 'incomingMessages', messageId), {
    replied: true,
    replyText,
    repliedAt: Timestamp.now()
  });
};
