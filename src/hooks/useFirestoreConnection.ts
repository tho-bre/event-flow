import { useState, useEffect } from 'react';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';

export function useFirestoreConnection() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firestoreEnabled, setFirestoreEnabled] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db).then(() => setFirestoreEnabled(true));
    };

    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db).then(() => setFirestoreEnabled(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [db]);

  return { isOnline, firestoreEnabled };
}