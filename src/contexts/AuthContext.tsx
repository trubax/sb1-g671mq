import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, provider, db } from '../firebase';
import { 
  signInWithPopup,
  signInWithRedirect,
  signOut, 
  onAuthStateChanged, 
  User,
  browserLocalPersistence,
  setPersistence,
  getRedirectResult,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loginAnonymously: (nickname: string) => Promise<void>;
  bypassAuth: () => void;
  loading: boolean;
  isAnonymous: boolean;
  isDevelopment: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve essere utilizzato all\'interno di un AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    const initialize = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          setCurrentUser(result.user);
          setIsAnonymous(result.user.isAnonymous);
        }
      } catch (error) {
        console.error('Errore durante l\'inizializzazione:', error);
      }
    };

    initialize();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAnonymous(user?.isAnonymous || false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          isAnonymous: false,
          lastSeen: serverTimestamp()
        }, { merge: true });
      }
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  };

  const loginAnonymously = async (nickname: string) => {
    try {
      const result = await firebaseSignInAnonymously(auth);
      const user = result.user;

      await updateProfile(user, {
        displayName: nickname,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`
      });

      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 24);

      await setDoc(doc(db, 'users', user.uid), {
        nickname,
        displayName: nickname,
        isAnonymous: true,
        createdAt: serverTimestamp(),
        expiresAt: expirationTime.toISOString(),
        lastSeen: serverTimestamp(),
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(nickname)}&background=random`
      });

      localStorage.setItem('anonymousLoginTime', new Date().toISOString());
      localStorage.setItem('anonymousUserId', user.uid);

      setIsAnonymous(true);
      return user;
    } catch (error) {
      console.error('Errore durante l\'accesso anonimo:', error);
      throw new Error('Non è stato possibile creare un account temporaneo. Riprova più tardi.');
    }
  };

  const bypassAuth = () => {
    if (!isDevelopment) return;
    
    const devUser = {
      uid: 'dev-user-123',
      email: 'dev@example.com',
      displayName: 'Developer',
      photoURL: 'https://ui-avatars.com/api/?name=Developer&background=random',
      isAnonymous: false
    } as User;
    
    setCurrentUser(devUser);
    setIsAnonymous(false);
    localStorage.setItem('devMode', 'true');
  };

  const logout = async () => {
    try {
      if (isDevelopment && localStorage.getItem('devMode')) {
        localStorage.removeItem('devMode');
        setCurrentUser(null);
        setIsAnonymous(false);
        return;
      }

      const wasAnonymous = auth.currentUser?.isAnonymous;
      await signOut(auth);
      
      if (wasAnonymous) {
        localStorage.removeItem('anonymousLoginTime');
        localStorage.removeItem('anonymousUserId');
      }
      
      setIsAnonymous(false);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkAnonymousExpiration = () => {
      const loginTime = localStorage.getItem('anonymousLoginTime');
      if (loginTime && auth.currentUser?.isAnonymous) {
        const expirationTime = new Date(loginTime);
        expirationTime.setHours(expirationTime.getHours() + 24);
        
        if (new Date() > expirationTime) {
          logout();
        }
      }
    };

    const interval = setInterval(checkAnonymousExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    loginAnonymously,
    bypassAuth,
    loading,
    isAnonymous,
    isDevelopment
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};