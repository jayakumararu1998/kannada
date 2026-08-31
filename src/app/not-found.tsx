import Link from "next/link";

import SiteChrome from "@/components/layout/SiteChrome";

export default function NotFound() {
  return (
    <SiteChrome>
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-kannada text-6xl font-bold">404</h1>
        <p className="font-kannada text-lg text-black/70 dark:text-white/70">
          ಕ್ಷಮಿಸಿ, ಈ ಪುಟ ಕಂಡುಬಂದಿಲ್ಲ.
        </p>
        <Link
          href="/"
          className="font-kannada text-sm underline underline-offset-4"
        >
          ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ
        </Link>
      </section>
    </SiteChrome>
  );
}
