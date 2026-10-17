import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout as authLogout, 
  getAccessToken, 
  setCachedAccessToken,
  OFFICIAL_SENDER_EMAIL
} from '../services/googleAuth';
import { sendWelcomeEmailViaGmail, SendEmailResult } from '../services/gmailService';
import { Participant, Tournament } from '../types/tournament';
import { UniversityBrandConfig } from '../data/universityBrand';

interface GoogleAuthContextType {
  user: User | null;
  accessToken: string | null;
  isGmailConnected: boolean;
  isOfficialEmailConnected: boolean;
  officialEmail: string;
  isLoggingIn: boolean;
  loginError: string | null;
  loginWithGoogle: (emailHint?: string) => Promise<string | null>;
  logoutGoogle: () => Promise<void>;
  sendEmail: (
    participant: Participant,
    tournament: Tournament,
    brandConfig: UniversityBrandConfig
  ) => Promise<SendEmailResult>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProviderComponent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async (emailHint: string = OFFICIAL_SENDER_EMAIL): Promise<string | null> => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn(emailHint);
      setUser(result.user);
      setAccessToken(result.accessToken);
      return result.accessToken;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setLoginError(msg);
      return null;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logoutGoogle = useCallback(async () => {
    try {
      await authLogout();
      setUser(null);
      setAccessToken(null);
      setCachedAccessToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  const isOfficialEmailConnected = Boolean(
    user?.email && user.email.toLowerCase() === OFFICIAL_SENDER_EMAIL.toLowerCase()
  );

  const sendEmail = useCallback(async (
    participant: Participant,
    tournament: Tournament,
    brandConfig: UniversityBrandConfig
  ): Promise<SendEmailResult> => {
    let currentToken = accessToken;
    if (!currentToken) {
      currentToken = await getAccessToken();
    }

    if (!currentToken) {
      return {
        success: false,
        error: `Debes conectar la cuenta de Gmail (${OFFICIAL_SENDER_EMAIL}) antes de realizar el envío automático.`,
        recipient: participant.email,
      };
    }

    const senderEmail = user?.email || OFFICIAL_SENDER_EMAIL;

    return await sendWelcomeEmailViaGmail(
      participant,
      tournament,
      brandConfig,
      currentToken,
      `${brandConfig.teamName || 'ESPORTS'} - ${brandConfig.facultyName || 'FIT UAT'}`,
      senderEmail
    );
  }, [accessToken, user]);

  const value: GoogleAuthContextType = {
    user,
    accessToken,
    isGmailConnected: Boolean(user && accessToken),
    isOfficialEmailConnected,
    officialEmail: OFFICIAL_SENDER_EMAIL,
    isLoggingIn,
    loginError,
    loginWithGoogle,
    logoutGoogle,
    sendEmail,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
  const context = useContext(GoogleAuthContext);
  if (!context) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProviderComponent');
  }
  return context;
};
