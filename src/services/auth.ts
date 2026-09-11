import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { accountService } from './accountService';
import { attributionService } from './attributionService';
import { representativeService } from './representativeService';
import { sponsorService } from './sponsorService';

export interface LoginPayload {
  identifier: string; // Email
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role?: 'customer' | 'representative';
  repUsername?: string;
  sponsorUsername?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
  message?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Validates password strength cleanly with minimal UI footprint
 */
export function evaluatePasswordStrength(password: string): {
  score: 1 | 2 | 3;
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  percentage: number;
} {
  if (!password) {
    return { score: 1, label: 'Weak', color: '#ef4444', percentage: 0 };
  }

  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.length >= 8 && /[0-9]/.test(password)) strength += 1;
  if (password.length >= 10 && /[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength >= 3) {
    return { score: 3, label: 'Strong', color: '#10b981', percentage: 100 };
  }
  if (strength === 2) {
    return { score: 2, label: 'Medium', color: '#f59e0b', percentage: 66 };
  }
  return { score: 1, label: 'Weak', color: '#ef4444', percentage: 33 };
}

/**
 * Validates email or 10-digit mobile number input
 */
export function isValidEmailOrMobile(value: string): boolean {
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  return emailRegex.test(trimmed) || mobileRegex.test(trimmed.replace(/[\s-()]/g, ''));
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates mobile number format (US / International 10+ digits)
 */
export function isValidMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[\s-()]/g, '');
  return cleaned.length >= 10 && /^\+?\d+$/.test(cleaned);
}

/**
 * Maps Supabase Auth errors to truthful, user-friendly, and actionable messages.
 * Prevents masking rate limits or real errors as generic "server traffic" issues.
 */
export function mapAuthError(
  error: any,
  context: 'login' | 'register' | 'forgot_password' | 'reset_password' | 'resend_verification' = 'register'
): string {
  if (!error) return 'An unexpected authentication error occurred. Please try again.';

  const rawMsg = (error.message || error.error_description || error.msg || '');
  const msg = rawMsg.toLowerCase();
  const status = Number(error.status || error.statusCode || 0);
  const code = (error.code || error.error_code || '').toLowerCase();

  // 1. Network Failure / Connection Error
  const isNetworkFailure =
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('connection') ||
    msg.includes('offline') ||
    msg.includes('abort') ||
    code.includes('network');

  if (isNetworkFailure) {
    return 'Connection error. Unable to reach the authentication service. Please check your internet connection and try again.';
  }

  // 2. Supabase Unavailable / 5xx Server Errors
  if (status >= 500) {
    return 'Authentication service is temporarily unavailable. Please try again in a few moments.';
  }

  // 3. 429 Rate Limits
  if (
    status === 429 ||
    msg.includes('rate limit') ||
    code.includes('rate_limit') ||
    msg.includes('too many requests') ||
    msg.includes('security purposes') ||
    msg.includes('over_email_send_rate_limit')
  ) {
    // If Supabase returned a specific wait time, e.g. "For security purposes, you can only request this after 52 seconds."
    if (msg.includes('security purposes') || (msg.includes('after') && msg.includes('second'))) {
      return rawMsg;
    }

    if (
      code === 'over_email_send_rate_limit' ||
      msg.includes('email rate limit') ||
      msg.includes('email send') ||
      msg.includes('over_email_send_rate_limit')
    ) {
      if (context === 'resend_verification') {
        return 'Email verification rate limit reached. For security, please wait 60 seconds before requesting another verification email.';
      }
      return 'Email rate limit exceeded. Too many requests have been submitted. Please wait a few moments before trying again, or log in if your account is already created.';
    }
    if (context === 'login') {
      return 'Too many sign-in attempts. Please wait a few moments and try again.';
    }
    if (context === 'forgot_password') {
      return 'Reset email rate limit reached. If you recently requested a reset, please check your inbox or try again shortly.';
    }
    return 'Rate limit reached. Too many requests have been submitted. Please wait a few moments and try again.';
  }

  // 4. Invalid Credentials (Wrong password or nonexistent email)
  if (
    code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please double-check your credentials and try again.';
  }

  // 5. Existing Email / Account Already Exists
  if (
    code === 'user_already_exists' ||
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already registered')
  ) {
    return 'An account with this email address already exists. Please log in instead.';
  }

  // 6. Unconfirmed Email
  if (
    code === 'email_not_confirmed' ||
    msg.includes('email not confirmed') ||
    msg.includes('not confirmed')
  ) {
    return 'Your email address is not verified yet. Please check your inbox for the confirmation link.';
  }

  // 7. Account Suspended / Banned
  if (msg.includes('suspended') || msg.includes('banned') || msg.includes('disabled')) {
    return 'This account has been suspended. Please contact customer concierge.';
  }

  // 8. Explicit validation error messages from Supabase (400 / 422)
  if (rawMsg && (status === 400 || status === 422)) {
    return rawMsg;
  }

  // 9. Fallback
  return rawMsg || 'Authentication failed. Please try again.';
}

// In-flight request tracking to guarantee only ONE network request per email
const inFlightRegistrations = new Set<string>();
const inFlightPasswordResets = new Set<string>();
const inFlightResends = new Set<string>();

/**
 * Auth Service layer directly integrated with Supabase Auth
 */
export const authService = {
  /**
   * Performs customer login via Supabase Auth
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const identifier = payload.identifier.trim();
    if (!identifier || !payload.password) {
      return {
        success: false,
        error: 'Please provide both email and password.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Authentication service is temporarily unavailable. Please try again.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.toLowerCase(),
        password: payload.password,
      });

      if (error) {
        const errorMsg = mapAuthError(error, 'login');
        const isUnconfirmed =
          (error.message || '').toLowerCase().includes('email not confirmed') ||
          (error.message || '').toLowerCase().includes('not confirmed') ||
          (error as any).code === 'email_not_confirmed';

        return {
          success: false,
          requiresVerification: isUnconfirmed,
          error: errorMsg,
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user record returned from authentication.',
        };
      }

      // Check if user is suspended in profiles
      let userRole: 'customer' | 'representative' | 'admin' = (data.user.user_metadata?.role as any) || 'customer';
      let repUsername = data.user.user_metadata?.rep_username || undefined;
      let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Valued Customer';
      let avatarUrl = data.user.user_metadata?.avatar_url || '/assets/ilovesurprises/Profile/profile%20image.webp';

      // Query profiles table for live profile details
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (prof) {
          if (prof.name) userName = prof.name;
          if (prof.role) userRole = prof.role;
          if (prof.rep_username) repUsername = prof.rep_username;
          if (prof.avatar_url) avatarUrl = prof.avatar_url;
        }
      } catch {
        // fallback to metadata
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        name: userName,
        email: data.user.email || identifier.toLowerCase(),
        role: userRole,
        repUsername,
        avatar: avatarUrl,
      };

      // Persist in accountService
      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
        token: data.session?.access_token,
      };
    } catch (err: any) {
      return {
        success: false,
        error: mapAuthError(err, 'login'),
      };
    }
  },

  /**
   * Performs user registration / sign up via Supabase Auth
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (!payload.name.trim() || payload.name.trim().length < 2) {
      return {
        success: false,
        error: 'Full name must be at least 2 characters.',
      };
    }

    if (!isValidEmail(payload.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Authentication service is temporarily unavailable. Please try again.',
      };
    }

    const cleanEmail = payload.email.trim().toLowerCase();

    // Guard: Prevent concurrent duplicate registrations for the same email
    if (inFlightRegistrations.has(cleanEmail)) {
      return {
        success: false,
        error: 'A registration request for this email is already being processed. Please wait a moment.',
      };
    }

    inFlightRegistrations.add(cleanEmail);
    const isRep = payload.role === 'representative';
    let cleanRepUsername: string | null = null;
    let sponsorUsername: string | null = null;
    let uplineChain: string[] = [];

    try {
      if (isRep) {
        if (!payload.repUsername?.trim()) {
          return {
            success: false,
            error: 'Please choose a unique representative username / vanity handle.',
          };
        }

        cleanRepUsername = sponsorService.normalizeUsername(payload.repUsername);
        const validation = sponsorService.validateUsername(cleanRepUsername);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error || 'Invalid representative username format.',
          };
        }

        const available = await sponsorService.isUsernameAvailable(cleanRepUsername);
        if (!available) {
          return {
            success: false,
            error: `The representative username "${cleanRepUsername}" is already taken. Please choose another vanity handle.`,
          };
        }

        // Resolve sponsor
        const resolvedSponsor = await sponsorService.resolveSponsor(payload.sponsorUsername);
        if (resolvedSponsor) {
          sponsorUsername = resolvedSponsor.username;
          try {
            uplineChain = await sponsorService.buildUpline(resolvedSponsor.username, cleanRepUsername);
          } catch (cycleErr: any) {
            return {
              success: false,
              error: cycleErr.message || 'Invalid sponsor hierarchy. Circular relationships are not allowed.',
            };
          }
        }
      } else {
        // Resolve lifetime attribution for newly registered customer
        let assignedRep = payload.repUsername?.trim().toLowerCase();
        if (!assignedRep) {
          const sessionRep = representativeService.getAttributedRepresentative()?.repUsername;
          const attribution = await attributionService.resolveAttributionForCheckout({
            customerEmail: cleanEmail,
            currentSessionRep: sessionRep,
          });
          if (attribution.repUsername) {
            assignedRep = attribution.repUsername;
          }
        }
        cleanRepUsername = assignedRep || null;
      }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: payload.password,
        options: {
          data: {
            name: payload.name.trim(),
            mobile: payload.mobile?.trim() || null,
            role: payload.role || 'customer',
            rep_username: cleanRepUsername,
            sponsor_username: sponsorUsername,
            upline: uplineChain,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return {
          success: false,
          error: mapAuthError(error, 'register'),
        };
      }

      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
        };
      }

      const registeredUser = data.user;
      const sessionToken = data.session?.access_token;
      const hasActiveSession = Boolean(data.session);

      if (!registeredUser) {
        return {
          success: false,
          error: 'Registration failed to create a valid user profile.',
        };
      }

      // If representative, securely record sponsor relationship and update profile
      if (isRep && cleanRepUsername) {
        if (sponsorUsername) {
          await sponsorService.registerSponsorRelationship(
            cleanRepUsername,
            sponsorUsername,
            uplineChain,
            registeredUser.id
          );
        }
        try {
          await supabase.from('profiles').update({
            role: 'representative',
            rep_username: cleanRepUsername,
            name: payload.name.trim(),
            updated_at: new Date().toISOString(),
          }).eq('id', registeredUser.id);
        } catch {
          // ignore
        }
      } else if (!isRep && cleanRepUsername) {
        await attributionService.setPermanentAttribution({
          customerEmail: cleanEmail,
          repUsername: cleanRepUsername,
          userId: registeredUser.id,
        });
      }

      // If session was not established (e.g. standard signup requires confirmation email)
      if (!hasActiveSession) {
        return {
          success: true,
          requiresVerification: true,
          message: `Verification link sent to ${cleanEmail}. Please check your inbox and verify your email before logging in.`,
        };
      }

      // If session exists (immediate login)
      const userProfile: UserProfile = {
        id: registeredUser.id || 'usr-' + Date.now(),
        name: payload.name.trim(),
        email: cleanEmail,
        mobile: payload.mobile?.trim(),
        role: payload.role || 'customer',
        repUsername: cleanRepUsername || undefined,
        avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
      };

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        requiresVerification: false,
        user: userProfile,
        token: sessionToken,
      };
    } catch (err: any) {
      return {
        success: false,
        error: mapAuthError(err, 'register'),
      };
    } finally {
      inFlightRegistrations.delete(cleanEmail);
    }
  },

  /**
   * Initiates password reset flow via Supabase Auth
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid email address.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: '',
        error: 'Authentication service is temporarily unavailable. Please try again.',
      };
    }

    if (inFlightPasswordResets.has(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: 'A password reset request is already being processed. Please wait a moment.',
      };
    }

    inFlightPasswordResets.add(cleanEmail);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/?type=recovery`,
      });

      if (error) {
        return {
          success: false,
          message: '',
          error: mapAuthError(error, 'forgot_password'),
        };
      }

      return {
        success: true,
        message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: mapAuthError(err, 'forgot_password'),
      };
    } finally {
      inFlightPasswordResets.delete(cleanEmail);
    }
  },

  /**
   * Updates user password securely (used when in recovery session)
   */
  async resetPassword(newPassword: string): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters.',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: mapAuthError(error, 'reset_password'),
        };
      }

      // Invalidate recovery session so user can log in normally
      await supabase.auth.signOut();
      accountService.updateStoredUser(null);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        message: 'Your password has been successfully updated! You can now log in with your new password.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: mapAuthError(err, 'reset_password'),
      };
    }
  },

  /**
   * Resends email verification link
   */
  async resendVerification(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (inFlightResends.has(cleanEmail)) {
      return {
        success: false,
        error: 'A verification email request is already being processed. Please wait a moment.',
      };
    }

    inFlightResends.add(cleanEmail);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { success: false, error: mapAuthError(error, 'resend_verification') };
      }
      return { success: true, message: `Verification email has been resent to ${cleanEmail}.` };
    } catch (err: any) {
      return { success: false, error: mapAuthError(err, 'resend_verification') };
    } finally {
      inFlightResends.delete(cleanEmail);
    }
  },

  /**
   * Signs out the current user completely
   */
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  },

  /**
   * Initiates Google OAuth Sign-In via Supabase Auth
   */
  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Authentication service is temporarily unavailable. Please try again.',
      };
    }

    try {
      // Dynamic origin detection ensures compatibility across localhost and production
      const redirectTo = `${window.location.origin}/`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Unable to connect with Google. Please try again.',
        };
      }

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Network error occurred during Google sign in.',
      };
    }
  },

  /**
   * Synchronizes user profile for OAuth sign-ins
   * Ensures auth.users.id = profiles.id and prevents duplicate profiles
   */
  async syncOAuthUserProfile(user: any): Promise<UserProfile | null> {
    if (!user || !user.id) return null;

    const userId = user.id;
    const userEmail = (user.email || '').toLowerCase();
    const userName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      userEmail.split('@')[0] ||
      'Valued Customer';
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      '/assets/ilovesurprises/Profile/profile%20image.webp';

    try {
      // 1. Check if profile already exists for this exact id (auth.users.id = profiles.id)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        const userProfile: UserProfile = {
          id: existingProfile.id,
          name: existingProfile.name || userName,
          email: existingProfile.email || userEmail,
          role: existingProfile.role || 'customer',
          repUsername: existingProfile.rep_username || undefined,
          avatar: existingProfile.avatar_url || avatarUrl,
        };
        accountService.updateStoredUser(userProfile);
        window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
        return userProfile;
      }

      // 2. Profile does not exist: create safely ensuring auth.users.id = profiles.id
      let assignedRep: string | undefined = undefined;
      try {
        const sessionRep = representativeService.getAttributedRepresentative()?.repUsername;
        const attribution = await attributionService.resolveAttributionForCheckout({
          customerEmail: userEmail,
          currentSessionRep: sessionRep,
        });
        if (attribution.repUsername) {
          assignedRep = attribution.repUsername;
        }
      } catch {
        // ignore attribution lookup failures
      }

      const newProfile = {
        id: userId,
        name: userName,
        email: userEmail,
        role: 'customer' as const,
        rep_username: assignedRep || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      const activeProfile = inserted || newProfile;

      if (assignedRep) {
        try {
          await attributionService.setPermanentAttribution({
            customerEmail: userEmail,
            repUsername: assignedRep,
            userId,
          });
        } catch {
          // ignore
        }
      }

      const userProfile: UserProfile = {
        id: activeProfile.id,
        name: activeProfile.name,
        email: activeProfile.email,
        role: activeProfile.role || 'customer',
        repUsername: activeProfile.rep_username || undefined,
        avatar: activeProfile.avatar_url || avatarUrl,
      };

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
      return userProfile;
    } catch (err) {
      console.error('Failed to sync OAuth profile:', err);
      return null;
    }
  },

  /**
   * Fetches current authenticated user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      let userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Valued Customer';
      let userRole = (user.user_metadata?.role as any) || 'customer';
      let repUsername = user.user_metadata?.rep_username || undefined;
      let avatarUrl = user.user_metadata?.avatar_url || '/assets/ilovesurprises/Profile/profile%20image.webp';

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (prof) {
        if (prof.name) userName = prof.name;
        if (prof.role) userRole = prof.role;
        if (prof.rep_username) repUsername = prof.rep_username;
        if (prof.avatar_url) avatarUrl = prof.avatar_url;
      }

      return {
        id: user.id,
        name: userName,
        email: user.email || '',
        role: userRole,
        repUsername,
        avatar: avatarUrl,
      };
    } catch {
      return null;
    }
  },
};
