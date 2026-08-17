import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'walkIns';
const RECENT_LIMIT = 25;

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

// Full history for a given office — one-time fetch, used for Excel export
// (not the live view, so it's fine for this to read the full set on demand)
export const getWalkIns = async (office) => {
  const q = office
    ? query(collection(db, COLLECTION), where('office', '==', office), orderBy('createdAt', 'desc'))
    : query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Real-time listener — only the most recent RECENT_LIMIT entries for the given
// office, to keep Firestore reads bounded regardless of how large the
// collection grows. Older entries are available via Excel export.
export const subscribeWalkIns = (office, callback) => {
  const q = office
    ? query(collection(db, COLLECTION), where('office', '==', office), orderBy('createdAt', 'desc'), limit(RECENT_LIMIT))
    : query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(RECENT_LIMIT));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
  const sorted = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.receivedAt?.seconds || 0) - (a.receivedAt?.seconds || 0));
  return sorted[0];
};

// Get full chat history for a walk-in entry (both incoming and outgoing)
export const getChatHistory = async (walkInId) => {
  const q = query(
    collection(db, 'incomingMessages'),
    where('walkInId', '==', walkInId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return [];
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.receivedAt?.seconds || a.sentAt?.seconds || 0;
      const bTime = b.receivedAt?.seconds || b.sentAt?.seconds || 0;
      return aTime - bTime;
    });
};

// Store outgoing reply in chat history
export const storeOutgoingMessage = async (walkInId, text) => {
  await addDoc(collection(db, 'incomingMessages'), {
    walkInId,
    text,
    direction: 'outgoing',
    sentAt: Timestamp.now(),
    receivedAt: Timestamp.now()
  });
};

// Mark message as replied
export const markAsReplied = async (messageId, replyText) => {
  await updateDoc(doc(db, 'incomingMessages', messageId), {
    replied: true,
    replyText,
    repliedAt: Timestamp.now()
  });
};
