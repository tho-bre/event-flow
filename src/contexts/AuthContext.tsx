import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  associationId: string | null;
  associationName: string | null;
  isActive: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, associationName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [associationId, setAssociationId] = useState<string | null>(null);
  const [associationName, setAssociationName] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'associations', user.uid));
        const data = userDoc.data();
        setAssociationId(userDoc.id);
        setAssociationName(data?.name || null);
        setIsActive(data?.is_active || false);
      } else {
        setAssociationId(null);
        setAssociationName(null);
        setIsActive(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'associations', result.user.uid));
    const data = userDoc.data();
    
    if (!data?.is_active) {
      await firebaseSignOut(auth);
      throw new Error("Votre compte n'est pas encore activé. Veuillez contacter l'administrateur.");
    }
    
    setAssociationId(userDoc.id);
    setAssociationName(data?.name || null);
    setIsActive(data?.is_active || false);
  };

  const signUp = async (email: string, password: string, associationName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'associations', result.user.uid), {
      name: associationName,
      email: email,
      is_active: false,
      createdAt: new Date()
    });
    await firebaseSignOut(auth);
    throw new Error("Votre compte a été créé mais doit être activé par l'administrateur avant de pouvoir être utilisé.");
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAssociationId(null);
    setAssociationName(null);
    setIsActive(false);
  };

  const value = {
    user,
    associationId,
    associationName,
    isActive,
    signIn,
    signUp,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}