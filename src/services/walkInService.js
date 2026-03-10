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

export const getWalkIns = async () => {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
