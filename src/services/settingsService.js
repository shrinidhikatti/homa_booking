import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const SETTINGS_DOC = 'appSettings';
const SETTINGS_COLLECTION = 'settings';

export const saveSettings = async (settings) => {
  try {
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC), {
      ...settings,
      updatedAt: Timestamp.now()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
};

export const loadSettings = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
    if (snap.exists()) return snap.data();
    return {};
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
};
