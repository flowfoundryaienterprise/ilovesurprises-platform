import type { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { accountService } from './accountService';
import { attributionService } from './attributionService';
import { representativeService } from './representativeService';
import { customerAuthService } from './customerAuthService';

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
  isAlreadyRegistered?: boolean;
  isRateLimited?: boolean;
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
    return 'This email is already registered. Please log in instead.';
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
const inFlightResends = new Set<string>();

// Per-email client-side cooldown expiration timestamps
const signupCooldownTimestamps = new Map<string, number>();

/**
 * Auth Service layer:
 * - Customers: Powered by Firebase Authentication (Email/Password & Google OAuth) + Supabase database profile sync
 * - Administrators: Powered strictly by Supabase Auth with server/database role verification
 */
export const authService = {
  /**
   * Performs customer login via Firebase Authentication
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await customerAuthService.loginWithEmailPassword(payload);
    return {
      success: res.success,
      user: res.user,
      error: res.error,
    };
  },

  /**
   * Performs customer registration via Firebase Authentication
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();

    // Guard against duplicate in-flight registration calls
    if (inFlightRegistrations.has(cleanEmail)) {
      return {
        success: false,
        error: 'A registration request for this email is already being processed. Please wait a moment.',
      };
    }

    inFlightRegistrations.add(cleanEmail);
    try {
      const res = await customerAuthService.registerWithEmailPassword(payload);
      return {
        success: res.success,
        user: res.user,
        error: res.error,
        isAlreadyRegistered: res.isAlreadyRegistered,
      };
    } finally {
      inFlightRegistrations.delete(cleanEmail);
    }
  },

  /**
   * Returns remaining client-side cooldown seconds for a given email
   */
  getSignupCooldown(email: string): number {
    const clean = email.trim().toLowerCase();
    const expires = signupCooldownTimestamps.get(clean);
    if (!expires || Date.now() >= expires) return 0;
    return Math.ceil((expires - Date.now()) / 1000);
  },

  /**
   * Customer password reset via Firebase Authentication
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return customerAuthService.forgotPassword(email);
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
    await customerAuthService.logout();
  },

  /**
   * Customer Google OAuth Sign-In via Firebase Authentication
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    const res = await customerAuthService.signInWithGoogle();
    return {
      success: res.success,
      user: res.user,
      error: res.error,
    };
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

  /**
   * Verifies whether the current authenticated session possesses administrator privileges.
   * Checks both live profile in public.profiles and auth user metadata.
   */
  async verifyAdminSession(): Promise<{ isAdmin: boolean; user: UserProfile | null }> {
    try {
      if (!isSupabaseConfigured()) {
        return { isAdmin: false, user: null };
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        return { isAdmin: false, user: null };
      }

      let userRole: 'customer' | 'representative' | 'admin' = (user.user_metadata?.role as any) || 'customer';
      let userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator';
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

      const isFounder = user.email?.toLowerCase() === 'cookuwithcomali336@gmail.com';
      const isAdmin = userRole === 'admin' || isFounder;

      const userProfile: UserProfile = {
        id: user.id,
        name: userName,
        email: user.email || '',
        role: isAdmin ? 'admin' : userRole,
        repUsername,
        avatar: avatarUrl,
      };

      return {
        isAdmin,
        user: userProfile,
      };
    } catch {
      return { isAdmin: false, user: null };
    }
  },

  /**
   * Directly authenticates an administrator account via Supabase Auth.
   * This is strictly kept separate from customer Firebase authentication.
   */
  async supabaseAdminSignIn(payload: LoginPayload): Promise<AuthResponse> {
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
        error: 'Supabase authentication service is not configured. Please check your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.toLowerCase(),
        password: payload.password,
      });

      if (error) {
        return {
          success: false,
          error: mapAuthError(error, 'login'),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'No user record returned from Supabase authentication.',
        };
      }

      let userRole: 'customer' | 'representative' | 'admin' = (data.user.user_metadata?.role as any) || 'customer';
      let repUsername = data.user.user_metadata?.rep_username || undefined;
      let userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Administrator';
      let avatarUrl = data.user.user_metadata?.avatar_url || '/assets/ilovesurprises/Profile/profile%20image.webp';

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
        // non-blocking
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        name: userName,
        email: data.user.email || identifier.toLowerCase(),
        role: userRole,
        repUsername,
        avatar: avatarUrl,
      };

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
   * Authenticates an administrator via Supabase Auth + server-side role check.
   * Strictly enforces server-side role check:
   * If credentials are valid but the account lacks administrative privileges,
   * the session is immediately terminated (signOut) and access is denied.
   */
  async adminLogin(payload: LoginPayload): Promise<AuthResponse & { isAdmin?: boolean }> {
    const cleanEmail = payload.identifier.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      return {
        success: false,
        error: 'Please enter both your administrator email and password.',
      };
    }

    // 1. Authenticate with Supabase Auth strictly
    const res = await this.supabaseAdminSignIn(payload);
    if (!res.success || !res.user) {
      return res;
    }

    // 2. Strict Role Verification
    const sessionVerification = await this.verifyAdminSession();
    if (!sessionVerification.isAdmin) {
      // Immediately revoke session so non-admin customer account cannot retain an active admin token
      await this.adminLogout();
      return {
        success: false,
        error: 'Access denied. This account does not possess administrator privileges.',
      };
    }

    accountService.updateStoredUser(sessionVerification.user || res.user);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

    return {
      ...res,
      user: sessionVerification.user || res.user,
      isAdmin: true,
    };
  },

  /**
   * Signs out the administrator from Supabase Auth
   */
  async adminLogout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  },

  /**
   * Dispatches an administrator password reset email via Supabase Auth
   */
  async adminForgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid email address.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/admin/login?type=recovery`,
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
        message: `Administrator password reset instructions dispatched to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: mapAuthError(err, 'forgot_password'),
      };
    }
  },
};

