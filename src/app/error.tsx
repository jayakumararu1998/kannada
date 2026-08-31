"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: wire up to an error-reporting service.
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-kannada text-3xl font-bold">
        ಏನೋ ತಪ್ಪಾಗಿದೆ.
      </h1>
      <p className="font-kannada text-black/70 dark:text-white/70">
        ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.
      </p>
      <button
        onClick={reset}
        className="font-kannada rounded border border-black/20 px-4 py-2 text-sm dark:border-white/20"
      >
        ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ
      </button>
    </section>
  );
}
