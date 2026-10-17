import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase app instance if already initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Workspace Scopes for Gmail
export const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Request offline access / prompt select account if needed
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token cache (Do NOT store in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

/**
 * Initialize auth state listener. Call this on app load.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged into Firebase, but access token needs retrieval on next user action
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const OFFICIAL_SENDER_EMAIL = 'pasantiasdigitales@gmail.com';

/**
 * Must be triggered by a user action (e.g. clicking Connect Google / Sign In)
 * Automatically hints pasantiasdigitales@gmail.com so Google selects it by default.
 */
export const googleSignIn = async (loginHint: string = OFFICIAL_SENDER_EMAIL): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    
    // Configure provider with login_hint and prompt to ease selecting the requested email
    if (loginHint) {
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: loginHint,
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Error during Google sign-in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get current in-memory access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Set in-memory access token
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Log out and clear cached token
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
  }
};
