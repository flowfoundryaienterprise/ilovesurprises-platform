import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
  type AuthError,
} from 'firebase/auth';
import { firebaseAuth, googleProvider, isFirebaseConfigured, getFirebaseConfigStatus } from './firebaseClient';
import { supabase } from './supabaseClient';
import { accountService } from './accountService';
import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { sponsorService } from './sponsorService';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';

export interface CustomerAuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isAlreadyRegistered?: boolean;
}

let isAuthInitialized = false;
let authReadyResolve: () => void;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

/**
 * Maps Firebase Auth errors to human-friendly, professional messages
 */
function mapFirebaseError(error: AuthError | any, _context: 'login' | 'register' | 'google' | 'reset'): string {
  const code = (error?.code || '').toLowerCase();
  const msg = (error?.message || '').toLowerCase();

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in the Firebase Console. Please add this domain to Authorized Domains in Firebase Authentication Settings.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with the same email using a different sign-in provider. Please log in with your original method.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'This email is already registered. Please log in instead.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please double-check your credentials and try again.';
  }
  if (code === 'auth/weak-password') {
    return 'Password must be at least 6 characters.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact customer concierge.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many sign-in attempts have been submitted. Please wait a few moments before trying again.';
  }
  if (code === 'auth/network-request-failed' || msg.includes('network')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/configuration-not-found' || msg.includes('configuration-not-found')) {
    return 'Google sign-in is not enabled yet in the Firebase Console. Please enable Google in Firebase Authentication settings.';
  }

  return error?.message || 'Authentication failed. Please try again.';
}

export const customerAuthService = {
  /**
   * Indicates if Firebase customer auth is ready/initialized
   */
  isAuthReady(): boolean {
    return isAuthInitialized;
  },

  /**
   * Promise that resolves once Firebase has checked the persistent auth session
   */
  waitForAuthReady(): Promise<void> {
    if (isAuthInitialized) return Promise.resolve();
    return authReadyPromise;
  },

  /**
   * Initializes the persistent Firebase customer auth state listener.
   * Runs once on application start.
   */
  initAuthStateListener(onUserChange?: (user: UserProfile | null) => void): () => void {
    if (!isFirebaseConfigured() || !firebaseAuth) {
      isAuthInitialized = true;
      authReadyResolve();
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        // Sync Firebase user with Supabase customer profile
        try {
          const profile = await this.syncFirebaseCustomerProfile(fbUser);
          if (profile) {
            accountService.updateStoredUser(profile);
            onUserChange?.(profile);
            window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
          }
        } catch (err) {
          console.warn('Customer profile synchronization warning:', err);
        }
      } else {
        // Only clear stored user if the stored user is NOT an admin
        const currentStored = accountService.getStoredUser();
        if (currentStored && currentStored.role !== 'admin') {
          accountService.updateStoredUser(null);
          onUserChange?.(null);
          window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
        }
      }

      if (!isAuthInitialized) {
        isAuthInitialized = true;
        authReadyResolve();
      }
    });

    return unsubscribe;
  },

  /**
   * Sign In / Sign Up with Google OAuth via Firebase
   */
  async signInWithGoogle(): Promise<CustomerAuthResult> {
    if (!isFirebaseConfigured() || !firebaseAuth || !googleProvider) {
      const status = getFirebaseConfigStatus();
      return {
        success: false,
        error: `Firebase is not configured. Missing: ${status.missingKeys.join(', ')}. Please update your environment settings.`,
      };
    }

    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      if (!result.user || !result.user.email) {
        return {
          success: false,
          error: 'Google authentication failed to return a valid email address.',
        };
      }

      const userProfile = await this.syncFirebaseCustomerProfile(result.user);
      if (!userProfile) {
        return {
          success: false,
          error: 'Failed to synchronize customer profile.',
        };
      }

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: mapFirebaseError(err, 'google'),
      };
    }
  },

  /**
   * Register with Email & Password via Firebase
   */
  async registerWithEmailPassword(payload: RegisterPayload): Promise<CustomerAuthResult> {
    if (!isFirebaseConfigured() || !firebaseAuth) {
      const status = getFirebaseConfigStatus();
      return {
        success: false,
        error: `Firebase is not configured. Missing: ${status.missingKeys.join(', ')}. Please update your environment settings.`,
      };
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();

    if (!cleanName || cleanName.length < 2) {
      return {
        success: false,
        error: 'Full name must be at least 2 characters.',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    const isRep = payload.role === 'representative';
    let cleanRepUsername: string | null = null;
    let sponsorUsername: string | null = null;
    let uplineChain: string[] = [];

    if (isRep) {
      if (!payload.repUsername?.trim()) {
        return {
          success: false,
          error: 'Please choose a representative handle.',
        };
      }
      cleanRepUsername = sponsorService.normalizeUsername(payload.repUsername);
      const validation = sponsorService.validateUsername(cleanRepUsername);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid representative handle format.',
        };
      }
      const available = await sponsorService.isUsernameAvailable(cleanRepUsername);
      if (!available) {
        return {
          success: false,
          error: `The representative handle "${cleanRepUsername}" is already taken. Please choose another vanity handle.`,
        };
      }

      if (payload.sponsorUsername?.trim()) {
        const resolvedSponsor = await sponsorService.resolveSponsor(payload.sponsorUsername);
        if (resolvedSponsor) {
          sponsorUsername = resolvedSponsor.username;
          try {
            uplineChain = await sponsorService.buildUpline(resolvedSponsor.username, cleanRepUsername);
          } catch (cycleErr: any) {
            return {
              success: false,
              error: cycleErr.message || 'Invalid sponsor hierarchy.',
            };
          }
        }
      }
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        firebaseAuth,
        cleanEmail,
        payload.password
      );

      // Update Firebase Auth user display name
      if (cleanName && userCredential.user) {
        try {
          await updateProfile(userCredential.user, { displayName: cleanName });
        } catch {
          // non-critical
        }
      }

      // Sync customer profile with Supabase
      const userProfile = await this.syncFirebaseCustomerProfile(userCredential.user, {
        name: cleanName,
        role: payload.role || 'customer',
        repUsername: cleanRepUsername || undefined,
        sponsorUsername: sponsorUsername || undefined,
        mobile: payload.mobile?.trim(),
      });

      if (!userProfile) {
        return {
          success: false,
          error: 'Account created, but profile synchronization failed. Please try logging in.',
        };
      }

      // If registered as representative, record sponsor hierarchy
      if (isRep && cleanRepUsername) {
        if (sponsorUsername) {
          try {
            await sponsorService.registerSponsorRelationship(
              cleanRepUsername,
              sponsorUsername,
              uplineChain,
              userProfile.id
            );
          } catch {
            // ignore
          }
        }
      }

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
      };
    } catch (err: any) {
      const isAlreadyReg = err?.code === 'auth/email-already-in-use';
      return {
        success: false,
        isAlreadyRegistered: isAlreadyReg,
        error: mapFirebaseError(err, 'register'),
      };
    }
  },

  /**
   * Log in with Email & Password via Firebase
   */
  async loginWithEmailPassword(payload: LoginPayload): Promise<CustomerAuthResult> {
    if (!isFirebaseConfigured() || !firebaseAuth) {
      const status = getFirebaseConfigStatus();
      return {
        success: false,
        error: `Firebase is not configured. Missing: ${status.missingKeys.join(', ')}. Please update your environment settings.`,
      };
    }

    const cleanEmail = payload.identifier.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      return {
        success: false,
        error: 'Please enter both your email address and password.',
      };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        cleanEmail,
        payload.password
      );

      const userProfile = await this.syncFirebaseCustomerProfile(userCredential.user);
      if (!userProfile) {
        return {
          success: false,
          error: 'Login succeeded, but profile synchronization failed. Please try again.',
        };
      }

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
      };
    } catch (err: any) {
      return {
        success: false,
        error: mapFirebaseError(err, 'login'),
      };
    }
  },

  /**
   * Send Password Reset Email via Firebase
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    if (!isFirebaseConfigured() || !firebaseAuth) {
      const status = getFirebaseConfigStatus();
      return {
        success: false,
        message: '',
        error: `Firebase is not configured. Missing: ${status.missingKeys.join(', ')}.`,
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(firebaseAuth, cleanEmail);
      return {
        success: true,
        message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox and follow the link to reset your password.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: mapFirebaseError(err, 'reset'),
      };
    }
  },

  /**
   * Signs the customer out of Firebase Authentication
   */
  async logout(): Promise<void> {
    if (firebaseAuth) {
      try {
        await signOut(firebaseAuth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  },

  /**
   * Idempotent Customer Profile Synchronization with Supabase:
   * 1. Checks if customer profile already exists in Supabase by firebase_uid or email.
   * 2. If existing customer: Links to that customer, never creates duplicate profiles.
   * 3. Preserves existing affiliate/referrer, sponsor, and lifetime attribution.
   * 4. Supports Google profile avatar.
   */
  async syncFirebaseCustomerProfile(
    fbUser: FirebaseUser,
    options?: {
      name?: string;
      role?: 'customer' | 'representative';
      repUsername?: string;
      sponsorUsername?: string;
      mobile?: string;
    }
  ): Promise<UserProfile | null> {
    const cleanEmail = (fbUser.email || '').trim().toLowerCase();
    const fbUid = fbUser.uid;
    const fallbackName = options?.name || fbUser.displayName || cleanEmail.split('@')[0] || 'Valued Customer';
    const googleAvatar = fbUser.photoURL || null;

    let existingProfile: any = null;

    // Step 1: Query Supabase for existing profile by firebase_uid OR by email
    try {
      // First check by firebase_uid if column exists
      try {
        const { data: byUid } = await supabase
          .from('profiles')
          .select('*')
          .eq('firebase_uid', fbUid)
          .maybeSingle();
        if (byUid) existingProfile = byUid;
      } catch {
        // firebase_uid column may not be migrated yet
      }

      // Next check by email (idempotent link to existing customer)
      if (!existingProfile && cleanEmail) {
        const { data: byEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (byEmail) existingProfile = byEmail;
      }
    } catch (lookupErr) {
      console.warn('Supabase profile lookup warning:', lookupErr);
    }

    // Step 2: Handle Existing Profile (Link & Preserve)
    if (existingProfile) {
      // If customer already has a profile, link firebase_uid if missing
      try {
        const updates: {
          updated_at: string;
          avatar_url?: string;
          firebase_uid?: string;
          name?: string;
        } = {
          updated_at: new Date().toISOString(),
        };
        if (googleAvatar && !existingProfile.avatar_url) {
          updates.avatar_url = googleAvatar;
        }
        if (!existingProfile.firebase_uid) {
          updates.firebase_uid = fbUid;
        }
        if (options?.name && !existingProfile.name) {
          updates.name = options.name;
        }

        await supabase
          .from('profiles')
          .update(updates)
          .eq('id', existingProfile.id);
      } catch {
        // Non-blocking update failure
      }

      const activeAvatar = googleAvatar || existingProfile.avatar_url || '/assets/ilovesurprises/Profile/profile%20image.webp';

      return {
        id: existingProfile.id,
        name: existingProfile.name || fallbackName,
        email: existingProfile.email || cleanEmail,
        role: existingProfile.role || 'customer',
        repUsername: existingProfile.rep_username || undefined,
        avatar: activeAvatar,
      };
    }

    // Step 3: Brand-new Customer Profile Creation
    let assignedRep: string | undefined = options?.repUsername;

    if (!assignedRep && options?.role !== 'representative') {
      try {
        const sessionRep = representativeService.getAttributedRepresentative()?.repUsername;
        const attribution = await attributionService.resolveAttributionForCheckout({
          customerEmail: cleanEmail,
          currentSessionRep: sessionRep,
        });
        if (attribution.repUsername) {
          assignedRep = attribution.repUsername;
        }
      } catch {
        // fallback
      }
    }

    const generatedUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : fbUid;
    const finalAvatar = googleAvatar || '/assets/ilovesurprises/Profile/profile%20image.webp';

    const newProfileRow = {
      id: generatedUuid,
      firebase_uid: fbUid,
      name: fallbackName,
      email: cleanEmail,
      role: (options?.role || 'customer') as 'customer' | 'representative' | 'admin',
      rep_username: assignedRep || null,
      avatar_url: finalAvatar,
      mobile: options?.mobile || null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    let savedId = generatedUuid;

    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert([newProfileRow])
        .select('*')
        .maybeSingle();

      if (!insertErr && inserted) {
        savedId = inserted.id;
      }
    } catch (insertErr) {
      console.warn('Supabase profile insertion note (offline/DDL pending):', insertErr);
    }

    // Save permanent referral attribution if assigned
    if (assignedRep && options?.role !== 'representative') {
      try {
        await attributionService.setPermanentAttribution({
          customerEmail: cleanEmail,
          repUsername: assignedRep,
          userId: savedId,
        });
      } catch {
        // non-blocking
      }
    }

    return {
      id: savedId,
      name: fallbackName,
      email: cleanEmail,
      role: options?.role || 'customer',
      repUsername: assignedRep || undefined,
      avatar: finalAvatar,
    };
  },
};
