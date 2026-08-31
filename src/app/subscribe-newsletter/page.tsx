import type { Metadata } from "next";

import SiteChrome from "@/components/layout/SiteChrome";
import RawEmbed from "@/components/article/elements/RawEmbed";
import { getStore } from "@/lib/builder/store";
import { siteConfig } from "@/config/site";

// Reads the builder store (newsletter code + SiteChrome) — render on demand
// so a builder push/pull takes effect without a redeploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ನ್ಯೂಸ್‌ಲೆಟರ್",
  description: `${siteConfig.name} ನ್ಯೂಸ್‌ಲೆಟರ್‌ಗೆ ಚಂದಾದಾರರಾಗಿ — ಪ್ರಮುಖ ಸುದ್ದಿಗಳು ನೇರವಾಗಿ ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ.`,
};

export default function SubscribeNewsletterPage() {
  // Builder-synced `kp_newsletter_code` website-setting: the MailerLite
  // universal loader + the `.ml-embedded` form container.
  const setting = getStore().getWebsiteSetting("kp_newsletter_code");
  const code =
    setting && setting.isActive !== false && typeof setting.value === "string"
      ? setting.value
      : "";

  return (
    <SiteChrome pageType="sectionPage">
      <div className="mx-auto w-full max-w-[720px] px-4 py-10 sm:px-6">
        <h1 className="mb-2 text-center text-20-balootamma2-700 font-bold uppercase text-183354 md:text-24-balootamma2-700">
          ನ್ಯೂಸ್‌ಲೆಟರ್
        </h1>
        <p className="mb-8 text-center text-15-inter-400 leading-[1.6] text-4A4A4A">
          ಪ್ರಮುಖ ಸುದ್ದಿಗಳು ಮತ್ತು ವಿಶೇಷ ವರದಿಗಳು ನೇರವಾಗಿ ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ —
          ಇಂದೇ ಚಂದಾದಾರರಾಗಿ.
        </p>

        {code ? (
          // RawEmbed re-creates the <script> nodes client-side so the
          // MailerLite loader actually executes and mounts the form.
          <RawEmbed raw embedJs={code} className="min-h-[320px]" />
        ) : (
          <p className="py-10 text-center text-15-inter-400 text-8B95A5">
            ನ್ಯೂಸ್‌ಲೆಟರ್ ಫಾರ್ಮ್ ಸದ್ಯ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ
            ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.
          </p>
        )}
      </div>
    </SiteChrome>
  );
}
