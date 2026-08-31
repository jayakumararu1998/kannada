"use client";

import { useState } from "react";

// Brand logo (same asset as the header/login) + its dark-mode (white) variant.
const LOGO_URL =
  "https://media.kannadaprabha.com/kannadaprabha/2026-08-11/lnydjlev/kp-logo-1.jpeg";
const LOGO_DARK_URL =
  "https://images.assettype.com/kannadaprabha/2026-08-28/4opcouok/darkmode-kp-with-tnie.png";

/**
 * "Advertise with us" inquiry form (ported from dinamani's AdvertiseForm).
 * Posts to the same-origin /api/advertise-inquiry route, which forwards to the
 * shared builder backend's /api/contact/send. Styled with the site's flip
 * tokens so it renders correctly in dark mode.
 */
export default function AdvertiseForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    contactNumber: "",
    email: "",
    remarks: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return cleaned.length >= 10 && /^\+?[0-9]+$/.test(cleaned);
  };

  const handleSubmit = async () => {
    setSubmitStatus(null);

    if (!formData.name.trim()) {
      setSubmitStatus({ type: "error", message: "Please enter your name" });
      return;
    }
    if (!formData.companyName.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter your company name",
      });
      return;
    }
    if (!formData.contactNumber.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter your contact number",
      });
      return;
    }
    if (!validatePhone(formData.contactNumber)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid contact number",
      });
      return;
    }
    if (!formData.email.trim()) {
      setSubmitStatus({ type: "error", message: "Please enter your email" });
      return;
    }
    if (!validateEmail(formData.email)) {
      setSubmitStatus({ type: "error", message: "Please enter a valid email" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/advertise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          companyName: formData.companyName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim(),
          remarks: formData.remarks.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: "Thank you! We will contact you soon.",
        });
        setFormData({
          name: "",
          companyName: "",
          contactNumber: "",
          email: "",
          remarks: "",
        });
        setTimeout(() => onClose(), 2000);
      } else {
        const errorData = await response.json().catch(() => null);
        setSubmitStatus({
          type: "error",
          message: errorData?.message || "Failed to submit. Please try again.",
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: "Failed to submit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded border border-D2D2D2 bg-FFFFFF px-3 text-14-inter-400 text-1E1E1E outline-none placeholder:text-808080 focus:border-009EF9";

  return (
    <div className="px-6 pb-6 pt-8">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-808080 transition-colors hover:bg-F9F9F9 hover:text-1E1E1E"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <path d="m18.3 5.7-1.4-1.4L12 9.2 7.1 4.3 5.7 5.7 10.6 10.6 5.7 15.5l1.4 1.4L12 12l4.9 4.9 1.4-1.4-4.9-4.9z" />
        </svg>
      </button>

      {/* Brand logo instead of the site name; swaps to white in dark mode. */}
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

      <h3 className="mt-4 text-center text-16-balootamma2-600 text-333333">
        To advertise on Kannadaprabha.com
      </h3>
      <p className="mt-1 text-center text-14-inter-400 text-808080">
        Please fill out the form below
      </p>

      <div className="-mx-6 mt-4 border-b border-DFDFDF" />

      {submitStatus && (
        <div
          className={`mt-4 rounded border px-3 py-2 text-center text-14-inter-400 ${
            submitStatus.type === "success"
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Name *"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Company Name *"
          value={formData.companyName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, companyName: e.target.value }))
          }
          className={inputClass}
        />
        <input
          type="tel"
          inputMode="tel"
          placeholder="Contact Number *"
          value={formData.contactNumber}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, contactNumber: e.target.value }))
          }
          className={inputClass}
        />
        <input
          type="email"
          inputMode="email"
          placeholder="Email *"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          className={inputClass}
        />
        <textarea
          placeholder="Remarks (Optional)"
          value={formData.remarks}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, remarks: e.target.value }))
          }
          rows={3}
          className="w-full resize-none rounded border border-D2D2D2 bg-FFFFFF p-3 text-14-inter-400 text-1E1E1E outline-none placeholder:text-808080 focus:border-009EF9"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-1 h-12 w-full rounded bg-[#2C39C6] text-16-balootamma2-600 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>

        <p className="mt-2 text-center text-12-inter-400 text-808080">
          You can also reach us at{" "}
          <a
            href="mailto:onlinesales@newindianexpress.com"
            className="text-009EF9 hover:underline"
          >
            onlinesales@newindianexpress.com
          </a>
          .<br />
          Our team will respond promptly.
        </p>

        <p className="text-center text-12-inter-400 text-808080">
          By submitting, you agree to our Terms of Use and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
