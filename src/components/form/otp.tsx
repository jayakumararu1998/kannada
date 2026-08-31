"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useId,
  useRef,
  useState,
} from "react";

import ContinueButton from "@/components/ui/ContinueButton";
import { cn } from "@/lib/utils";

export type OtpFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export type OtpProps = {
  className?: string;
  logo?: OtpFieldConfig;
  heading?: OtpFieldConfig;
  description?: OtpFieldConfig;
  resend?: OtpFieldConfig;
  continueButton?: OtpFieldConfig;
  terms?: OtpFieldConfig;
  privacy?: OtpFieldConfig;
  copyright?: OtpFieldConfig;
  closeLabel?: string;
  termsHref?: string;
  privacyHref?: string;
  length?: number;
  onClose?: () => void;
  onContinue?: (otp: string) => void;
  onResend?: () => void;
};

export default function Otp({
  className,
  logo = { hidden: false, value: "ಕನ್ನಡಪ್ರಭ" },
  heading = { hidden: false, value: "OTP ನಮೂದಿಸಿ" },
  description = {
    hidden: false,
    value:
      "cl***@gmail.com ಇವರಿಗೆ ಕಳುಹಿಸಲಾದ ನಮೂದಿಸಿ ಮತ್ತು\nಲಾಗಿನ್‌ಗಾಗಿ, ನಿಮ್ಮ OTPಯನ್ನು ಪರಿಶೀಲಿಸಿ",
  },
  resend = { hidden: false, value: "Resend OTP (10)" },
  continueButton = { hidden: false, value: "Continue" },
  terms = { hidden: false, value: "Terms of Us" },
  privacy = { hidden: false, value: "Private Policy" },
  copyright = { hidden: false, value: "© kannadaprabha 2026" },
  closeLabel = "Close",
  termsHref = "#",
  privacyHref = "#",
  length = 6,
  onClose,
  onContinue,
  onResend,
}: OtpProps) {
  const otpGroupId = useId();
  const [values, setValues] = useState(() => Array.from({ length }, () => ""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value.replace(/\D/g, "").slice(-1);
    const nextValues = [...values];
    nextValues[index] = nextValue;
    setValues(nextValues);

    if (nextValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue?.(values.join(""));
  };

  return (
    <section
      className={cn(
        "relative box-border h-auto w-full max-w-[423px] overflow-hidden border-t-[3px] border-t-transparent bg-[linear-gradient(90deg,#00a8e8_0%,#76b852_48%,#f5c542_100%)_top/100%_3px_no-repeat] bg-[var(--color-FFFFFF)] px-5 pb-[23px] pt-[47px] font-manrope text-111111 [@media(min-width:375px)]:px-9 [@media(min-width:423px)]:px-[60px]",
        className,
      )}
      aria-label="OTP verification"
    >
      <button
        type="button"
        className="absolute right-[19px] top-[17px] inline-flex items-center justify-center border-0 bg-transparent p-1 text-29-manrope-400 font-normal leading-none text-111111 transition-colors hover:text-6F6F6F focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-009EF9)]"
        aria-label={closeLabel}
        onClick={onClose}
      >
        ×
      </button>

      {!logo.hidden && (
        <h2
          className={cn(
            "mb-[27px] text-center text-35-kannada-900 leading-none text-111111 [text-shadow:0_2px_0_#ffffff,0_3px_0_#5b5b5b,1px_4px_0_#111111]",
            logo.customClass,
          )}
        >
          {logo.value}
        </h2>
      )}

      {!heading.hidden && (
        <h3
          className={cn(
            "mb-[11px] text-center text-16-inter-500 leading-140 text-1E1E1E",
            heading.customClass,
          )}
        >
          {heading.value}
        </h3>
      )}

      {!description.hidden && (
        <p
          className={cn(
            "mx-auto mb-[12px] whitespace-pre-line text-center text-12-kannada-400 leading-135 text-111111",
            description.customClass,
          )}
        >
          {description.value}
        </p>
      )}

      <form className="w-full" onSubmit={handleSubmit}>
        <div
          className="grid grid-cols-6 gap-[8px]"
          role="group"
          aria-labelledby={otpGroupId}
        >
          <span id={otpGroupId} className="sr-only">
            OTP code
          </span>
          {values.map((value, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={value}
              className="border border-D2D2D2 bg-[var(--color-FFFFFF)] px-1 py-2.5 text-center text-18-manrope-600 leading-none text-111111 outline-none focus:border-[var(--color-009EF9)]"
              aria-label={`OTP digit ${index + 1}`}
              onChange={(event) => handleChange(index, event)}
              onKeyDown={(event) => handleKeyDown(index, event)}
            />
          ))}
        </div>

        {!resend.hidden && (
          <button
            type="button"
            className={cn(
              "mx-auto mt-[13px] block border-0 bg-transparent p-0 font-manrope text-14-manrope-400 leading-none text-111111 hover:text-3742B8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-009EF9)]",
              resend.customClass,
            )}
            onClick={onResend}
          >
            {resend.value}
          </button>
        )}

        {!continueButton.hidden && (
          <ContinueButton
            className={cn("mt-[13px]", continueButton.customClass)}
          >
            {continueButton.value}
          </ContinueButton>
        )}
      </form>

      <footer className="mt-[26px] text-center text-12-inter-400 leading-140 text-000000">
        {(!terms.hidden || !privacy.hidden) && (
          <div className="flex items-stretch justify-center gap-[9px]">
            {!terms.hidden && (
              <a
                href={termsHref}
                className={cn(
                  "inline-flex items-center text-inherit no-underline",
                  terms.customClass,
                )}
              >
                {terms.value}
              </a>
            )}

            {!terms.hidden && !privacy.hidden && (
              <span className="border-l border-[var(--color-000000)]" />
            )}

            {!privacy.hidden && (
              <a
                href={privacyHref}
                className={cn(
                  "inline-flex items-center text-inherit no-underline",
                  privacy.customClass,
                )}
              >
                {privacy.value}
              </a>
            )}
          </div>
        )}

        {!copyright.hidden && (
          <p className={cn("mt-[13px]", copyright.customClass)}>
            {copyright.value}
          </p>
        )}
      </footer>
    </section>
  );
}
