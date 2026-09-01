import type { UserProfile } from '../types';

export interface LoginPayload {
  identifier: string; // Email or Mobile Number
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role?: 'customer' | 'representative';
  repUsername?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
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
 * Auth Service layer - decoupled and ready for backend API endpoints
 * (e.g. POST /api/auth/login, POST /api/auth/register, POST /api/auth/forgot-password)
 */
export const authService = {
  /**
   * Performs user login
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    // Simulating authentic API network latency (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    const identifier = payload.identifier.trim();
    if (!identifier || !payload.password) {
      return {
        success: false,
        error: 'Please provide both email/mobile and password.',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    // In production, this calls `fetch('/api/auth/login', { ... })`
    const isEmail = identifier.includes('@');
    const namePart = isEmail
      ? identifier.split('@')[0].replace(/[._-]/g, ' ')
      : 'Shopper';
    const formattedName =
      namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const user: UserProfile = {
      id: 'usr-' + Date.now(),
      name: formattedName || 'Valued Customer',
      email: isEmail ? identifier : `${identifier.replace(/\D/g, '')}@customer.ilovesurprises.com`,
      mobile: isEmail ? undefined : identifier,
      role: 'customer',
      avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    };

    return {
      success: true,
      user,
      token: 'jwt-auth-token-' + Date.now(),
    };
  },

  /**
   * Performs user registration / sign up
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 500));

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

    if (!isValidMobile(payload.mobile)) {
      return {
        success: false,
        error: 'Please enter a valid 10-digit mobile number.',
      };
    }

    if (payload.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    const user: UserProfile = {
      id: 'usr-' + Date.now(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      mobile: payload.mobile.trim(),
      role: payload.role || 'customer',
      repUsername: payload.repUsername?.trim().toLowerCase(),
      avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
    };

    return {
      success: true,
      user,
      token: 'jwt-auth-token-' + Date.now(),
    };
  },

  /**
   * Initiates password reset flow
   */
  async forgotPassword(identifier: string): Promise<ForgotPasswordResponse> {
    await new Promise((resolve) => setTimeout(resolve, 450));

    if (!identifier.trim() || !isValidEmailOrMobile(identifier)) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid registered email or 10-digit mobile number.',
      };
    }

    const isEmail = identifier.includes('@');
    return {
      success: true,
      message: isEmail
        ? `We've prepared password reset instructions for ${identifier.trim()}. Please check your inbox.`
        : `We've prepared a verification OTP code for ${identifier.trim()}.`,
    };
  },
};
