"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import publicApiClient, { ApiError } from "../api/public-client";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified: boolean;
  created_at: string;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  email?: string;
  expires_in_seconds?: number;
  retryAfter?: number;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  is_new_user?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  authEmail: string;
  setAuthEmail: (email: string) => void;
  otpSent: boolean;
  otpExpiresIn: number;
  resendCountdown: number;

  sendOTP: (email: string) => Promise<SendOTPResponse>;
  verifyOTP: (email: string, otpCode: string) => Promise<VerifyOTPResponse>;
  resendOTP: () => Promise<SendOTPResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
  resetAuthState: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authEmail, setAuthEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(0);
  const [resendCountdown, setResendCountdown] = useState(0);

  const isAuthenticated = !!user;

  // Resend cooldown ticker.
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const fetchUser = useCallback(async () => {
    try {
      const res = await publicApiClient.get<{ success: boolean; user: User }>(
        "/auth/me",
      );
      if (res.success && res.user) setUser(res.user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        publicApiClient.removeToken();
        setUser(null);
      }
    }
  }, []);

  // Restore the session on mount when a token is present.
  useEffect(() => {
    if (publicApiClient.hasToken()) void fetchUser();
  }, [fetchUser]);

  const sendOTP = useCallback(
    async (email: string): Promise<SendOTPResponse> => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await publicApiClient.post<SendOTPResponse>(
          "/auth/send-otp",
          { email, purpose: "login" },
        );
        if (res.success) {
          setAuthEmail(email);
          setOtpSent(true);
          setOtpExpiresIn(res.expires_in_seconds || 300);
          setResendCountdown(60);
        }
        return res;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to send OTP";
        setError(message);
        if (err instanceof ApiError && err.status === 429) {
          const d = err.data as { retryAfter?: number };
          if (d?.retryAfter) setResendCountdown(d.retryAfter);
        }
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const verifyOTP = useCallback(
    async (email: string, otpCode: string): Promise<VerifyOTPResponse> => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await publicApiClient.post<VerifyOTPResponse>(
          "/auth/verify-otp",
          { email, otp_code: otpCode },
        );
        if (res.success && res.token) {
          publicApiClient.setToken(res.token);
          if (res.user) setUser(res.user);
          setOtpSent(false);
          setAuthEmail("");
        }
        return res;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : "Failed to verify OTP";
        setError(message);
        return { success: false, message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const resendOTP = useCallback((): Promise<SendOTPResponse> => {
    if (!authEmail)
      return Promise.resolve({ success: false, message: "No email set" });
    return sendOTP(authEmail);
  }, [authEmail, sendOTP]);

  const resetAuthState = useCallback(() => {
    setAuthEmail("");
    setOtpSent(false);
    setOtpExpiresIn(0);
    setResendCountdown(0);
    setError(null);
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await publicApiClient.post("/auth/logout");
    } catch {
      /* ignore */
    } finally {
      publicApiClient.removeToken();
      setUser(null);
      setIsLoading(false);
      resetAuthState();
    }
  }, [resetAuthState]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    authEmail,
    setAuthEmail,
    otpSent,
    otpExpiresIn,
    resendCountdown,
    sendOTP,
    verifyOTP,
    resendOTP,
    logout,
    clearError,
    resetAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function usePublicAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined)
    throw new Error("usePublicAuth must be used within a PublicAuthProvider");
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider. */
export function usePublicAuthSafe() {
  return useContext(AuthContext);
}
