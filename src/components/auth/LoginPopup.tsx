"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { usePublicAuth } from "@/lib/auth/PublicAuthContext";

// Same logo asset the header uses.
const LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2026-08-11/lnydjlev/kp-logo-1.jpeg";
// Dark-mode logo (white version) shown when `.dark` is active.
const LOGO_DARK_URL =
  "https://images.assettype.com/kannadaprabha/2026-08-28/4opcouok/darkmode-kp-with-tnie.png";

/**
 * Email + OTP login modal (portaled to <body>). Two steps: enter email →
 * enter the 6-digit OTP. Backed by `PublicAuthContext` (same shared auth
 * backend as dinamani). Opened by any action that needs a signed-in user
 * (e.g. bookmarking); calls `onSuccess` once a token is obtained.
 */
export default function LoginPopup({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const {
    sendOTP,
    verifyOTP,
    resendOTP,
    authEmail,
    resendCountdown,
    isLoading,
    error,
    clearError,
    resetAuthState,
  } = usePublicAuth();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  useEffect(() => setMounted(true), []);

  // Reset to the email step each time the popup opens.
  useEffect(() => {
    if (open) {
      setStep("email");
      setOtp(["", "", "", "", "", ""]);
      setLocalError(null);
      clearError();
    }
  }, [open, clearError]);

  if (!mounted || !open) return null;

  const close = () => {
    resetAuthState();
    setEmail("");
    onClose();
  };

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const displayError = localError || error;

  const handleContinue = async () => {
    setLocalError(null);
    clearError();
    if (!validEmail(email.trim())) {
      setLocalError("ಮಾನ್ಯವಾದ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ");
      return;
    }
    const res = await sendOTP(email.trim());
    if (res.success) setStep("otp");
    else setLocalError(res.message || "OTP ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ");
  };

  const setDigit = (val: string, i: number) => {
    if (!/^[0-9]?$/.test(val)) return;
    setOtp((prev) => {
      const next = [...prev];
      next[i] = val;
      return next;
    });
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setLocalError("6 ಅಂಕೆಗಳನ್ನು ನಮೂದಿಸಿ");
      return;
    }
    const res = await verifyOTP(authEmail || email.trim(), code);
    if (res.success) {
      onSuccess?.();
      close();
    } else {
      setLocalError(res.message || "ತಪ್ಪಾದ OTP. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  const masked = (authEmail || email).replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-lg bg-FFFFFF shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-808080 transition-colors hover:bg-F9F9F9 hover:text-1E1E1E"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="m18.3 5.7-1.4-1.4L12 9.2 7.1 4.3 5.7 5.7 10.6 10.6 5.7 15.5l1.4 1.4L12 12l4.9 4.9 1.4-1.4-4.9-4.9z" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-8">
          {/* Brand logo (same asset as the header) instead of the site name.
              Swaps to the white logo in dark mode. */}
          <img
            src={LOGO_URL}
            alt="ಕನ್ನಡ ಪ್ರಭ"
            className="mx-auto h-auto w-[160px] dark:hidden"
          />
          <img
            src={LOGO_DARK_URL}
            alt="ಕನ್ನಡ ಪ್ರಭ"
            className="mx-auto hidden h-auto w-[160px] dark:block"
          />

          {displayError && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-center text-14-inter-400 text-red-600">
              {displayError}
            </div>
          )}

          {step === "email" ? (
            <div className="mt-6 flex flex-col gap-4">
              <h3 className="text-center text-16-balootamma2-600 text-333333">
                ಲಾಗಿನ್ ಅಥವಾ ನೋಂದಣಿ
              </h3>
              <input
                type="email"
                inputMode="email"
                placeholder="ಇಮೇಲ್ ವಿಳಾಸ"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (localError) setLocalError(null);
                  if (error) clearError();
                }}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                className="h-12 w-full rounded border border-D2D2D2 px-3 text-16-inter-400 text-1E1E1E outline-none focus:border-009EF9"
              />
              <button
                type="button"
                onClick={handleContinue}
                disabled={isLoading}
                className="h-12 w-full rounded bg-[#2C39C6] text-16-balootamma2-600 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "OTP ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…" : "ಮುಂದುವರಿಸಿ"}
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <h3 className="text-center text-16-balootamma2-600 text-333333">
                OTP ಪರಿಶೀಲನೆ
              </h3>
              <p className="text-center text-14-inter-400 text-808080">
                <span className="text-333333">{masked}</span> ಗೆ ಕಳುಹಿಸಿದ 6-ಅಂಕಿಯ
                OTP ನಮೂದಿಸಿ
              </p>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => setDigit(e.target.value, i)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0)
                        inputRefs.current[i - 1]?.focus();
                    }}
                    onPaste={
                      i === 0
                        ? (e) => {
                            e.preventDefault();
                            const d = e.clipboardData
                              .getData("text")
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            if (!d) return;
                            const next = ["", "", "", "", "", ""];
                            for (let k = 0; k < d.length; k++) next[k] = d[k];
                            setOtp(next);
                            inputRefs.current[Math.min(d.length, 5)]?.focus();
                          }
                        : undefined
                    }
                    className="h-12 w-11 rounded border border-D2D2D2 text-center text-20-inter-600 text-1E1E1E outline-none focus:border-009EF9"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => resendCountdown === 0 && resendOTP()}
                disabled={resendCountdown > 0 || isLoading}
                className="self-start text-12-inter-400 text-009EF9 disabled:text-808080"
              >
                {resendCountdown > 0
                  ? `OTP ಮರುಕಳುಹಿಸಿ (${resendCountdown}s)`
                  : "OTP ಮರುಕಳುಹಿಸಿ"}
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isLoading || otp.join("").length !== 6}
                className="h-12 w-full rounded bg-[#2C39C6] text-16-balootamma2-600 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ…" : "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂದುವರಿಸಿ"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
