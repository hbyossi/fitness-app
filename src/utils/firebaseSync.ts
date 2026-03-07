import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { firestore } from '../firebase';
import type { AppState } from '../types';

function userDocRef(uid: string) {
  return doc(firestore, 'users', uid, 'data', 'appState');
}

export async function loadCloudData(uid: string): Promise<AppState | null> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  return snap.data() as AppState;
}

export async function saveCloudData(uid: string, data: AppState): Promise<void> {
  await setDoc(userDocRef(uid), { ...data, _lastModified: Date.now() });
}

let savePending: ReturnType<typeof setTimeout> | null = null;

export function debouncedSaveCloud(uid: string, data: AppState): void {
  if (savePending) clearTimeout(savePending);
  savePending = setTimeout(() => saveCloudData(uid, data), 1000);
}

export function listenCloudData(uid: string, onData: (data: AppState) => void): Unsubscribe {
  return onSnapshot(userDocRef(uid), (snap) => {
    if (snap.exists()) {
      onData(snap.data() as AppState);
    }
  });
}
