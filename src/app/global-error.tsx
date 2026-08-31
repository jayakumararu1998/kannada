"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches errors thrown by the root layout itself.
 * Must render its own <html>/<body> (it replaces the root layout). Also
 * replaces Next's built-in /_global-error page, whose static prerender crashes
 * under production React in this app ("Cannot read properties of null
 * (reading 'useContext')"), breaking `next build`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="kn">
      <body>
        <section
          style={{
            display: "flex",
            minHeight: "70vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "0 24px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>ಏನೋ ತಪ್ಪಾಗಿದೆ.</h1>
          <p style={{ color: "rgba(0,0,0,0.7)" }}>ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.</p>
          <button
            onClick={reset}
            style={{
              border: "1px solid rgba(0,0,0,0.2)",
              borderRadius: 4,
              padding: "8px 16px",
              fontSize: 14,
              background: "none",
              cursor: "pointer",
            }}
          >
            ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ
          </button>
        </section>
      </body>
    </html>
  );
}
