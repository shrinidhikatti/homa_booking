import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'classEnquiries';

export const createEnquiry = async (data) => {
  try {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('Error creating enquiry:', error);
    throw error;
  }
};

export const updateEnquiry = async (id, data) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { id, ...data };
  } catch (error) {
    console.error('Error updating enquiry:', error);
    throw error;
  }
};

export const deleteEnquiry = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return id;
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    throw error;
  }
};

export const getAllEnquiries = async () => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    throw error;
  }
};
