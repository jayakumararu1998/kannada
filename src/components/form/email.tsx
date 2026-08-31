"use client";

import { FormEvent, useId, useState } from "react";

import ContinueButton from "@/components/ui/ContinueButton";
import { cn } from "@/lib/utils";

export type EmailFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export type EmailProps = {
  className?: string;
  logo?: EmailFieldConfig;
  title?: EmailFieldConfig;
  placeholder?: EmailFieldConfig;
  continueButton?: EmailFieldConfig;
  terms?: EmailFieldConfig;
  privacy?: EmailFieldConfig;
  copyright?: EmailFieldConfig;
  closeLabel?: string;
  termsHref?: string;
  privacyHref?: string;
  onClose?: () => void;
  onContinue?: (email: string) => void;
};

export default function Email({
  className,
  logo = { hidden: false, value: "ಕನ್ನಡಪ್ರಭ" },
  title = {
    hidden: false,
    value: "ದಿನನಿತ್ಯದ ಮೆಟ್ರೋಪಾಲಿಟಿನ್\nಪ್ರದೇಶದ ವೈಯಕ್ತಿಕ ಇನ್ಸೈಟ್ಸ್",
  },
  placeholder = { hidden: false, value: "Email Address" },
  continueButton = { hidden: false, value: "Continue" },
  terms = { hidden: false, value: "Terms of Us" },
  privacy = { hidden: false, value: "Private Policy" },
  copyright = { hidden: false, value: "© kannadaprabha 2026" },
  closeLabel = "Close",
  termsHref = "#",
  privacyHref = "#",
  onClose,
  onContinue,
}: EmailProps) {
  const emailId = useId();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue?.(email);
  };

  return (
    <section
      className={cn(
        "relative box-border h-auto w-full max-w-[423px] overflow-hidden border-t-[3px] border-t-transparent bg-[linear-gradient(90deg,#00a8e8_0%,#76b852_48%,#f5c542_100%)_top/100%_3px_no-repeat] bg-[var(--color-FFFFFF)] px-5 pb-[23px] pt-[47px] font-manrope text-111111 [@media(min-width:375px)]:px-9 [@media(min-width:423px)]:px-[60px]",
        className,
      )}
      aria-label="Email sign in"
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
            "mb-[28px] text-center text-35-kannada-900 leading-none text-111111 [text-shadow:0_2px_0_#ffffff,0_3px_0_#5b5b5b,1px_4px_0_#111111]",
            logo.customClass,
          )}
        >
          {logo.value}
        </h2>
      )}

      {!title.hidden && (
        <p
          className={cn(
            "mx-auto mb-[17px] whitespace-pre-line text-center text-16-inter-500 leading-140 text-1E1E1E",
            title.customClass,
          )}
        >
          {title.value}
        </p>
      )}

      <form className="w-full" onSubmit={handleSubmit}>
        {!placeholder.hidden && (
          <>
            <label className="sr-only" htmlFor={emailId}>
              {placeholder.value}
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              className={cn(
                "w-full border border-D2D2D2 bg-[var(--color-FFFFFF)] px-4 py-3 text-14-inter-400 leading-100 text-111111 outline-none placeholder:text-757575 focus:border-[var(--color-009EF9)]",
                placeholder.customClass,
              )}
              placeholder={placeholder.value}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        )}

        {!continueButton.hidden && (
          <ContinueButton
            className={cn("mt-[16px]", continueButton.customClass)}
          >
            {continueButton.value}
          </ContinueButton>
        )}
      </form>

      <footer className="mt-[60px] text-center text-12-inter-400 leading-140 text-000000">
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
