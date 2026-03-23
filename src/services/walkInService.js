import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  query,
  orderBy,
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
    // Old entries (no office field) belong to Ramdev Galli
    return all.filter(e => e.office === 'Ramdev Galli' || !e.office);
  }
  return all.filter(e => e.office === office);
};
