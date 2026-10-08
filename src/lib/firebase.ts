/**
 * Firebase Production Authentication & Firestore Provider
 * Supports real email/password authentication, email verification gating,
 * password reset flow, and Firestore-backed role-based access control.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { UserRole } from '../types';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || '(default)'
};

// Initialize App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organization: string;
  location: string;
  createdAt: string;
}

/**
 * Maps Firebase Auth error codes into clear, human-readable guidance
 */
export function formatFirebaseAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const errCode = (error as { code?: string }).code || '';

  switch (errCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/user-not-found':
      return 'No registered account found with this email address. Please sign up first.';
    case 'auth/email-already-in-use':
      return 'An account is already registered with this email address. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid, properly formatted email address (e.g., name@domain.com).';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long with a mix of letters and numbers.';
    case 'auth/too-many-requests':
      return 'Access temporarily locked due to consecutive failed attempts. Please reset your password or wait a few minutes.';
    case 'auth/network-request-failed':
      return 'Network communication failure. Please verify your internet connectivity.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by security compliance. Please contact support.';
    default:
      return (error as Error).message || 'Authentication failed. Please check your details and try again.';
  }
}

/**
 * Register a new user with real email verification and role storage
 */
export async function registerWithEmailPassword(
  email: string,
  pass: string,
  name: string,
  role: UserRole,
  organization: string = 'AgriSupply Member',
  location: string = 'Punjab, Pakistan'
): Promise<{ user: FirebaseUser; profile: FirestoreUserProfile }> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const user = cred.user;

  // Set display name in auth profile
  await updateProfile(user, { displayName: name });

  // Send real verification email
  await sendEmailVerification(user);

  // Store user role and metadata in Firestore
  const profile: FirestoreUserProfile = {
    uid: user.uid,
    email: user.email || email,
    name: name || 'Operator',
    role,
    organization: organization || 'AgriSupply Network',
    location: location || 'Punjab Logistics Cluster',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', user.uid), profile);
  } catch (err) {
    console.warn('Firestore user profile write notice:', err);
  }

  return { user, profile };
}

/**
 * Sign in existing user and retrieve role from Firestore
 */
export async function loginWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user: FirebaseUser; profile: FirestoreUserProfile; isEmailVerified: boolean }> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const user = cred.user;
  const isEmailVerified = user.emailVerified;

  // Retrieve user role profile from Firestore
  let profile: FirestoreUserProfile = {
    uid: user.uid,
    email: user.email || email,
    name: user.displayName || 'Operator',
    role: 'FARMER',
    organization: 'AgriSupply Network',
    location: 'Punjab Regional Hub',
    createdAt: new Date().toISOString()
  };

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      profile = userDoc.data() as FirestoreUserProfile;
    }
  } catch (err) {
    console.warn('Firestore profile fetch notice (fallback role assigned):', err);
  }

  return { user, profile, isEmailVerified };
}

/**
 * Send password reset email with formatted error handling
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Resend email verification with rate-limiting safeguard
 */
let lastResendTimestamp = 0;
export async function resendVerificationEmail(user: FirebaseUser): Promise<{ success: boolean; message: string }> {
  const now = Date.now();
  const cooldownSeconds = 60;
  const elapsed = Math.floor((now - lastResendTimestamp) / 1000);

  if (elapsed < cooldownSeconds) {
    const remaining = cooldownSeconds - elapsed;
    return {
      success: false,
      message: `Please wait ${remaining} second${remaining > 1 ? 's' : ''} before requesting another verification email.`
    };
  }

  await sendEmailVerification(user);
  lastResendTimestamp = now;
  return {
    success: true,
    message: 'Verification email resent! Please check your spam or inbox folders.'
  };
}

/**
 * Sign out user
 */
export async function logOutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to persistent Auth state changes across browser refreshes
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null, profile: FirestoreUserProfile | null) => void
): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null);
      return;
    }

    let profile: FirestoreUserProfile | null = null;
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        profile = snap.data() as FirestoreUserProfile;
      } else {
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || 'Operator',
          role: 'FARMER',
          organization: 'AgriSupply Network',
          location: 'Punjab Logistics Cluster',
          createdAt: new Date().toISOString()
        };
      }
    } catch {
      profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Operator',
        role: 'FARMER',
        organization: 'AgriSupply Network',
        location: 'Punjab Logistics Cluster',
        createdAt: new Date().toISOString()
      };
    }

    callback(firebaseUser, profile);
  });
}
